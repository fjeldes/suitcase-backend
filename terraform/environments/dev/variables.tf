variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "us-central1"
}

variable "supabase_db_host" {
  description = "Supabase PostgreSQL host"
  type        = string
}

variable "supabase_db_password" {
  description = "Supabase PostgreSQL password"
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
