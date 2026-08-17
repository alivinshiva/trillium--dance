# ShowGrid AWS Deployment Guide

## Architecture

```
Internet
    │
    ├─ S3 + CloudFront ─────── showgrid-landing (React/Vite SPA)
    │                          showgrid-admin  (React/Vite SPA)
    │
    └─ ALB (HTTPS:443)
         │
         ├─ /api/admin/* ────── ECS Fargate: be-admin (:5000)
         └─ /* (default) ───── ECS Fargate: showgrid-be (:5001)
                                   │
                                   └─ MongoDB Atlas (external)
```

### AWS Services Used

| Service | Purpose |
|---------|---------|
| **ECR** | Docker image registry for backend containers |
| **ECS Fargate** | Serverless container orchestration (no EC2 to manage) |
| **ALB** | Application Load Balancer — routes traffic, terminates SSL |
| **S3** | Static website hosting for React frontends |
| **CloudFront** | CDN — global edge caching + free SSL for frontends |
| **Secrets Manager** | Stores all API keys and secrets (never in code) |
| **CloudWatch Logs** | Centralized logging for all ECS tasks |
| **ACM** | Free SSL certificates for ALB and CloudFront |
| **IAM** | Fine-grained permissions for ECS tasks |
| **VPC** | Isolated network with public subnets across 2 AZs |
| **Terraform** | Infrastructure as Code — everything is version-controlled |

### Why ECS Fargate over EC2?

| | EC2 | ECS Fargate |
|---|---|---|
| Server management | SSH, patching, AMIs | Zero — AWS manages |
| Scaling | Auto Scaling Groups | Built-in service auto-scaling |
| Billing | Pay per instance-hour | Pay per task per second |
| High availability | Manual ALB setup | ALB + multi-AZ built-in |
| Deployments | SSH + restart | Zero-downtime rolling deploys |

---

## Prerequisites

```bash
# Install these first
aws --version          # AWS CLI v2
terraform --version    # Terraform >= 1.0
docker --version       # Docker Engine
node --version         # Node.js 22+
```

```bash
# Configure AWS credentials
aws configure
# Enter: Access Key ID, Secret Access Key, Region (ap-south-1), Output (json)
```

---

## Step-by-Step Deployment

### Phase 1: Terraform Remote State (one-time setup)

Terraform needs a place to store its state file. We use S3 + DynamoDB for locking.

```bash
# Create the state bucket (run once, outside Terraform)
aws s3 mb s3://showgrid-terraform-state --region ap-south-1

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region ap-south-1
```

### Phase 2: Initialize Terraform

```bash
cd infra/

# If .terraform/ doesn't exist yet
terraform init

# Preview what will be created
terraform plan

# Create everything
terraform apply
```

> **Note:** The first `terraform apply` will fail on S3 object uploads if `dist/` folders don't exist yet. Build frontends first (Phase 3), then re-run.

### Phase 3: Build Frontend & Upload to S3

```bash
# Build showgrid-landing
cd showgrid-landing
npm ci
npm run build
cd ..

# Build admin
cd admin
npm ci
npm run build
cd ..

# Upload to S3
aws s3 sync showgrid-landing/dist/ s3://showgrid-landing/ --delete
aws s3 sync admin/dist/ s3://showgrid-admin/ --delete
```

### Phase 4: Create ECR Repositories & Push Images

```bash
# Get ECR login token
aws ecr get-login-password --region ap-south-1 | \
  docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.ap-south-1.amazonaws.com

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URI=$ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com

# Build & push showgrid-be
cd showgrid-be
docker build -t showgrid-be .
docker tag showgrid-be:latest $ECR_URI/showgrid-be:latest
docker push $ECR_URI/showgrid-be:latest
cd ..

# Build & push be-admin
cd be-admin
docker build -t be-admin .
docker tag be-admin:latest $ECR_URI/showgrid-be-admin:latest
docker push $ECR_URI/showgrid-be-admin:latest
cd ..
```

### Phase 5: Deploy to ECS

```bash
# Force ECS to pull new images and restart tasks
aws ecs update-service --cluster showgrid-cluster --service showgrid-be --force-new-deployment
aws ecs update-service --cluster showgrid-cluster --service showgrid-be-admin --force-new-deployment
```

### Phase 6: ACM Certificate (for HTTPS on ALB)

```bash
# Option A: AWS Console (recommended for first time)
# 1. Go to AWS Console → Certificate Manager
# 2. Request a certificate → Enter your domain (e.g. api.showgrid.com)
# 3. Choose DNS validation
# 4. Add the CNAME record to your DNS provider
# 5. Wait for "Issued" status
# 6. Copy the certificate ARN
# 7. Update terraform.tfvars with the ARN

# Option B: Terraform DNS validation
# After terraform apply, run:
terraform output acm_certificate_domain_validation
# Add the CNAME records it outputs to your DNS, then:
terraform apply  # Will complete validation
```

### Phase 7: Point Domain to ALB

```bash
# Get ALB DNS name
terraform output alb_dns

# Create CNAME or A record in your DNS:
# api.showgrid.com → <ALB_DNS_NAME>
```

---

## CI/CD with GitHub Actions

### Setup (one-time)

1. Go to your GitHub repo → Settings → Secrets and variables → Actions
2. Add these **Repository Secrets**:

| Secret | Value |
|--------|-------|
| `AWS_ACCESS_KEY_ID` | Your IAM access key |
| `AWS_SECRET_ACCESS_KEY` | Your IAM secret key |
| `CLOUDFRONT_DISTRIBUTION_ID` | From `terraform output cloudfront_distribution_id` (optional) |

### How it works

Every push to `main`:
1. Builds both Docker images → pushes to ECR
2. Forces ECS to deploy new images (zero-downtime)
3. Builds both React frontends → syncs to S3
4. Invalidates CloudFront cache

### IAM Policy for GitHub Actions

Create an IAM user or use OIDC. Minimal policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecs:UpdateService",
        "ecs:DescribeServices"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::showgrid-landing",
        "arn:aws:s3:::showgrid-landing/*",
        "arn:aws:s3:::showgrid-admin",
        "arn:aws:s3:::showgrid-admin/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation"
      ],
      "Resource": "*"
    }
  ]
}
```

---

## Secrets Management

All secrets live in AWS Secrets Manager (never in code or `.env` files).

### What's stored

| Secret | Used By |
|--------|---------|
| `MONGO_URI` | Both backends |
| `CLERK_SECRET_KEY` | showgrid-be |
| `ANTHROPIC_API_KEY` | showgrid-be |
| `CLOUDINARY_CLOUD_NAME` | Both backends |
| `CLOUDINARY_API_KEY` | Both backends |
| `CLOUDINARY_API_SECRET` | Both backends |

### How ECS accesses secrets

The ECS task definition injects secrets as environment variables at runtime:

```hcl
secrets = [
  { name = "MONGO_URI", valueFrom = "arn:aws:secretsmanager:...:MONGO_URI::" }
]
```

The container sees them as normal env vars — no code changes needed.

### Updating secrets

```bash
# Update a secret value
aws secretsmanager update-secret \
  --secret-id showgrid-be-env \
  --secret-string '{"MONGO_URI":"new-uri","CLERK_SECRET_KEY":"new-key",...}'

# Force ECS to pick up new secrets
aws ecs update-service --cluster showgrid-cluster --service showgrid-be --force-new-deployment
```

---

## File Structure

```
infra/
├── main.tf              # Terraform provider + backend config
├── variables.tf         # Input variables (secrets go in terraform.tfvars)
├── outputs.tf           # Values Terraform prints after apply
├── vpc.tf               # VPC, subnets, internet gateway, route tables
├── ecr.tf               # ECR repositories + lifecycle policies
├── ecs.tf               # ECS cluster, task definitions, services
├── alb.tf               # ALB, target groups, HTTPS/HTTP listeners
├── s3.tf                # S3 buckets for frontend static hosting
├── acm.tf               # ACM SSL certificate
├── secrets.tf           # Secrets Manager secrets
├── security.tf          # Security groups (ALB + ECS tasks)
├── terraform.tfvars     # Actual secret values (GITIGNORED!)
└── DEPLOY.md            # This file

showgrid-be/
├── Dockerfile           # Docker build for user backend
├── .dockerignore        # Exclude node_modules, .env from image
├── server.js            # Express app entry point
└── package.json

be-admin/
├── Dockerfile           # Docker build for admin backend
├── .dockerignore
├── server.js
└── package.json

.github/workflows/
└── deploy.yml           # CI/CD pipeline (auto-deploy on push to main)
```

---

## Cost Estimate (ap-south-1)

| Service | Estimated Monthly Cost |
|---------|----------------------|
| ECS Fargate (2 tasks x 0.5 vCPU, 1GB) | ~$30 |
| ALB | ~$18 + data transfer |
| S3 (static hosting) | ~$1-3 |
| CloudFront | ~$1-5 (depends on traffic) |
| Secrets Manager | ~$1 |
| ECR | Free (within limits) |
| CloudWatch Logs | ~$1-5 |
| **Total** | **~$55-70/month** |

Compared to EC2 (t3.medium = ~$30/month + EBS + you manage everything), Fargate gives you HA, auto-scaling, zero patching, and zero-downtime deploys for roughly double the price.

---

## Useful Commands

```bash
# Terraform
cd infra && terraform init && terraform plan && terraform apply
terraform output alb_dns
terraform state list
terraform destroy  # tears down everything

# ECS
aws ecs list-services --cluster showgrid-cluster
aws ecs describe-services --cluster showgrid-cluster --services showgrid-be
aws ecs update-service --cluster showgrid-cluster --service showgrid-be --force-new-deployment
aws ecs execute-command --cluster showgrid-cluster --task <TASK_ID> --container showgrid-be --interactive --command "/bin/sh"

# Logs
aws logs tail /ecs/showgrid-be --follow
aws logs tail /ecs/showgrid-be-admin --follow

# S3
aws s3 ls s3://showgrid-landing/
aws s3 sync showgrid-landing/dist/ s3://showgrid-landing/ --delete

# ECR
aws ecr describe-images --repository-name showgrid-be --query 'sort_by(imageDetails,&imagePushedAt)[-5:]'

# Debug ECS failures
aws ecs describe-tasks --cluster showgrid-cluster --tasks <TASK_ARN>
```

---

## Troubleshooting

### ECS task keeps restarting
```bash
aws logs tail /ecs/showgrid-be --since 10m
```
Common causes: missing env vars, MongoDB connection failure, port conflict.

### ALB returns 502 Bad Gateway
- Check ECS tasks are `RUNNING` state
- Check security group allows ALB → ECS on ports 5000/5001
- Check target group health check path returns 200

### S3 website shows 403 Forbidden
- Check bucket policy allows public read
- Check `block_public_acls` is `false`

### Terraform state lock error
```bash
aws dynamodb delete-item \
  --table-name terraform-locks \
  --key '{"LockID":{"S":"showgrid-terraform-state/infra/terraform.tfstate"}}'
```
Only do this if you're sure no other apply is running.

### Frontend API calls fail with CORS
- Update `CORS_ORIGIN` in backend to include your S3/CloudFront domain
- The ECS task env vars need the new frontend URL

---

## Security Checklist

- [ ] `terraform.tfvars` is in `.gitignore` (never commit secrets)
- [ ] IAM user for CI/CD has minimum required permissions
- [ ] MongoDB Atlas IP whitelist includes ECS task IPs (or use 0.0.0.0/0 for Fargate)
- [ ] Clerk allowed origins include production frontend URLs
- [ ] CloudFront has WAF enabled (optional but recommended)
- [ ] ALB has deletion protection enabled (set `enable_deletion_protection = true`)
