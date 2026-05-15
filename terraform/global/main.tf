# ─── BUCKET DE ESTADO (referencia) ─────────────────────────────────────────
#
# ¡IMPORTANTE! Este bucket NO se crea con Terraform.
#
# ¿Por qué? Porque el backend de Terraform necesita leer el state para saber
# qué recursos existen. Si Terraform creara el bucket, al hacer "terraform init"
# todavía no existiría → error de "huevo y la gallina".
#
# Por eso se crea MANUALMENTE con gcloud:
#
#   gcloud storage buckets create gs://suitcase-terraform-state \
#     --location=us-central1
#
#   gcloud storage buckets update gs://suitcase-terraform-state --versioning
#
# Luego, en cada entorno (dev/prod), el bloque "backend" apunta a este bucket:
#
#   terraform {
#     backend "gcs" {
#       bucket = "suitcase-terraform-state"
#       prefix = "dev"   # o "prod"
#     }
#   }
#
# Nota: el versioning lo activamos para poder recuperar versiones anteriores
# del state en caso de error (Terraform tiene un comando "terraform state pull"
# para listar versiones).
