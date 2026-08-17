variable "aws_region" {
  default = "ap-south-1"
}

variable "project_name" {
  default = "showgrid"
}

variable "mongo_uri" {
  type = string
  sensitive = true
}

variable "clerk_secret_key" {
  type = string
  sensitive = true
}

variable "anthropic_api_key" {
  type = string
  sensitive = true
}

variable "cloudinary_cloud_name" {
  type = string
  sensitive = true
}

variable "cloudinary_api_key" {
  type = string
  sensitive = true
}

variable "cloudinary_api_secret" {
  type = string
  sensitive = true
}

variable "domain_name" {
  description = "Primary domain (e.g. api.showgrid.com)"
  default     = ""
}