# ─── MÓDULO: CLOUD RUN ─────────────────────────────────────────────────────
#
# Cloud Run es un servicio serverless de Google para correr contenedores.
# Ventajas vs GKE (Kubernetes) o Compute Engine (VMs):
#   ✅ Escala a 0 cuando no hay tráfico → ahorras dinero
#   ✅ Escala automáticamente según la demanda
#   ✅ No gestionas servidores ni clústeres
#   ✅ Pagas solo por el tiempo de ejecución (por request)
#
# Para NestJS es perfecto: es una API stateless que puede escalar horizontalmente.

# locals: variables locales al módulo (no son inputs ni outputs).
# Útiles para evitar repetir strings.
locals {
  service_name = "suitcase-${var.env}-api"
}

# ─── 1. SERVICIO CLOUD RUN ────────────────────────────────────────────────
resource "google_cloud_run_service" "api" {
  name     = local.service_name
  location = var.region
  project  = var.project_id

  # template define la configuración de cada "revision" (versión) del servicio
  template {
    spec {
      # service_account: qué permisos tiene el contenedor al hacer llamadas a GCP
      service_account_name = var.service_account_email

      # container_concurrency: cuántos requests simultáneos maneja UNA instancia
      # NestJS con async/await puede manejar varios. 80 es buen balance.
      container_concurrency = 80

      # timeout: tiempo máximo que puede durar un request. BullMQ jobs largos ¯\_(ツ)_/¯
      timeout_seconds = 300

      # ─── DEFINICIÓN DEL CONTENEDOR ──────────────────────────────────────
      containers {
        # image: dónde está la imagen Docker (Artifact Registry)
        image = var.image_url

        # Límites de CPU y memoria por instancia
        resources {
          limits = {
            cpu    = var.cpu_limit
            memory = var.memory_limit
          }
        }

        # El puerto donde NestJS escucha (configuramos en main.ts)
        ports {
          container_port = 3000
        }

        # ─── VARIABLES DE ENTORNO ─────────────────────────────────────────
        # Aquí van las variables que el backend necesita para funcionar.
        # Algunas van en texto plano (no sensibles), otras desde Secret Manager.

        # Node environment
        env {
          name  = "NODE_ENV"
          value = var.env == "prod" ? "production" : "development"
        }

        # PORT lo auto-asigna Cloud Run, no lo seteamos manualmente

        # ─── Conexión a BD (valores planos, no son "secretos") ──────────
        env {
          name  = "DB_HOST"
          value = var.db_host
        }
        env {
          name  = "DB_PORT"
          value = tostring(var.db_port)  # tostring: convierte número a string (envs son strings)
        }
        env {
          name  = "DB_USER"
          value = var.db_user
        }
        env {
          name  = "DB_PASS"
          value = var.db_password
        }
        env {
          name  = "DB_NAME"
          value = var.db_name
        }

        # ─── Redis ────────────────────────────────────────────────────────
        env {
          name  = "REDIS_HOST"
          value = var.redis_host
        }
        env {
          name  = "REDIS_PORT"
          value = tostring(var.redis_port)
        }

        # ─── GCS ──────────────────────────────────────────────────────────
        env {
          name  = "GCS_BUCKET_NAME"
          value = var.storage_bucket_name
        }
        env {
          name  = "GCS_PROJECT_ID"
          value = var.project_id
        }

        # ─── SECRETOS ─────────────────────────────────────────────────────
        # Los secretos se almacenan en Secret Manager (no en variables de entorno).
        # value_from.secret_key_ref le dice a Cloud Run:
        #   "Ve a buscar el secreto con nombre X, versión latest, y ponlo en esta env var"
        #
        # ¿Por qué no usar Terraform para crearlos? Porque los valores reales
        # (API keys, tokens) los pones tú manualmente en Secret Manager por seguridad.

        env {
          name  = "GOOGLE_CLIENT_ID"
          value_from {
            secret_key_ref {
              key  = "latest"
              name = "google-client-id"
            }
          }
        }

        env {
          name  = "JWT_SECRET"
          value_from {
            secret_key_ref {
              key  = "latest"
              name = "jwt-secret"
            }
          }
        }

        env {
          name  = "JWT_EXPIRES_IN"
          value = "1d"  # No es secreto, va en texto plano
        }

        env {
          name  = "RESEND_API_KEY"
          value_from {
            secret_key_ref {
              key  = "latest"
              name = "resend-api-key"
            }
          }
        }

        env {
          name  = "STRIPE_SECRET_KEY"
          value_from {
            secret_key_ref {
              key  = "latest"
              name = "stripe-secret-key"
            }
          }
        }

        env {
          name  = "STRIPE_PUBLISHABLE_KEY"
          value_from {
            secret_key_ref {
              key  = "latest"
              name = "stripe-publishable-key"
            }
          }
        }

        env {
          name  = "STRIPE_WEBHOOK_SECRET"
          value_from {
            secret_key_ref {
              key  = "latest"
              name = "stripe-webhook-secret"
            }
          }
        }

        env {
          name  = "GCS_CLIENT_EMAIL"
          value_from {
            secret_key_ref {
              key  = "latest"
              name = "gcs-client-email"
            }
          }
        }

        env {
          name  = "GCS_PRIVATE_KEY"
          value_from {
            secret_key_ref {
              key  = "latest"
              name = "gcs-private-key"
            }
          }
        }
      }
    }

    # ─── ANOTACIONES (metadata) ──────────────────────────────────────────
    # Configuraciones de infraestructura que no son del contenedor en sí.
    metadata {
      annotations = {
        # Escalado automático: mínimo N instancias, máximo M
        "autoscaling.knative.dev/minScale" = tostring(var.min_instances)
        "autoscaling.knative.dev/maxScale" = tostring(var.max_instances)

        # Conecta Cloud Run a la VPC (para acceder a Cloud SQL y Redis)
        "run.googleapis.com/vpc-access-connector" = var.connector_id

        # private-ranges-only: solo enruta tráfico PRIVADO por el connector
        # El tráfico a internet (ej: API de Stripe) sale directo, no por la VPC
        "run.googleapis.com/vpc-access-egress" = "private-ranges-only"

        # all: permite tráfico desde internet (público). Se define en metadata del servicio
        # "run.googleapis.com/ingress" = "all"

        # gen2: segunda generación de Cloud Run (mejor performance, más features)
        "run.googleapis.com/execution-environment" = "gen2"
      }
    }
  }

  # each time the template changes, Cloud Run creates a new revision
  autogenerate_revision_name = true

  # ingress setting at service level (not template)
  metadata {
    annotations = {
      "run.googleapis.com/ingress" = "all"
    }
  }

  # depends on the service being enabled
}

# ─── 2. PERMISO DE ACCESO PÚBLICO ─────────────────────────────────────────
# Por defecto Cloud Run es privado (solo autenticado).
# Esto permite que cualquiera (con la URL) pueda llamar a la API.
# La autenticación del backend se maneja a nivel de aplicación (JWT).
resource "google_cloud_run_service_iam_member" "public_access" {
  location = var.region
  project  = var.project_id
  service  = google_cloud_run_service.api.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
