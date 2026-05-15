output "instance_name" {
  description = "Nombre interno de la instancia Cloud SQL."
  value       = google_sql_database_instance.postgres.name
}

output "private_ip" {
  description = "IP privada de la BD. Es lo que va en DB_HOST del backend."
  value       = google_sql_database_instance.postgres.private_ip_address
}

output "database_name" {
  description = "Nombre de la BD (luggage_app)."
  value       = google_sql_database.database.name
}

output "app_user_name" {
  description = "Usuario de la BD para la app."
  value       = google_sql_user.app_user.name
}

output "connection_name" {
  description = "Nombre de conexión (proyecto:region:instancia). Útil para Cloud SQL Proxy."
  value       = google_sql_database_instance.postgres.connection_name
}
