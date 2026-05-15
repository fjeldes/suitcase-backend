# ─── MÓDULO: STORAGE ───────────────────────────────────────────────────────
#
# Google Cloud Storage (GCS) es el servicio de almacenamiento de objetos.
# El backend lo usa para:
#   - Subir imágenes de perfiles de usuarios (avatars)
#   - Almacenar fotos de las ubicaciones de luggage storage
#   - (Opcional) backups

# ─── 1. BUCKET ────────────────────────────────────────────────────────────
# Un bucket es como una "carpeta gigante" en la nube.
# El nombre debe ser único en TODOS los proyectos GCP (global).
# Por eso le agregamos el project_id al final.
resource "google_storage_bucket" "images" {
  name          = "suitcase-${var.env}-images-${var.project_id}"
  location      = var.location
  storage_class = "STANDARD"

  # uniform_bucket_level_access = true significa que NO usamos ACLs por objeto,
  # sino una política única para todo el bucket. Es más simple y seguro.
  uniform_bucket_level_access = true

  # Versioning: si subes un archivo con el mismo nombre, guarda la versión anterior.
  # Permite recuperar archivos borrados accidentalmente.
  versioning {
    enabled = true
  }

  # Lifecycle: borra objetos con más de 30 días de antigüedad.
  # Así no acumulamos imágenes viejas de perfiles que ya no existen.
  lifecycle_rule {
    condition {
      age = 30
    }
    action {
      type = "Delete"
    }
  }

  # CORS: permite que el frontend (web/mobile) suba archivos directamente al bucket.
  # Sin esto, el navegador bloquearía las peticiones por seguridad.
  cors {
    origin          = ["*"]
    method          = ["GET", "POST", "PUT", "DELETE"]
    response_header = ["*"]
    max_age_seconds = 3600
  }
}

# ─── 2. PERMISO DE LECTURA PÚBLICA ───────────────────────────────────────
# Hace que las imágenes sean accesibles públicamente (solo lectura).
# Así el frontend puede mostrar las imágenes sin necesidad de tokens firmados.
# Para subir imágenes, el backend usa una service account con más permisos.
resource "google_storage_bucket_iam_member" "public_read" {
  bucket = google_storage_bucket.images.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}
