variable "env" {
  description = "Entorno: cambia el tier, disk size, alta disponibilidad, etc."
  type        = string
}

variable "project_id" {
  description = "ID del proyecto GCP."
  type        = string
}

variable "region" {
  description = "Región donde crear Cloud SQL."
  type        = string
}

variable "vpc_id" {
  description = "ID de la VPC. Cloud SQL se conecta a ella para tener IP privada."
  type        = string
}

variable "private_ip_range" {
  description = "Rango de IPs del peering. Se usa para autorizar conexiones desde el VPC connector."
  type        = string
}

variable "db_password" {
  description = "Contraseña del usuario de la BD. Marcada como 'sensitive' para que Terraform nunca la muestre en pantalla ni en logs."
  type        = string
  sensitive   = true
}

variable "db_tier" {
  description = "Tamaño de la máquina Cloud SQL. Opciones comunes: db-f1-micro (1 CPU, 0.6GB), db-custom-1-3840 (1 CPU, 3.75GB), etc."
  type        = string
  default     = "db-f1-micro"
}

variable "db_disk_size" {
  description = "Tamaño del disco en GB. SSD por defecto. Mínimo 10GB."
  type        = number
  default     = 10
}
