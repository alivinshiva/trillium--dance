output "alb_dns" {
  value = aws_lb.main.dns_name
}

output "landing_s3_url" {
  value = aws_s3_bucket_website_configuration.landing.website_endpoint
}

output "admin_s3_url" {
  value = aws_s3_bucket_website_configuration.admin.website_endpoint
}

output "ecr_showgrid_be_url" {
  value = aws_ecr_repository.showgrid_be.repository_url
}

output "ecr_be_admin_url" {
  value = aws_ecr_repository.be_admin.repository_url
}

output "acm_certificate_arn" {
  value = aws_acm_certificate.main.arn
}

output "acm_certificate_domain_validation" {
  value = aws_acm_certificate.main.domain_validation_options
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "ecs_service_be" {
  value = aws_ecs_service.showgrid_be.name
}

output "ecs_service_admin" {
  value = aws_ecs_service.be_admin.name
}