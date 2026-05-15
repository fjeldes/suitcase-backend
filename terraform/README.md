# Suitcase Infrastructure (Terraform)

## Requisitos previos

- GCP project creado
- `gcloud` CLI instalado y autenticado
- Terraform >= 1.6

## Setup inicial (solo una vez)

### 1. Crear bucket de estado

```bash
gcloud storage buckets create gs://suitcase-terraform-state --location=us-central1
gcloud storage buckets update gs://suitcase-terraform-state --versioning
```

### 2. Crear Artifact Registry para imágenes Docker

```bash
gcloud artifacts repositories create suitcase-cloud-run \
  --repository-format=docker \
  --location=us-central1
```

### 3. Crear service account para Terraform y Cloud Run

```bash
# Service account para Cloud Run
gcloud iam service-accounts create suitcase-dev-sa \
  --display-name="Suitcase Dev Cloud Run SA"

gcloud iam service-accounts create suitcase-prod-sa \
  --display-name="Suitcase Prod Cloud Run SA"
```

### 4. Configurar GitHub Actions (Workload Identity Federation)

```bash
# 1. Crear un pool de identidad
gcloud iam workload-identity-pools create "suitcase-pool" \
  --location="global" \
  --display-name="Suitcase GitHub Pool"

# 2. Obtener el ID del pool
POOL_ID=$(gcloud iam workload-identity-pools describe "suitcase-pool" \
  --location="global" --format="value(name)")

# 3. Crear el provider para GitHub
gcloud iam workload-identity-pools providers create-oidc "github-provider" \
  --location="global" \
  --workload-identity-pool="suitcase-pool" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --attribute-condition="attribute.repository == 'tu-usuario/suitcase-backend'"

# 4. Dar permisos al service account
gcloud iam service-accounts add-iam-policy-binding "suitcase-dev-sa@PROJECT.iam.gserviceaccount.com" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/$POOL_ID/attribute.repository/tu-usuario/suitcase-backend"
```

### 5. Agregar secrets a GitHub

| Secret | Descripción |
|---|---|
| `GCP_WIF_PROVIDER` | `projects/.../locations/global/workloadIdentityPools/suitcase-pool/providers/github-provider` |
| `GCP_SERVICE_ACCOUNT` | `suitcase-dev-sa@PROJECT.iam.gserviceaccount.com` |
| `DB_PASSWORD` | Password para Cloud SQL PostgreSQL |

## Variables de entorno (GitHub Actions vars)

| Variable | Descripción |
|---|---|
| `GCP_PROJECT_ID` | ID del proyecto GCP |
| `IMAGE_URL` | `us-central1-docker.pkg.dev/PROJECT/suitcase-cloud-run/suitcase-api` |
| `SERVICE_ACCOUNT_EMAIL` | Email del service account de Cloud Run |

## Desplegar

### Manual (desarrollo local)

```bash
cd terraform/environments/dev
cp terraform.tfvars.example terraform.tfvars
# editar terraform.tfvars con tus valores

terraform init
terraform plan
terraform apply
```

### CI/CD (GitHub Actions)

El pipeline está en `.github/workflows/`:

- **CI** (`.github/workflows/ci.yml`): corre en push/PR, ejecuta tests, build Docker, push a Artifact Registry
- **CD** (`.github/workflows/cd.yml`): corre en push a `main`/`develop`, ejecuta Terraform plan/apply

## Estructura

```
terraform/
├── modules/
│   ├── network/       # VPC, subnets, VPC connector
│   ├── database/      # Cloud SQL PostgreSQL
│   ├── redis/         # Memorystore Redis
│   ├── storage/       # GCS bucket para imágenes
│   └── cloud-run/     # Cloud Run service
├── environments/
│   ├── dev/           # Entorno desarrollo
│   └── prod/          # Entorno producción
└── global/            # Referencia bucket estado
```

## Variables secretas en Secret Manager

Las siguientes variables se almacenan en Secret Manager y se referencian desde Cloud Run:

| Secret | Descripción |
|---|---|
| `google-client-id` | Google OAuth Client ID |
| `jwt-secret` | JWT signing secret |
| `resend-api-key` | Resend email API key |
| `stripe-secret-key` | Stripe secret key |
| `stripe-publishable-key` | Stripe publishable key |
| `stripe-webhook-secret` | Stripe webhook signing secret |
| `gcs-client-email` | GCS service account email |
| `gcs-private-key` | GCS service account private key |

Para crearlos:

```bash
echo -n "valor" | gcloud secrets create google-client-id --data-file=-
echo -n "valor" | gcloud secrets create jwt-secret --data-file=-
echo -n "valor" | gcloud secrets create resend-api-key --data-file=-
echo -n "valor" | gcloud secrets create stripe-secret-key --data-file=-
echo -n "valor" | gcloud secrets create stripe-publishable-key --data-file=-
echo -n "valor" | gcloud secrets create stripe-webhook-secret --data-file=-
echo -n "valor" | gcloud secrets create gcs-client-email --data-file=-
echo -n "valor" | gcloud secrets create gcs-private-key --data-file=-
```
