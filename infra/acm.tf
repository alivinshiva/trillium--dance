# ACM SSL Certificate
# Created via Terraform with DNS validation
# After terraform apply, add the CNAME validation record to your DNS

variable "domain_name" {
  description = "Primary domain (e.g. api.showgrid.com)"
  default     = ""
}

resource "aws_acm_certificate" "main" {
  domain_name       = var.domain_name
  validation_method = "DNS"
  tags              = { Name = "${var.project_name}-cert" }
  lifecycle         { create_before_destroy = true }
}
