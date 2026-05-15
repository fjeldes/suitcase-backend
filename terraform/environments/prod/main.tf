# ─── ENTORNO: PROD ─────────────────────────────────────────────────────────
#
# Misma estructura que dev, pero con configuraciones más robustas:
#
# Diferencias clave vs dev:
#   - DB: tier más grande (db-custom-1-3840), disco más grande (20GB), alta disponibilidad regional
#   - Redis: 2GB de memoria
#   - Cloud Run: min 1 instancia (sin cold start), max 5 instancias, más CPU/RAM
#   - deletion_protection = true en la BD (no se puede borrar accidentalmente)

terraform {
  required_version = ">= 1.6"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
  }

  backend "gcs" {
    bucket = "suitcase-terraform-state"
    prefix = "prod"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

resource "google_project_service" "apis" {
  for_each = toset([
    "sqladmin.googleapis.com",
    "redis.googleapis.com",
    "run.googleapis.com",
    "vpcaccess.googleapis.com",
    "servicenetworking.googleapis.com",
    "storage.googleapis.com",
    "secretmanager.googleapis.com",
    "artifactregistry.googleapis.com",
    "iamcredentials.googleapis.com",
  ])

  service               = each.key
  disable_on_destroy    = false
}

module "network" {
  source     = "../../modules/network"
  env        = "prod"
  region     = var.region
  project_id = var.project_id

  depends_on = [google_project_service.apis]
}

module "database" {
  source           = "../../modules/database"
  env              = "prod"
  project_id       = var.project_id
  region           = var.region
  vpc_id           = module.network.vpc_id
  private_ip_range = module.network.private_ip_range
  db_password      = var.db_password
  db_tier          = "db-custom-1-3840"   # 1 vCPU, 3.75GB RAM → suficiente para prod
  db_disk_size     = 20                    # Más espacio para crecimiento

  depends_on = [google_project_service.apis, module.network]
}

module "redis" {
  source              = "../../modules/redis"
  env                 = "prod"
  region              = var.region
  vpc_id              = module.network.vpc_id
  redis_tier          = "STANDARD_HA"
  redis_memory_size_gb = 2

  depends_on = [google_project_service.apis, module.network]
}

module "storage" {
  source     = "../../modules/storage"
  env        = "prod"
  project_id = var.project_id

  depends_on = [google_project_service.apis]
}

module "cloud_run" {
  source                = "../../modules/cloud-run"
  env                   = "prod"
  project_id            = var.project_id
  region                = var.region
  connector_id          = module.network.connector_id
  db_host               = module.database.private_ip
  db_user               = module.database.app_user_name
  db_password           = var.db_password
  db_name               = module.database.database_name
  redis_host            = module.redis.host
  redis_port            = module.redis.port
  storage_bucket_name   = module.storage.bucket_name
  image_url             = var.image_url
  service_account_email = var.service_account_email
  min_instances         = 1                    # 1 instancia siempre activa (sin cold start)
  max_instances         = 5                    # Hasta 5 en picos de tráfico
  cpu_limit             = "2"                  # 2 vCPU
  memory_limit          = "1Gi"                # 1GB RAM

  depends_on = [module.network, module.database, module.redis, module.storage]
}
