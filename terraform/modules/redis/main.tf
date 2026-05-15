# ─── MÓDULO: REDIS ─────────────────────────────────────────────────────────
#
# Memorystore es el servicio administrado de Redis en GCP.
# ¿Por qué Redis? Se usa para:
#   - BullMQ (cola de trabajos: notificaciones push, envío de emails)
#   - Rate limiting (@nestjs/throttler)
#   - Caché (sesiones, datos frecuentes)
#
# Al igual que Cloud SQL, lo conectamos a la VPC privada para que solo
# los servicios internos (Cloud Run via VPC connector) puedan acceder.

resource "google_redis_instance" "redis" {
  # El nombre debe ser único en la región
  name           = "suitcase-${var.env}-redis"

  # STANDARD_HA = replicado en 2 zonas (alta disponibilidad)
  # BASIC       = una sola instancia (más barato, sin failover automático)
  tier           = var.redis_tier

  # Memoria: 1GB para dev, 2GB para prod (BullMQ + caché)
  memory_size_gb = var.redis_memory_size_gb
  region         = var.region

  # Zonas donde se despliega (para alta disponibilidad)
  location_id             = "${var.region}-a"
  alternative_location_id = "${var.region}-b"

  redis_version     = "REDIS_7_0"  # Coincide con docker-compose (redis:7-alpine)
  display_name      = "Suitcase ${var.env} Redis"

  # Rango de IPs reservado para esta instancia de Redis
  # Debe ser un /29 (8 IPs) que no se solape con otros rangos de la VPC
  reserved_ip_range = var.env == "prod" ? "10.20.0.0/29" : "10.21.0.0/29"

  # Modo de conexión: solo privado (PRIVATE_SERVICE_ACCESS)
  connect_mode       = "PRIVATE_SERVICE_ACCESS"
  authorized_network = var.vpc_id

  # Persistencia: guarda un snapshot cada 24h para no perder datos si se reinicia
  persistence_config {
    persistence_mode = "RDB"
    rdb_snapshot_period = "TWENTY_FOUR_HOURS"
  }
}
