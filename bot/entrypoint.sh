#!/bin/bash
set -euo pipefail

CONFIG="${FREQTRADE_CONFIG:-/freqtrade/user_data/config.json}"
STRATEGY="${FREQTRADE_STRATEGY:-OdelfTrend}"

# Heroku sets PORT; map into freqtrade api listen port via config override
if [[ -n "${PORT:-}" ]]; then
  export FREQTRADE__API_SERVER__LISTEN_PORT="${PORT}"
fi

# Heroku Postgres uses postgres:// — SQLAlchemy needs postgresql://
if [[ -n "${DATABASE_URL:-}" ]]; then
  DB_URL="${DATABASE_URL/postgres:\/\//postgresql:\/\/}"
  export FREQTRADE__DB_URL="${DB_URL}"
fi

# Optional API credentials from env (override config.json defaults)
if [[ -n "${API_USERNAME:-}" ]]; then
  export FREQTRADE__API_SERVER__USERNAME="${API_USERNAME}"
fi
if [[ -n "${API_PASSWORD:-}" ]]; then
  export FREQTRADE__API_SERVER__PASSWORD="${API_PASSWORD}"
fi
if [[ -n "${JWT_SECRET_KEY:-}" ]]; then
  export FREQTRADE__API_SERVER__JWT_SECRET_KEY="${JWT_SECRET_KEY}"
fi

exec freqtrade trade \
  --config "${CONFIG}" \
  --strategy "${STRATEGY}" \
  --logfile /freqtrade/user_data/logs/freqtrade.log
