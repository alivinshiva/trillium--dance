resource "aws_secretsmanager_secret" "showgrid_be" {
  name = "${var.project_name}-be-env"
}

resource "aws_secretsmanager_secret_version" "showgrid_be" {
  secret_id = aws_secretsmanager_secret.showgrid_be.id
  secret_string = jsonencode({
    MONGO_URI              = var.mongo_uri
    CLERK_SECRET_KEY       = var.clerk_secret_key
    ANTHROPIC_API_KEY      = var.anthropic_api_key
    CLOUDINARY_CLOUD_NAME  = var.cloudinary_cloud_name
    CLOUDINARY_API_KEY     = var.cloudinary_api_key
    CLOUDINARY_API_SECRET  = var.cloudinary_api_secret
    PORT                   = "5001"
  })
}

resource "aws_secretsmanager_secret" "be_admin" {
  name = "${var.project_name}-be-admin-env"
}

resource "aws_secretsmanager_secret_version" "be_admin" {
  secret_id = aws_secretsmanager_secret.be_admin.id
  secret_string = jsonencode({
    MONGO_URI              = var.mongo_uri
    CLOUDINARY_CLOUD_NAME  = var.cloudinary_cloud_name
    CLOUDINARY_API_KEY     = var.cloudinary_api_key
    CLOUDINARY_API_SECRET  = var.cloudinary_api_secret
    PORT                   = "5000"
  })
}