# ─── VARIABLES ──────────────────────────────────────────────────────────────
# Las variables son los "parámetros" de entrada de un módulo.
# Piensa en ellas como los argumentos de una función:
#   - name: el nombre del parámetro
#   - description: qué espera recibir (solo documentación)
#   - type: el tipo de dato (string, number, bool, list, map, etc.)
#   - default: valor por si no se pasa (opcional; si no se pone, es requerida)

variable "env" {
  description = "Entorno: 'dev' o 'prod'. Se usa para nombrar recursos y ajustar configs."
  type        = string
}

variable "region" {
  description = "Región de GCP donde crear los recursos. Ej: us-central1, us-east1, southamerica-east1"
  type        = string
}

variable "project_id" {
  description = "ID del proyecto GCP. Se obtiene de la consola de GCP."
  type        = string
}
