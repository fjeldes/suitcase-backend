output "bucket_name" {
  description = "Nombre del bucket. Va en GCS_BUCKET_NAME del backend."
  value       = google_storage_bucket.images.name
}

output "bucket_url" {
  description = "URL pública del bucket."
  value       = "https://storage.googleapis.com/${google_storage_bucket.images.name}"
}
