# ─── OUTPUTS ────────────────────────────────────────────────────────────────
# Los outputs son valores que el módulo EXPONE hacia afuera.
# Así como las variables son los "argumentos de entrada", los outputs son
# los "valores de retorno". Otros módulos o el root module pueden leerlos.
#
# Nota el patrón: output "nombre" { value = recurso.atributo }
# Terraform sabe en qué orden crear/destruir recursos porque sigue estas
# referencias automáticamente.

output "vpc_id" {
  description = "ID de la VPC. Lo necesitan otros módulos (DB, Redis) para asociarse a la red."
  value       = google_compute_network.vpc.id
}

output "vpc_name" {
  description = "Nombre de la VPC."
  value       = google_compute_network.vpc.name
}

output "subnet_id" {
  description = "ID de la subnet creada."
  value       = google_compute_subnetwork.subnet.id
}

output "connector_id" {
  description = "ID del VPC connector. Cloud Run lo necesita para acceder a la red privada."
  value       = google_vpc_access_connector.connector.id
}

output "private_ip_range" {
  description = "IP del rango reservado para peering. Se pasa a Cloud SQL para que se asigne una IP privada."
  value       = google_compute_global_address.private_ip_range.address
}
