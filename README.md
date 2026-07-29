# Odelf Bot

Paper-trading showcase: **Binance Futures** dry-run bot (Freqtrade + **OdelfTrend**) and a public **live PnL** board (Next.js).

> Educational / portfolio demo only. Simulated results are not live performance and are not financial advice.

## Architecture

| Layer | Host | Role |
|-------|------|------|
| Bot | Heroku (Docker) | Freqtrade dry-run futures |
| DB | Heroku Postgres | Trade persistence |
| Dashboard | Vercel | Landing + live board + API proxy |

```
Binance market data → Freqtrade (Heroku) → Postgres
                              ↓
                     Next.js /api/snapshot (Vercel)
                              ↓
                        Public Odelf Bot UI
```

## Strategy: OdelfTrend

- Timeframe: `5m`
- Long/short (`can_short = True`)
- Entry: price crosses EMA20 + OBV confirmation
- Leverage: 2x isolated
- Fallback if too quiet: `OdelfPulse` (RSI + Bollinger)

## Quick start (local)

### Dashboard (mock data)

```bash
cd web
cp ../.env.example .env.local   # or use existing .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). With `USE_MOCK_DATA=true`, the board shows demo PnL without the bot.

### Bot (Docker)

```bash
docker compose up --build
```

API: `http://localhost:8080` (default user/pass `odelf` / `odelf`).

Then point the web app at the bot:

```bash
# web/.env.local
USE_MOCK_DATA=false
FREQTRADE_API_URL=http://localhost:8080
FREQTRADE_API_USERNAME=odelf
FREQTRADE_API_PASSWORD=odelf
```

### Switch strategy

```bash
FREQTRADE_STRATEGY=OdelfPulse docker compose up --build
```

## Deploy

### Heroku (bot)

```bash
heroku create odelf-bot
heroku stack:set container
heroku addons:create heroku-postgresql:essential-0
heroku config:set \
  API_USERNAME=odelf \
  API_PASSWORD='strong-password' \
  JWT_SECRET_KEY='long-random-string' \
  FREQTRADE_STRATEGY=OdelfTrend
heroku container:push web
heroku container:release web
```

`DATABASE_URL` is injected by the Postgres addon. The entrypoint rewrites `postgres://` → `postgresql://` for SQLAlchemy.

### Vercel (dashboard)

1. Import the `web/` directory (or monorepo root with Root Directory = `web`).
2. Set env:

| Variable | Value |
|----------|--------|
| `FREQTRADE_API_URL` | `https://your-heroku-app.herokuapp.com` |
| `FREQTRADE_API_USERNAME` | same as Heroku |
| `FREQTRADE_API_PASSWORD` | same as Heroku |
| `USE_MOCK_DATA` | `false` |

JWT credentials stay server-side in Route Handlers — never expose them to the browser.

## Project layout

```
odelf-bot/
  bot/
    entrypoint.sh
    user_data/
      config.json
      strategies/OdelfTrend.py
      strategies/OdelfPulse.py
  web/                 # Next.js dashboard
  Dockerfile           # Heroku + local bot image
  heroku.yml
  docker-compose.yml
  .env.example
```

## Disclaimer

Odelf Bot is a **paper trading** demonstration. Dry-run futures approximate fills and funding; they are not identical to live trading. Do not use this as financial advice.
