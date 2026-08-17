# S3 bucket for showgrid-landing
resource "aws_s3_bucket" "landing" {
  bucket = "${var.project_name}-landing"
}

resource "aws_s3_bucket_website_configuration" "landing" {
  bucket = aws_s3_bucket.landing.id

  index_document { suffix = "index.html" }
  error_document { key = "index.html" }
}

resource "aws_s3_bucket_public_access_block" "landing" {
  bucket                  = aws_s3_bucket.landing.id
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "landing" {
  bucket = aws_s3_bucket.landing.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "PublicReadGetObject"
      Effect    = "Allow"
      Principal = "*"
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.landing.arn}/*"
    }]
  })
}

# S3 bucket for admin
resource "aws_s3_bucket" "admin" {
  bucket = "${var.project_name}-admin"
}

resource "aws_s3_bucket_website_configuration" "admin" {
  bucket = aws_s3_bucket.admin.id

  index_document { suffix = "index.html" }
  error_document { key = "index.html" }
}

resource "aws_s3_bucket_public_access_block" "admin" {
  bucket                  = aws_s3_bucket.admin.id
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "admin" {
  bucket = aws_s3_bucket.admin.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "PublicReadGetObject"
      Effect    = "Allow"
      Principal = "*"
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.admin.arn}/*"
    }]
  })
}

# Upload landing dist to S3
resource "aws_s3_bucket_object" "landing_files" {
  for_each = fileset("${path.module}/../showgrid-landing/dist", "**/*")

  bucket       = aws_s3_bucket.landing.id
  key          = each.value
  source       = "${path.module}/../showgrid-landing/dist/${each.value}"
  etag         = filemd5("${path.module}/../showgrid-landing/dist/${each.value}")
  content_type = lookup(
    {
      "html" = "text/html"
      "css"  = "text/css"
      "js"   = "application/javascript"
      "json" = "application/json"
      "png"  = "image/png"
      "jpg"  = "image/jpeg"
      "svg"  = "image/svg+xml"
      "woff" = "font/woff"
      "woff2"= "font/woff2"
    },
    split(".", each.value)[length(split(".", each.value)) - 1],
    "application/octet-stream"
  )
}

# Upload admin dist to S3
resource "aws_s3_bucket_object" "admin_files" {
  for_each = fileset("${path.module}/../admin/dist", "**/*")

  bucket       = aws_s3_bucket.admin.id
  key          = each.value
  source       = "${path.module}/../admin/dist/${each.value}"
  etag         = filemd5("${path.module}/../admin/dist/${each.value}")
  content_type = lookup(
    {
      "html" = "text/html"
      "css"  = "text/css"
      "js"   = "application/javascript"
      "json" = "application/json"
      "png"  = "image/png"
      "jpg"  = "image/jpeg"
      "svg"  = "image/svg+xml"
    },
    split(".", each.value)[length(split(".", each.value)) - 1],
    "application/octet-stream"
  )
}