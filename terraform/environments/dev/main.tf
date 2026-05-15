# ─── ENTORNO: DEV ─────────────────────────────────────────────────────────
#
# Este archivo es el "punto de entrada" (root module) para el entorno dev.
# Aquí ARMAMOS el rompecabezas: llamamos a los módulos y conectamos sus outputs.
#
# Flujo de datos entre módulos:
#   network ──vpc_id──→ database
#   network ──vpc_id──→ redis
#   network ──connector_id──→ cloud_run
#   database ──private_ip──→ cloud_run (DB_HOST)
#   redis ──host──→ cloud_run (REDIS_HOST)
#   storage ──bucket_name──→ cloud_run

# ─── CONFIGURACIÓN GLOBAL ──────────────────────────────────────────────────
# required_version: la versión MÍNIMA de Terraform que necesitas.
#   >= 1.6 significa "cualquier 1.6 o superior".
terraform {
  required_version = ">= 1.6"

  # required_providers: qué providers (plugins) necesita Terraform.
  # En este caso, el provider "google" de HashiCorp, versión 6.x (~> 6.0 = compatible con 6.x).
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
  }

  # ─── BACKEND ──────────────────────────────────────────────────────────────
  # El backend define DÓNDE se guarda el "state file" (terraform.tfstate).
  # El state file es el archivo más importante de Terraform:
  #   - Contiene el mapa de todos los recursos que Terraform creó
  #   - Sin él, Terraform no sabe qué recursos ya existen
  #
  # En desarrollo local, el state se guarda en un archivo local (terraform.tfstate).
  # Pero en equipo/CI/CD necesitamos un backend REMOTO compartido.
  #
  # gcs = Google Cloud Storage. El bucket debe existir ANTES de correr terraform init.
  # prefix = carpeta virtual dentro del bucket (dev/ y prod/ comparten el mismo bucket).
  backend "gcs" {
    bucket = "kipgo-terraform-state-project-0555e0d7-6e59-4e0b-b59"
    prefix = "dev"
  }
}

# ─── PROVIDER ──────────────────────────────────────────────────────────────
# El provider es el plugin que sabe cómo comunicarse con GCP.
# project y region son obligatorios. La autenticación depende de dónde corres:
#   - Local: usa gcloud auth application-default login
#   - CI/CD: usa Workload Identity Federation
provider "google" {
  project = var.project_id
  region  = var.region
}

# ─── APIs ──────────────────────────────────────────────────────────────────
# GCP requiere habilitar cada servicio (API) antes de usarlo.
# for_each recorre un set de strings y crea un recurso por cada uno.
# Es como un for-loop: por cada API en la lista, crea un google_project_service.
#
# disable_on_destroy = false: cuando hagas terraform destroy, no deshabilita la API
# (porque otros proyectos pueden usarla y deshabilitarla rompería cosas).
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

# ─── MÓDULOS ───────────────────────────────────────────────────────────────
# Cada bloque "module" instancia un módulo de la carpeta ../../modules/.
# source = ruta relativa al módulo.
# Los argumentos (env, region, etc.) son las variables que cada módulo espera.
#
# depends_on: le dice a Terraform "espera a que este otro recurso esté listo".
# Sin depends_on, Terraform intenta crear todo en paralelo (lo máximo posible),
# pero algunos recursos necesitan que otros existan primero.
# Normalmente Terraform lo deduce de las referencias automáticamente,
# pero con for_each y project_service a veces necesita ayuda.

# Red / VPC
module "network" {
  source     = "../../modules/network"
  env        = "dev"
  region     = var.region
  project_id = var.project_id

  depends_on = [google_project_service.apis]
}

# Base de datos - usando Supabase (no Cloud SQL)
# TODO: Si migras a Cloud SQL, descomentar este módulo y eliminar las variables directas abajo
# module "database" {
#   source           = "../../modules/database"
#   env              = "dev"
#   project_id       = var.project_id
#   region           = var.region
#   vpc_id           = module.network.vpc_id
#   private_ip_range = module.network.private_ip_range
#   db_password      = var.db_password
#   db_tier          = "db-f1-micro"
#   db_disk_size     = 10
#   depends_on = [google_project_service.apis, module.network]
# }

# TODO: Descomentar cuando se requiera Redis:
# module "redis" {
#   source              = "../../modules/redis"
#   env                 = "dev"
#   region              = var.region
#   vpc_id              = module.network.vpc_id
#   redis_tier          = "STANDARD_HA"
#   redis_memory_size_gb = 1
#   depends_on = [google_project_service.apis, module.network]
# }

# Storage
module "storage" {
  source     = "../../modules/storage"
  env        = "dev"
  project_id = var.project_id

  depends_on = [google_project_service.apis]
}

# Cloud Run
module "cloud_run" {
  source                = "../../modules/cloud-run"
  env                   = "dev"
  project_id            = var.project_id
  region                = var.region
  connector_id          = module.network.connector_id
  # Usando Supabase en vez de Cloud SQL:
  db_host               = var.supabase_db_host
  db_port               = 5432
  db_user               = "postgres"
  db_password           = var.supabase_db_password
  db_name               = "postgres"
  storage_bucket_name   = module.storage.bucket_name
  image_url             = var.image_url
  service_account_email = var.service_account_email
  min_instances         = 0
  max_instances         = 2
  cpu_limit             = "1"
  memory_limit          = "512Mi"

  depends_on = [module.network, module.storage]
}
