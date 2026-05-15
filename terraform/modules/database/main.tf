# ─── MÓDULO: DATABASE ──────────────────────────────────────────────────────
#
# Cloud SQL es el servicio administrado de PostgreSQL/MySQL de GCP.
# ¿Por qué Cloud SQL y no una VM con PostgreSQL?
#   - Backups automáticos ✅
#   - Parches de seguridad automáticos ✅
#   - Réplica multi-zona (alta disponibilidad) ✅
#   - Tú solo te preocupas por el esquema de datos
#
# Eso sí: es más caro que una VM (~$15-50/mes vs ~$5-10/mes en VM).

# ─── 1. INSTANCIA DE POSTGRESQL ──────────────────────────────────────────
# Este recurso crea el servidor de PostgreSQL en sí.
# Nota: solo crea el servidor, no la base de datos (eso viene después).
resource "google_sql_database_instance" "postgres" {
  name             = "suitcase-${var.env}-pg"
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    # tier = el tamaño de la máquina (CPU + RAM)
    tier              = var.db_tier
    disk_size         = var.db_disk_size
    disk_type         = "PD_SSD"

    # REGIONAL = datos replicados en 2 zonas (mayor disponibilidad, más caro)
    # ZONAL   = datos en 1 zona (más barato, si la zona cae, la BD cae)
    availability_type = var.env == "prod" ? "REGIONAL" : "ZONAL"

    # Configuración de red: SOLO IP PRIVADA
    # IPv4 desactivado = sin IP pública. Solo accesible desde la VPC.
    ip_configuration {
      ipv4_enabled    = false
      private_network = var.vpc_id

      # Autorizamos el rango del VPC connector para que Cloud Run pueda entrar
      authorized_networks {
        name  = "cloud-run-connector"
        value = var.private_ip_range
      }
    }

    # Backups automáticos diarios a las 3 AM (hora local de la región)
    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = true  # Permite restaurar a cualquier punto en las últimas 24h
      start_time                     = "03:00"
      transaction_log_retention_days = 7     # Guarda logs de transacciones por 7 días
      backup_retention_settings {
        retained_backups = var.env == "prod" ? 14 : 7  # Más backups en prod por seguridad
      }
    }

    # Flags de PostgreSQL: ajustes personalizados del motor
    database_flags {
      name  = "max_connections"
      value = var.env == "prod" ? "200" : "50"
    }
  }

  # Protección contra borrado accidental:
  # - En PROD: no deja destruir con "terraform destroy" sin antes poner esto en false
  # - En DEV: se puede destruir libremente
  deletion_protection = var.env == "prod"
}

# ─── 2. BASE DE DATOS ─────────────────────────────────────────────────────
# Esto crea la database DENTRO de la instancia de PostgreSQL.
# Es el equivalente a: CREATE DATABASE luggage_app;
resource "google_sql_database" "database" {
  name     = "luggage_app"
  instance = google_sql_database_instance.postgres.name
}

# ─── 3. USUARIO ────────────────────────────────────────────────────────────
# Crea un usuario dentro de PostgreSQL.
# El usuario "postgres" administrador ya viene por defecto.
# Este es un usuario app con solo los permisos que necesita.
resource "google_sql_user" "app_user" {
  name     = "suitcase_app"
  instance = google_sql_database_instance.postgres.name
  password = var.db_password
}

# ─── 4. CERTIFICADO SSL (opcional, comentado) ──────────────────────────────
# count = 0 significa "crear 0 instancias de este recurso" = no crear nada.
# Lo dejamos aquí como referencia por si quieres habilitar SSL en el futuro.
# Si cambias count = 1, Terraform crearía un certificado SSL para conexiones seguras.
resource "google_sql_ssl_cert" "client_cert" {
  count    = 0
  instance = google_sql_database_instance.postgres.name
}
