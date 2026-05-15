variable "env" {
  description = "Entorno (dev/prod)."
  type        = string
}

variable "project_id" {
  description = "ID del proyecto. Se usa en el nombre del bucket para hacerlo único globalmente."
  type        = string
}

variable "location" {
  description = "Ubicación del bucket. US-CENTRAL1 es barato, pero puedes poner la misma región que tu app para menor latencia."
  type        = string
  default     = "US-CENTRAL1"
}
