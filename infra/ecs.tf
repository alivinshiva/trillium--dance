resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# IAM role for ECS task execution
resource "aws_iam_role" "ecs_execution" {
  name = "${var.project_name}-ecs-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "ecs_secrets" {
  name = "secrets-access"
  role = aws_iam_role.ecs_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["secretsmanager:GetSecretValue"]
      Resource = [
        aws_secretsmanager_secret.showgrid_be.arn,
        aws_secretsmanager_secret.be_admin.arn
      ]
    }]
  })
}

# Task Definition: showgrid-be
resource "aws_ecs_task_definition" "showgrid_be" {
  family                   = "${var.project_name}-be"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_execution.arn

  container_definitions = jsonencode([{
    name      = "showgrid-be"
    image     = "${aws_ecr_repository.showgrid_be.repository_url}:latest"
    essential = true
    portMappings = [{
      containerPort = 5001
      hostPort      = 5001
      protocol      = "tcp"
    }]

    secrets = [
      { name = "MONGO_URI",             valueFrom = "${aws_secretsmanager_secret.showgrid_be.arn}:MONGO_URI::" },
      { name = "CLERK_SECRET_KEY",      valueFrom = "${aws_secretsmanager_secret.showgrid_be.arn}:CLERK_SECRET_KEY::" },
      { name = "ANTHROPIC_API_KEY",     valueFrom = "${aws_secretsmanager_secret.showgrid_be.arn}:ANTHROPIC_API_KEY::" },
      { name = "CLOUDINARY_CLOUD_NAME", valueFrom = "${aws_secretsmanager_secret.showgrid_be.arn}:CLOUDINARY_CLOUD_NAME::" },
      { name = "CLOUDINARY_API_KEY",    valueFrom = "${aws_secretsmanager_secret.showgrid_be.arn}:CLOUDINARY_API_KEY::" },
      { name = "CLOUDINARY_API_SECRET", valueFrom = "${aws_secretsmanager_secret.showgrid_be.arn}:CLOUDINARY_API_SECRET::" },
    ]

    environment = [
      { name = "PORT", value = "5001" }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/${var.project_name}-be"
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])
}

# Task Definition: be-admin
resource "aws_ecs_task_definition" "be_admin" {
  family                   = "${var.project_name}-be-admin"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_execution.arn

  container_definitions = jsonencode([{
    name      = "be-admin"
    image     = "${aws_ecr_repository.be_admin.repository_url}:latest"
    essential = true
    portMappings = [{
      containerPort = 5000
      hostPort      = 5000
      protocol      = "tcp"
    }]

    secrets = [
      { name = "MONGO_URI",             valueFrom = "${aws_secretsmanager_secret.be_admin.arn}:MONGO_URI::" },
      { name = "CLOUDINARY_CLOUD_NAME", valueFrom = "${aws_secretsmanager_secret.be_admin.arn}:CLOUDINARY_CLOUD_NAME::" },
      { name = "CLOUDINARY_API_KEY",    valueFrom = "${aws_secretsmanager_secret.be_admin.arn}:CLOUDINARY_API_KEY::" },
      { name = "CLOUDINARY_API_SECRET", valueFrom = "${aws_secretsmanager_secret.be_admin.arn}:CLOUDINARY_API_SECRET::" },
    ]

    environment = [
      { name = "PORT", value = "5000" }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/${var.project_name}-be-admin"
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])
}

# ECS Services
resource "aws_ecs_service" "showgrid_be" {
  name            = "${var.project_name}-be"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.showgrid_be.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.public_a.id, aws_subnet.public_b.id]
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.showgrid_be.arn
    container_name   = "showgrid-be"
    container_port   = 5001
  }

  depends_on = [aws_lb_listener.https]
}

resource "aws_ecs_service" "be_admin" {
  name            = "${var.project_name}-be-admin"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.be_admin.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.public_a.id, aws_subnet.public_b.id]
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.be_admin.arn
    container_name   = "be-admin"
    container_port   = 5000
  }

  depends_on = [aws_lb_listener_rule.admin]
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "showgrid_be" {
  name              = "/ecs/${var.project_name}-be"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "be_admin" {
  name              = "/ecs/${var.project_name}-be-admin"
  retention_in_days = 30
}