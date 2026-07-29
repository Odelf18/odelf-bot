#!/usr/bin/env bash
# Recreate the Heroku app in the EU region (required for Binance.com access).
# Heroku cannot change region in-place — we rename the old US app and create a new EU app.
#
# Usage:
#   ./scripts/heroku-eu-setup.sh              # uses odelf-bot
#   ./scripts/heroku-eu-setup.sh odelf-bot
#
# After this script: ./scripts/deploy-heroku.sh odelf-bot
set -euo pipefail

APP="${1:-odelf-bot}"
OLD_APP="${APP}-us-old"
REGION="eu"

echo "==> Checking current region for ${APP} (if it exists)"
if heroku apps:info -a "${APP}" >/dev/null 2>&1; then
  CURRENT_REGION="$(heroku info -a "${APP}" 2>/dev/null | awk -F': *' '/Region/{print $2}' | tr -d '[:space:]' || true)"
  echo "    Current region: ${CURRENT_REGION:-unknown}"
  if [[ "${CURRENT_REGION}" == "eu" ]]; then
    echo "Already in EU. Nothing to do."
    heroku info -a "${APP}"
    exit 0
  fi

  echo "==> Exporting config vars (secrets stay on your machine only for this session)"
  heroku config -a "${APP}" -s > "/tmp/${APP}.env"
  echo "    Saved to /tmp/${APP}.env"

  echo "==> Renaming ${APP} → ${OLD_APP}"
  heroku apps:rename "${OLD_APP}" -a "${APP}"
else
  echo "    No existing app named ${APP}"
  : > "/tmp/${APP}.env"
fi

echo "==> Creating ${APP} in region ${REGION}"
heroku create "${APP}" --region "${REGION}"

echo "==> Setting container stack"
heroku stack:set container -a "${APP}"

echo "==> Adding Postgres (EU)"
heroku addons:create heroku-postgresql:essential-0 -a "${APP}" || \
  heroku addons:create heroku-postgresql:mini -a "${APP}" || true

echo "==> Restoring config vars (skipping DATABASE_URL — new Postgres has its own)"
if [[ -s "/tmp/${APP}.env" ]]; then
  # Avoid `source` — it prints secrets into the terminal when heroku config:set echoes values.
  # Pass file through a filtered config:set instead.
  FILTERED="$(mktemp)"
  grep -E '^(API_USERNAME|API_PASSWORD|JWT_SECRET_KEY|FREQTRADE_STRATEGY|FREQTRADE__EXCHANGE__KEY|FREQTRADE__EXCHANGE__SECRET)=' \
    "/tmp/${APP}.env" > "${FILTERED}" || true
  if [[ -s "${FILTERED}" ]]; then
    # shellcheck disable=SC2046
    heroku config:set -a "${APP}" $(grep -v '^$' "${FILTERED}" | xargs) >/dev/null
    echo "    Restored config vars (values hidden)"
  fi
  rm -f "${FILTERED}"
  rm -f "/tmp/${APP}.env"
fi

# Ensure strategy default
heroku config:set -a "${APP}" FREQTRADE_STRATEGY="${FREQTRADE_STRATEGY:-OdelfTrend}" >/dev/null || true

echo "==> Verify region"
heroku info -a "${APP}" | grep -i region || heroku info -a "${APP}"

echo
echo "Next:"
echo "  1. Confirm Region is eu above"
echo "  2. Deploy:  ./scripts/deploy-heroku.sh ${APP}"
echo "  3. Logs:    heroku logs --tail -a ${APP}"
echo "  4. When EU works, destroy old US app:  heroku apps:destroy -a ${OLD_APP} --confirm ${OLD_APP}"
echo "  5. Point Vercel FREQTRADE_API_URL to https://${APP}.herokuapp.com"
