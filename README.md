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

### Heroku (bot) — Apple Silicon note

Heroku only accepts **linux/amd64** images. On an M1/M2/M3 Mac, plain
`heroku container:push` builds `arm64` and fails with `error from registry: unsupported`.

**Recommended (script):**

```bash
chmod +x scripts/deploy-heroku.sh
./scripts/deploy-heroku.sh odelf-bot
```

**Or manually:**

```bash
heroku container:login
docker buildx build \
  --platform linux/amd64 \
  --provenance=false \
  --sbom=false \
  -t registry.heroku.com/odelf-bot/web \
  --load .
docker push registry.heroku.com/odelf-bot/web
heroku container:release web -a odelf-bot
```

One-time app setup (if not done yet) — **must be EU for Binance**:

Heroku common runtime only allows region at **create** time (`us` or `eu`).
US dynos get Binance.com **HTTP 451** (geo-blocked). Recreate in EU:

```bash
chmod +x scripts/heroku-eu-setup.sh scripts/deploy-heroku.sh
./scripts/heroku-eu-setup.sh odelf-bot   # renames old US app → odelf-bot-us-old, creates EU app
./scripts/deploy-heroku.sh odelf-bot
heroku logs --tail -a odelf-bot
```

Manual equivalent:

```bash
heroku apps:rename odelf-bot-us-old -a odelf-bot   # if US app exists
heroku create odelf-bot --region eu
heroku stack:set container -a odelf-bot
heroku addons:create heroku-postgresql:essential-0 -a odelf-bot
heroku config:set -a odelf-bot \
  API_USERNAME=odelf \
  API_PASSWORD='strong-password' \
  JWT_SECRET_KEY="$(openssl rand -hex 32)" \
  FREQTRADE_STRATEGY=OdelfTrend \
  FREQTRADE__EXCHANGE__KEY='...' \
  FREQTRADE__EXCHANGE__SECRET='...'
./scripts/deploy-heroku.sh odelf-bot
```

Verify: `heroku info -a odelf-bot` → **Region: eu**

If the dyno crashes with `ModuleNotFoundError: No module named 'freqtrade'`,
rebuild/redeploy — the Dockerfile sets `PYTHONUSERBASE=/home/ftuser/.local`
(Heroku runs containers as a random UID, which breaks `pip --user` otherwise).

`DATABASE_URL` is injected by the Postgres addon. The entrypoint rewrites `postgres://` → `postgresql://` for SQLAlchemy.

### Vercel (dashboard)

**Critical:** set **Root Directory** to `web` (Project Settings → General → Root Directory).
If Root Directory is `.` (repo root), Vercel cannot find the Next.js app → **404**.

1. Push the repo to GitHub
2. Vercel → Import → select `Odelf18/odelf-bot`
3. Root Directory: **`web`** → Deploy
4. Env vars:

| Variable | Value |
|----------|--------|
| `FREQTRADE_API_URL` | `https://odelf-bot-e9994e96cef6.herokuapp.com` |
| `FREQTRADE_API_USERNAME` | `odelf` |
| `FREQTRADE_API_PASSWORD` | same as Heroku `API_PASSWORD` |
| `USE_MOCK_DATA` | `false` |

5. Redeploy after changing Root Directory or env vars

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
