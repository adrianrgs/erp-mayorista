#!/usr/bin/env bash
#
# Despliega la app a Firebase. Por defecto sube TODO en el orden seguro:
#   1) Esquema (Data Connect)  ->  2) Backend (Cloud Run)  ->  3) Frontend (Hosting)
#
# Uso:
#   ./deploy.sh            # despliega las tres partes
#   ./deploy.sh front      # solo el frontend
#   ./deploy.sh back       # solo el backend
#   ./deploy.sh schema     # solo el esquema (Data Connect)
#
# También disponible como:  npm run deploy   (equivale a ./deploy.sh all)

set -euo pipefail

# gcloud puede no estar en el PATH según cómo se abra la terminal: lo aseguramos.
export PATH="/opt/homebrew/share/google-cloud-sdk/bin:$PATH"

# Ir a la raíz del repo (donde vive este script), sin importar desde dónde se ejecute.
cd "$(dirname "$0")"

REGION="us-central1"
SERVICE="foratour-api"
TARGET="${1:-all}"

deploy_schema() {
  echo ""
  echo "▶  ESQUEMA (Data Connect)…"
  firebase deploy --only dataconnect
  echo "✔  Esquema desplegado"
}

deploy_back() {
  echo ""
  echo "▶  BACKEND (Cloud Run: $SERVICE)…"
  gcloud run deploy "$SERVICE" --source apps/api --region "$REGION"
  echo "✔  Backend desplegado"
}

deploy_front() {
  echo ""
  echo "▶  FRONTEND (Firebase Hosting)…"
  npx vite build
  firebase deploy --only hosting
  echo "✔  Frontend desplegado"
}

case "$TARGET" in
  all)             deploy_schema; deploy_back; deploy_front ;;
  schema)          deploy_schema ;;
  back|backend)    deploy_back ;;
  front|frontend)  deploy_front ;;
  *)
    echo "Uso: ./deploy.sh [all|front|back|schema]"
    exit 1
    ;;
esac

echo ""
echo "🎉  Listo ($TARGET). App: https://foratour-erp-2026.web.app"
