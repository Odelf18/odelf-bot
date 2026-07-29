#!/bin/bash
set -euo pipefail

# Ensure Heroku dyno (random UID) can import pip --user packages installed as ftuser
export PYTHONUSERBASE="${PYTHONUSERBASE:-/home/ftuser/.local}"
export PATH="${PYTHONUSERBASE}/bin:${PATH}"

# Prefer the install tree from the official image; fall back if Python minor differs
if [[ -z "${PYTHONPATH:-}" ]] || [[ "${PYTHONPATH}" != *".local"* ]]; then
  SITE="$(ls -d /home/ftuser/.local/lib/python*/site-packages 2>/dev/null | head -n1 || true)"
  export PYTHONPATH="/freqtrade${SITE:+:${SITE}}${PYTHONPATH:+:${PYTHONPATH}}"
fi

CONFIG="${FREQTRADE_CONFIG:-/freqtrade/user_data/config.json}"
STRATEGY="${FREQTRADE_STRATEGY:-OdelfTrend}"

# Heroku sets PORT; map into freqtrade api listen port via config override
if [[ -n "${PORT:-}" ]]; then
  export FREQTRADE__API_SERVER__LISTEN_PORT="${PORT}"
fi

# Bind API publicly on the dyno
export FREQTRADE__API_SERVER__LISTEN_IP_ADDRESS="${FREQTRADE__API_SERVER__LISTEN_IP_ADDRESS:-0.0.0.0}"
export FREQTRADE__API_SERVER__ENABLED="${FREQTRADE__API_SERVER__ENABLED:-true}"

# Heroku Postgres uses postgres:// — SQLAlchemy needs postgresql://
if [[ -n "${DATABASE_URL:-}" ]]; then
  DB_URL="${DATABASE_URL/postgres:\/\//postgresql:\/\/}"
  # Prefer psycopg (v3) URL if available; fall back to classic postgresql://
  # SQLAlchemy + Heroku often need ssl
  if [[ "${DB_URL}" != *"?"* ]]; then
    DB_URL="${DB_URL}?sslmode=require"
  elif [[ "${DB_URL}" != *"sslmode="* ]]; then
    DB_URL="${DB_URL}&sslmode=require"
  fi
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

# Log to stdout on Heroku (ephemeral filesystem)
LOG_ARGS=()
if [[ -n "${HEROKU_APP_NAME:-}" ]] || [[ -n "${DYNO:-}" ]]; then
  LOG_ARGS=(--logfile -)
else
  mkdir -p /freqtrade/user_data/logs
  LOG_ARGS=(--logfile /freqtrade/user_data/logs/freqtrade.log)
fi

echo "Starting Odelf Bot strategy=${STRATEGY} port=${PORT:-8080} python=$(command -v python || true)"
python -c "import freqtrade; print('freqtrade OK', getattr(freqtrade, '__file__', ''))" || {
  echo "FATAL: cannot import freqtrade. PYTHONUSERBASE=${PYTHONUSERBASE} PYTHONPATH=${PYTHONPATH}"
  python -c "import sys; print(sys.path)"
  exit 1
}

exec python -m freqtrade trade \
  --config "${CONFIG}" \
  --strategy "${STRATEGY}" \
  "${LOG_ARGS[@]}"
