# ─── MÓDULO: NETWORK ───────────────────────────────────────────────────────
#
# Este módulo crea la red privada (VPC) donde vivirán todos los servicios.
# Conceptos clave de networking en GCP:
#
# VPC (Virtual Private Cloud):
#   Es tu red privada dentro de GCP. Aísla tus recursos del resto de internet.
#   Piensa en ella como un "edificio" donde solo tú tienes llaves.
#
# Subnet:
#   Es una subdivisión de la VPC con un rango de IPs (CIDR).
#   Los recursos dentro de una misma subnet pueden comunicarse directamente.
#
# VPC Connector:
#   Cloud Run es serverless (no tiene IP fija). Para que pueda acceder a
#   recursos privados (Cloud SQL, Redis), necesita un "puente" → VPC connector.
#
# Private Service Peering:
#   Google tiene servicios como Cloud SQL que no viven DENTRO de tu VPC,
#   sino en una VPC de Google. El peering crea un "túnel" entre ambas.

# ─── 1. VPC (Virtual Private Cloud) ──────────────────────────────────────
# Este es el recurso raíz de toda la red.
# auto_create_subnetworks = false evita que GCP cree subnets automáticas,
# así controlamos nosotros los rangos de IP.
resource "google_compute_network" "vpc" {
  name                    = "suitcase-${var.env}-vpc"
  auto_create_subnetworks = false
}

# ─── 2. SUBNET ───────────────────────────────────────────────────────────
# Una subred con un rango de IP específico.
# En prod usamos 10.0.x.x, en dev 10.1.x.x para que no se mezclen.
# private_ip_google_access permite que recursos sin IP pública (como Cloud Run
# via VPC connector) accedan a servicios internos de Google (Cloud SQL, etc.).
resource "google_compute_subnetwork" "subnet" {
  name          = "suitcase-${var.env}-subnet"
  ip_cidr_range = var.env == "prod" ? "10.0.0.0/16" : "10.1.0.0/16"
  region        = var.region
  network       = google_compute_network.vpc.id

  private_ip_google_access = true
}

# ─── 3. VPC CONNECTOR ─────────────────────────────────────────────────────
# Cloud Run no tiene IP propia (es serverless). Para que pueda hablar con
# Cloud SQL y Redis (que están en la VPC), necesita este conector.
# Cada vez que Cloud Run recibe un request, crea una "mini-VM" en el connector
# para salir a la VPC. Por eso tiene min/max instances.
# Nota: tiene costo (~$0.10/hora por instancia aprox).
resource "google_vpc_access_connector" "connector" {
  name          = "suitcase-${var.env}-connector"
  region        = var.region
  network       = google_compute_network.vpc.name
  ip_cidr_range = var.env == "prod" ? "10.10.0.0/28" : "10.11.0.0/28"

  # e2-micro = la más barata (~$0.01/hora). Suficiente para conectar.
  machine_type  = "e2-micro"
  min_instances = 2
  max_instances = 3
}

# ─── 4. RANGO DE IPs PARA PEERING ─────────────────────────────────────────
# Cloud SQL no se crea dentro de tu VPC, sino en una VPC administrada por Google.
# Para conectarlas necesitamos un "peering" (como un puente entre dos VPCs).
# Primero reservamos un rango de IPs que Google usará para su VPC.
resource "google_compute_global_address" "private_ip_range" {
  name          = "suitcase-${var.env}-private-ip-range"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.vpc.id
}

# ─── 5. CONEXIÓN DE PEERING ──────────────────────────────────────────────
# Aquí creamos el puente entre nuestra VPC y la VPC de servicios de Google.
# Sin esto, Cloud SQL no tendría IP privada dentro de nuestra red.
resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = google_compute_network.vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_range.name]
}
