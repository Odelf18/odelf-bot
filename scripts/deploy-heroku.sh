#!/usr/bin/env bash
# Deploy the Freqtrade bot image to Heroku (linux/amd64 + Docker v2 manifest).
# Usage: ./scripts/deploy-heroku.sh [app-name]
set -euo pipefail

APP="${1:-odelf-bot}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IMAGE="registry.heroku.com/${APP}/web"

cd "$ROOT"

echo "==> Logging into Heroku Container Registry"
heroku container:login

REGION="$(heroku info -a "${APP}" 2>/dev/null | awk -F': *' '/Region/{print $2}' | tr -d '[:space:]' || true)"
echo "==> App region: ${REGION:-unknown}"
if [[ -n "${REGION}" && "${REGION}" != "eu" ]]; then
  echo "WARNING: ${APP} is in '${REGION}', not 'eu'."
  echo "Binance.com returns HTTP 451 from US Heroku dynos."
  echo "Run: ./scripts/heroku-eu-setup.sh ${APP}"
  echo "Aborting deploy."
  exit 1
fi

echo "==> Waiting for Postgres DATABASE_URL (if still provisioning)"
for i in $(seq 1 30); do
  if heroku config:get DATABASE_URL -a "${APP}" >/dev/null 2>&1 \
    && [[ -n "$(heroku config:get DATABASE_URL -a "${APP}" 2>/dev/null || true)" ]]; then
    echo "    DATABASE_URL is set"
    break
  fi
  echo "    waiting… ($i/30)"
  sleep 5
done

echo "==> Building linux/amd64 image (Docker v2 schema, Heroku-compatible)"
# Heroku registry rejects OCI-only manifests → disable attestations + oci mediatypes.
# Bust cache on user_data so config/strategy changes always ship.
docker buildx build \
  --platform linux/amd64 \
  --provenance=false \
  --sbom=false \
  --output "type=docker,name=${IMAGE},oci-mediatypes=false" \
  --build-arg "CACHEBUST=$(date +%s)" \
  .

echo "==> Pushing ${IMAGE}"
docker push "${IMAGE}"

echo "==> Releasing web on ${APP}"
# Retry — new apps sometimes lag registry metadata
for i in 1 2 3 4 5; do
  if heroku container:release web -a "${APP}"; then
    break
  fi
  echo "    release failed (attempt $i), waiting 8s…"
  sleep 8
  if [[ "$i" -eq 5 ]]; then
    echo "Release still failing. Try manually:"
    echo "  heroku container:push web -a ${APP}"
    echo "  # or: heroku plugins:install heroku-container-registry && heroku container:release web -a ${APP}"
    exit 1
  fi
done

echo "==> Scaling web=1"
heroku ps:scale web=1 -a "${APP}" || true

echo "==> Recent logs"
heroku logs -a "${APP}" -n 50

echo "Done. API: https://${APP}.herokuapp.com"
echo "Check region: heroku info -a ${APP} | grep -i region"
