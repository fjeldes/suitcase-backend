variable "env" {
  description = "Entorno."
  type        = string
}

variable "project_id" {
  description = "ID del proyecto GCP."
  type        = string
}

variable "region" {
  description = "Región de GCP."
  type        = string
}

variable "connector_id" {
  description = "ID del VPC connector para acceder a Cloud SQL y Redis. Vacío si no se necesita."
  type        = string
  default     = ""
}

variable "db_host" {
  description = "IP privada de Cloud SQL."
  type        = string
}

variable "db_port" {
  description = "Puerto de PostgreSQL."
  type        = number
  default     = 5432
}

variable "db_user" {
  description = "Usuario de la BD."
  type        = string
}

variable "db_password" {
  description = "Contraseña de la BD. Se pasa como variable sensible, pero en Cloud Run se la entregamos como env var."
  type        = string
  sensitive   = true
}

variable "db_name" {
  description = "Nombre de la BD."
  type        = string
}

variable "redis_host" {
  description = "IP privada de Memorystore Redis."
  type        = string
  default     = ""
}

variable "redis_port" {
  description = "Puerto de Redis."
  type        = number
  default     = 6379
}

variable "storage_bucket_name" {
  description = "Nombre del bucket GCS para imágenes."
  type        = string
}

variable "image_url" {
  description = "URL completa de la imagen en Artifact Registry. Ej: us-central1-docker.pkg.dev/PROJECT/REPO/suitcase-api:latest"
  type        = string
}

variable "service_account_email" {
  description = "Email del service account que usará Cloud Run para autenticarse contra otros servicios GCP."
  type        = string
}

variable "min_instances" {
  description = "Mínimo de instancias siempre activas (0 = escala a cero). En prod pon 1 para evitar latencia inicial (cold start)."
  type        = number
  default     = 0
}

variable "max_instances" {
  description = "Máximo de instancias simultáneas. Límite de escalado horizontal."
  type        = number
  default     = 3
}

variable "cpu_limit" {
  description = "CPU por instancia. '1' = 1 vCPU, '2' = 2 vCPU."
  type        = string
  default     = "1"
}

variable "memory_limit" {
  description = "RAM por instancia. '512Mi', '1Gi', '2Gi', etc."
  type        = string
  default     = "512Mi"
}
