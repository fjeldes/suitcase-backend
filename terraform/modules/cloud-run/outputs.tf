output "service_name" {
  description = "Nombre del servicio en Cloud Run."
  value       = google_cloud_run_service.api.name
}

output "service_url" {
  description = "URL pública de la API. Ej: https://suitcase-dev-api-xxxxx-uc.a.run.app"
  value       = google_cloud_run_service.api.status[0].url
}
