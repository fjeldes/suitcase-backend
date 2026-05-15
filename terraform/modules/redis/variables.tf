variable "env" {
  description = "Entorno (dev/prod)."
  type        = string
}

variable "region" {
  description = "Región de GCP."
  type        = string
}

variable "vpc_id" {
  description = "ID de la VPC donde conectar Redis."
  type        = string
}

variable "redis_tier" {
  description = "STANDARD_HA (replicado, recomendado) o BASIC (una sola zona)."
  type        = string
  default     = "STANDARD_HA"
}

variable "redis_memory_size_gb" {
  description = "Memoria asignada a Redis en GB. Mínimo 1GB para STANDARD_HA."
  type        = number
  default     = 2
}
