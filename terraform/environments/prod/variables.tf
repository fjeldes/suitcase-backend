variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "us-central1"
}

variable "db_password" {
  description = "Cloud SQL PostgreSQL password"
  type        = string
  sensitive   = true
}

variable "image_url" {
  description = "Docker image URL in Artifact Registry"
  type        = string
}

variable "service_account_email" {
  description = "Cloud Run service account email"
  type        = string
}
