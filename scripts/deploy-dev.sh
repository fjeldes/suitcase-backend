#!/bin/bash
set -e

echo "=== Deploy KipGo Backend to Dev ==="

# Config - cámbialo a tus valores
PROJECT_ID="tu-proyecto-gcp"
REGION="us-central1"
REPO="kipgo-cloud-run"
TAG="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/kipgo-api:dev-latest"

echo "1. Build Docker image..."
docker build -t $TAG ..

echo "2. Push to Artifact Registry..."
docker push $TAG

echo "3. Deploy with Terraform..."
cd ../terraform/environments/dev
terraform init
terraform apply -auto-approve \
  -var="project_id=${PROJECT_ID}" \
  -var="supabase_db_host=$(grep SUPABASE_DB_HOST ../../.env.dev | cut -d= -f2)" \
  -var="supabase_db_password=$(grep SUPABASE_DB_PASS ../../.env.dev | head -1 | cut -d= -f2-)" \
  -var="image_url=${TAG}" \
  -var="service_account_email=kipgo-dev-sa@${PROJECT_ID}.iam.gserviceaccount.com"

echo "=== Done ==="
