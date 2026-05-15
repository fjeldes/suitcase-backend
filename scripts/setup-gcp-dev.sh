#!/bin/bash
set -e

PROJECT_ID="project-0555e0d7-6e59-4e0b-b59"
REGION="us-central1"
SA_NAME="kipgo-dev-sa"
REPO="kipgo-cloud-run"

echo "=== 1. Configurar proyecto GCP ==="
gcloud config set project $PROJECT_ID

echo "=== 2. Habilitar APIs necesarias ==="
gcloud services enable \
  run.googleapis.com \
  vpcaccess.googleapis.com \
  servicenetworking.googleapis.com \
  artifactregistry.googleapis.com \
  storage.googleapis.com \
  iamcredentials.googleapis.com \
  cloudresourcemanager.googleapis.com

echo "=== 3. Crear Artifact Registry repo ==="
gcloud artifacts repositories create $REPO \
  --repository-format docker \
  --location $REGION

echo "=== 4. Crear bucket para Terraform state ==="
gsutil mb -l $REGION gs://kipgo-terraform-state-${PROJECT_ID}

echo "=== 5. Crear service account para Cloud Run ==="
gcloud iam service-accounts create $SA_NAME \
  --display-name "KipGo Dev Cloud Run SA"

# Dar permisos para subir logs y leer secrets
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member "serviceAccount:${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role "roles/logging.logWriter"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member "serviceAccount:${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role "roles/storage.objectAdmin"

echo ""
echo "=== LISTO ==="
echo "Service account: ${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
echo "Artifact Registry: ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}"
echo ""
echo "Ahora ejecuta:"
echo "  1. gcloud auth configure-docker ${REGION}-docker.pkg.dev"
echo "  2. cd backend && docker build -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/kipgo-api:dev-latest ."
echo "  3. docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/kipgo-api:dev-latest"
echo "  4. cd terraform/environments/dev && terraform init && terraform apply"
