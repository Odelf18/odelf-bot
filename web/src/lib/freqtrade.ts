import type {
  BotSnapshot,
  ClosedTrade,
  DailyRow,
  OpenTrade,
  PairPerf,
  ProfitStats,
  SessionMeta,
  SideSplit,
} from "./types";

const STARTING_BALANCE = 1000;

const WHITELIST = [
  "BTC/USDT:USDT",
  "ETH/USDT:USDT",
  "SOL/USDT:USDT",
  "BNB/USDT:USDT",
  "XRP/USDT:USDT",
  "DOGE/USDT:USDT",
  "AVAX/USDT:USDT",
  "LINK/USDT:USDT",
  "DOT/USDT:USDT",
  "ADA/USDT:USDT",
];

const SESSION: SessionMeta = {
  timeframe: "5m",
  leverage: 2,
  max_open_trades: 5,
  stake_currency: "USDT",
  trading_mode: "futures",
  dry_run: true,
  exchange: "bybit",
  whitelist: WHITELIST,
};

function mockProfit(): ProfitStats {
  return {
    profit_closed_coin: 42.18,
    profit_closed_percent_mean: 0.84,
    profit_closed_ratio_mean: 0.0084,
    profit_all_coin: 38.6,
    profit_all_percent_mean: 0.72,
    profit_all_percent_sum: 3.86,
    trade_count: 47,
    closed_trade_count: 44,
    winning_trades: 28,
    losing_trades: 16,
    winrate: 0.636,
    best_pair: "SOL/USDT:USDT",
    best_rate: 4.2,
    worst_pair: "DOT/USDT:USDT",
    worst_rate: -2.1,
    starting_balance: STARTING_BALANCE,
    final_balance: STARTING_BALANCE + 38.6,
    max_drawdown_account: 0.048,
    max_drawdown_abs: 51.2,
    profit_factor: 1.62,
    expectancy: 0.88,
    avg_duration: "2:14:00",
    trading_volume: 18420,
  };
}

function mockOpenTrades(): OpenTrade[] {
  return [
    {
      trade_id: 101,
      pair: "ETH/USDT:USDT",
      is_short: false,
      leverage: 2,
      amount: 0.058,
      stake_amount: 198.4,
      open_rate: 3420.5,
      current_rate: 3458.2,
      profit_pct: 1.1,
      profit_abs: 5.5,
      open_timestamp: Date.now() - 1000 * 60 * 42,
      enter_tag: "ema20_obv_long",
    },
    {
      trade_id: 102,
      pair: "DOGE/USDT:USDT",
      is_short: true,
      leverage: 2,
      amount: 1220,
      stake_amount: 197.6,
      open_rate: 0.162,
      current_rate: 0.1598,
      profit_pct: 1.36,
      profit_abs: 3.4,
      open_timestamp: Date.now() - 1000 * 60 * 18,
      enter_tag: "ema20_obv_short",
    },
    {
      trade_id: 103,
      pair: "SOL/USDT:USDT",
      is_short: false,
      leverage: 2,
      amount: 1.42,
      stake_amount: 199.1,
      open_rate: 138.2,
      current_rate: 136.9,
      profit_pct: -0.94,
      profit_abs: -1.87,
      open_timestamp: Date.now() - 1000 * 60 * 7,
      enter_tag: "ema20_obv_long",
    },
  ];
}

function mockClosedTrades(): ClosedTrade[] {
  const specs: Array<{
    pair: string;
    short: boolean;
    pct: number;
    reason: string;
    hoursAgo: number;
    durMin: number;
    stake: number;
  }> = [
    { pair: "BTC/USDT:USDT", short: false, pct: 1.42, reason: "roi", hoursAgo: 2, durMin: 95, stake: 200 },
    { pair: "SOL/USDT:USDT", short: true, pct: 2.1, reason: "trailing_stop_loss", hoursAgo: 4, durMin: 140, stake: 198 },
    { pair: "LINK/USDT:USDT", short: false, pct: -0.85, reason: "stop_loss", hoursAgo: 6, durMin: 48, stake: 195 },
    { pair: "AVAX/USDT:USDT", short: false, pct: 1.05, reason: "exit_signal", hoursAgo: 9, durMin: 210, stake: 200 },
    { pair: "XRP/USDT:USDT", short: true, pct: 0.72, reason: "roi", hoursAgo: 11, durMin: 75, stake: 197 },
    { pair: "ADA/USDT:USDT", short: false, pct: -1.2, reason: "stop_loss", hoursAgo: 14, durMin: 33, stake: 196 },
    { pair: "BNB/USDT:USDT", short: true, pct: 1.88, reason: "roi", hoursAgo: 18, durMin: 160, stake: 199 },
    { pair: "DOT/USDT:USDT", short: false, pct: -2.05, reason: "stop_loss", hoursAgo: 22, durMin: 55, stake: 194 },
    { pair: "ETH/USDT:USDT", short: false, pct: 0.95, reason: "exit_signal", hoursAgo: 26, durMin: 120, stake: 200 },
    { pair: "DOGE/USDT:USDT", short: true, pct: 1.55, reason: "roi", hoursAgo: 30, durMin: 88, stake: 198 },
    { pair: "BTC/USDT:USDT", short: true, pct: -0.6, reason: "exit_signal", hoursAgo: 34, durMin: 42, stake: 200 },
    { pair: "SOL/USDT:USDT", short: false, pct: 2.4, reason: "trailing_stop_loss", hoursAgo: 40, durMin: 185, stake: 201 },
  ];

  return specs.map((s, i) => {
    const closeTs = Date.now() - 1000 * 60 * 60 * s.hoursAgo;
    const openTs = closeTs - 1000 * 60 * s.durMin;
    const open = s.pair.includes("BTC")
      ? 64500
      : s.pair.includes("ETH")
        ? 3400
        : s.pair.includes("SOL")
          ? 140
          : 1.2;
    const close = open * (1 + (s.short ? -s.pct : s.pct) / 100);
    return {
      trade_id: 80 + i,
      pair: s.pair,
      is_short: s.short,
      leverage: 2,
      amount: s.stake / open,
      stake_amount: s.stake,
      open_rate: open,
      close_rate: close,
      profit_pct: s.pct,
      profit_abs: Number(((s.stake * s.pct) / 100).toFixed(2)),
      open_timestamp: openTs,
      close_timestamp: closeTs,
      enter_tag: s.short ? "ema20_obv_short" : "ema20_obv_long",
      exit_reason: s.reason,
    };
  });
}

function mockDaily(): DailyRow[] {
  const days = 14;
  const rows: DailyRow[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const abs = (Math.sin(i / 2) * 8 + (i % 4) * 1.2) * (i === 0 ? 0.6 : 1);
    rows.push({
      date: d.toISOString().slice(0, 10),
      abs_profit: Number(abs.toFixed(2)),
      rel_profit: Number((abs / STARTING_BALANCE).toFixed(4)),
      trade_count: 1 + (i % 5),
    });
  }
  return rows;
}

function equityFromDaily(daily: DailyRow[]): { t: string; equity: number }[] {
  let equity = STARTING_BALANCE;
  return daily.map((row) => {
    equity += row.abs_profit;
    return { t: row.date, equity: Number(equity.toFixed(2)) };
  });
}

export function derivePairPerf(trades: ClosedTrade[]): PairPerf[] {
  const map = new Map<string, PairPerf>();
  for (const t of trades) {
    const cur = map.get(t.pair) ?? {
      pair: t.pair,
      profit: 0,
      profit_pct: 0,
      count: 0,
      wins: 0,
    };
    cur.profit += t.profit_abs ?? 0;
    cur.profit_pct += t.profit_pct ?? 0;
    cur.count += 1;
    if ((t.profit_abs ?? 0) > 0) cur.wins += 1;
    map.set(t.pair, cur);
  }
  return [...map.values()].sort((a, b) => b.profit - a.profit);
}

export function deriveSideSplit(
  closed: ClosedTrade[],
  open: OpenTrade[]
): SideSplit {
  const all = [
    ...closed,
    ...open.map((t) => ({
      is_short: t.is_short,
      profit_abs: t.profit_abs ?? 0,
    })),
  ];
  return all.reduce(
    (acc, t) => {
      if (t.is_short) {
        acc.short_count += 1;
        acc.short_profit += t.profit_abs ?? 0;
      } else {
        acc.long_count += 1;
        acc.long_profit += t.profit_abs ?? 0;
      }
      return acc;
    },
    { long_count: 0, short_count: 0, long_profit: 0, short_profit: 0 }
  );
}

function enrichProfitFromTrades(
  profit: ProfitStats,
  closed: ClosedTrade[]
): ProfitStats {
  if (!closed.length) return profit;
  const wins = closed.filter((t) => (t.profit_abs ?? 0) > 0);
  const losses = closed.filter((t) => (t.profit_abs ?? 0) <= 0);
  const winSum = wins.reduce((s, t) => s + (t.profit_abs ?? 0), 0);
  const lossSum = Math.abs(
    losses.reduce((s, t) => s + (t.profit_abs ?? 0), 0)
  );
  const best = [...closed].sort(
    (a, b) => (b.profit_pct ?? 0) - (a.profit_pct ?? 0)
  )[0];
  const worst = [...closed].sort(
    (a, b) => (a.profit_pct ?? 0) - (b.profit_pct ?? 0)
  )[0];

  return {
    ...profit,
    winning_trades: profit.winning_trades || wins.length,
    losing_trades: profit.losing_trades || losses.length,
    winrate:
      profit.winrate ??
      (closed.length ? wins.length / closed.length : 0),
    profit_factor:
      profit.profit_factor ??
      (lossSum > 0 ? winSum / lossSum : winSum > 0 ? 99 : 0),
    expectancy:
      profit.expectancy ??
      (closed.length
        ? closed.reduce((s, t) => s + (t.profit_abs ?? 0), 0) / closed.length
        : 0),
    best_pair: profit.best_pair ?? best?.pair,
    best_rate: profit.best_rate ?? best?.profit_pct,
    worst_pair: profit.worst_pair ?? worst?.pair,
    worst_rate: profit.worst_rate ?? worst?.profit_pct,
    trading_volume:
      profit.trading_volume ??
      closed.reduce((s, t) => s + (t.stake_amount ?? 0), 0),
  };
}

export function getMockSnapshot(): BotSnapshot {
  const daily = mockDaily();
  const closedTrades = mockClosedTrades();
  const openTrades = mockOpenTrades();
  const profit = enrichProfitFromTrades(mockProfit(), closedTrades);
  return {
    online: true,
    mock: true,
    updatedAt: new Date().toISOString(),
    state: "running",
    strategy: "OdelfTrend",
    profit,
    openTrades,
    closedTrades,
    daily,
    equityCurve: equityFromDaily(daily),
    pairPerf: derivePairPerf(closedTrades),
    sideSplit: deriveSideSplit(closedTrades, openTrades),
    session: SESSION,
  };
}

type TokenCache = { token: string; expiresAt: number };
let tokenCache: TokenCache | null = null;

async function getAccessToken(
  baseUrl: string,
  username: string,
  password: string
): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 30_000) {
    return tokenCache.token;
  }

  // Freqtrade expects HTTP Basic Auth on /token/login (not a form body).
  // See: https://www.freqtrade.io/en/stable/rest-api/
  const basic = Buffer.from(`${username}:${password}`).toString("base64");
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/v1/token/login`, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}` },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Freqtrade auth failed (${res.status})`);
  }

  const data = (await res.json()) as { access_token: string };
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + 10 * 60 * 1000,
  };
  return data.access_token;
}

async function ftGet<T>(
  baseUrl: string,
  path: string,
  token: string
): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    throw new Error(`Freqtrade ${path} failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

function normalizeProfit(raw: Record<string, unknown>): ProfitStats {
  const closed = Number(raw.closed_trade_count ?? raw.trade_count ?? 0);
  const winning = Number(raw.winning_trades ?? 0);
  const losing = Number(raw.losing_trades ?? 0);
  return {
    profit_closed_coin: Number(raw.profit_closed_coin ?? 0),
    profit_closed_percent_mean: Number(raw.profit_closed_percent_mean ?? 0),
    profit_closed_ratio_mean: Number(raw.profit_closed_ratio_mean ?? 0),
    profit_all_coin: Number(raw.profit_all_coin ?? 0),
    profit_all_percent_mean: Number(raw.profit_all_percent_mean ?? 0),
    profit_all_percent_sum: Number(raw.profit_all_percent_sum ?? 0),
    trade_count: Number(raw.trade_count ?? 0),
    closed_trade_count: closed,
    winning_trades: winning,
    losing_trades: losing,
    winrate:
      closed > 0
        ? winning / closed
        : typeof raw.winrate === "number"
          ? raw.winrate
          : 0,
    best_pair: typeof raw.best_pair === "string" ? raw.best_pair : undefined,
    best_rate: raw.best_rate != null ? Number(raw.best_rate) : undefined,
    worst_pair:
      typeof raw.worst_pair === "string" ? raw.worst_pair : undefined,
    worst_rate: raw.worst_rate != null ? Number(raw.worst_rate) : undefined,
    starting_balance:
      raw.starting_balance != null
        ? Number(raw.starting_balance)
        : STARTING_BALANCE,
    final_balance:
      raw.final_balance != null ? Number(raw.final_balance) : undefined,
    max_drawdown_account:
      raw.max_drawdown_account != null
        ? Number(raw.max_drawdown_account)
        : undefined,
    max_drawdown_abs:
      raw.max_drawdown_abs != null ? Number(raw.max_drawdown_abs) : undefined,
    profit_factor:
      raw.profit_factor != null ? Number(raw.profit_factor) : undefined,
    expectancy: raw.expectancy != null ? Number(raw.expectancy) : undefined,
    avg_duration:
      typeof raw.avg_duration === "string" ? raw.avg_duration : undefined,
    trading_volume:
      raw.trading_volume != null ? Number(raw.trading_volume) : undefined,
  };
}

type ShowConfig = {
  strategy?: string;
  timeframe?: string;
  max_open_trades?: number;
  stake_currency?: string;
  trading_mode?: string;
  dry_run?: boolean;
  exchange?: string | { name?: string };
};

export async function fetchBotSnapshot(): Promise<BotSnapshot> {
  const useMock = process.env.USE_MOCK_DATA === "true";
  const baseUrl = (process.env.FREQTRADE_API_URL ?? "").replace(/\/$/, "");
  const username = process.env.FREQTRADE_API_USERNAME ?? "odelf";
  const password = process.env.FREQTRADE_API_PASSWORD ?? "odelf";

  if (useMock || !baseUrl) {
    return getMockSnapshot();
  }

  try {
    const token = await getAccessToken(baseUrl, username, password);
    const [profitRaw, openRaw, closedRaw, dailyRaw, showConfig, perfRaw, ping] =
      await Promise.all([
        ftGet<Record<string, unknown>>(baseUrl, "/api/v1/profit", token),
        ftGet<{ data?: OpenTrade[] } | OpenTrade[]>(
          baseUrl,
          "/api/v1/status",
          token
        ),
        ftGet<{ trades?: ClosedTrade[] } | ClosedTrade[]>(
          baseUrl,
          "/api/v1/trades?limit=50",
          token
        ),
        ftGet<{ data?: DailyRow[] } | DailyRow[]>(
          baseUrl,
          "/api/v1/daily?timescale=14",
          token
        ),
        ftGet<ShowConfig>(baseUrl, "/api/v1/show_config", token).catch(
          () => ({ strategy: "OdelfTrend" }) as ShowConfig
        ),
        ftGet<{ performance?: PairPerf[] } | PairPerf[]>(
          baseUrl,
          "/api/v1/performance",
          token
        ).catch(() => [] as PairPerf[]),
        ftGet<{ status?: string }>(baseUrl, "/api/v1/ping", token).catch(() => ({
          status: "pong",
        })),
      ]);

    const openTrades = Array.isArray(openRaw)
      ? openRaw
      : Array.isArray(openRaw.data)
        ? openRaw.data
        : [];

    const closedTrades = Array.isArray(closedRaw)
      ? closedRaw
      : Array.isArray(closedRaw.trades)
        ? closedRaw.trades.filter((t) => t.close_timestamp)
        : [];

    const daily = Array.isArray(dailyRaw)
      ? dailyRaw
      : Array.isArray(dailyRaw.data)
        ? dailyRaw.data
        : [];

    const profit = enrichProfitFromTrades(
      normalizeProfit(profitRaw),
      closedTrades
    );
    const start = profit.starting_balance ?? STARTING_BALANCE;
    let equity = start;
    const equityCurve = [...daily]
      .reverse()
      .map((row) => {
        equity += Number(row.abs_profit ?? 0);
        return {
          t: String(row.date).slice(0, 10),
          equity: Number(equity.toFixed(2)),
        };
      });

    const apiPerf = Array.isArray(perfRaw)
      ? perfRaw
      : Array.isArray(perfRaw.performance)
        ? perfRaw.performance
        : [];

    const pairPerf =
      apiPerf.length > 0
        ? apiPerf.map((p) => ({
            pair: p.pair,
            profit: Number(
              (p as PairPerf & { profit_abs?: number }).profit ??
                (p as { profit_abs?: number }).profit_abs ??
                0
            ),
            profit_pct: Number(p.profit_pct ?? 0),
            count: Number(p.count ?? 0),
            wins: Number(p.wins ?? 0),
          }))
        : derivePairPerf(closedTrades);

    const exchangeName =
      typeof showConfig.exchange === "string"
        ? showConfig.exchange
        : showConfig.exchange?.name ?? "binance";

    return {
      online: Boolean(ping),
      mock: false,
      updatedAt: new Date().toISOString(),
      state: "running",
      strategy: showConfig.strategy ?? "OdelfTrend",
      profit,
      openTrades,
      closedTrades: closedTrades.slice(0, 25),
      daily,
      equityCurve:
        equityCurve.length > 0
          ? equityCurve
          : [{ t: new Date().toISOString().slice(0, 10), equity: start }],
      pairPerf,
      sideSplit: deriveSideSplit(closedTrades, openTrades),
      session: {
        timeframe: showConfig.timeframe ?? "5m",
        leverage: 2,
        max_open_trades: showConfig.max_open_trades ?? 5,
        stake_currency: showConfig.stake_currency ?? "USDT",
        trading_mode: showConfig.trading_mode ?? "futures",
        dry_run: showConfig.dry_run ?? true,
        exchange: exchangeName,
        whitelist: WHITELIST,
      },
    };
  } catch (err) {
    console.error("Freqtrade fetch failed, falling back to mock:", err);
    const mock = getMockSnapshot();
    return {
      ...mock,
      online: false,
      mock: true,
      error: err instanceof Error ? err.message : "Freqtrade fetch failed",
    };
  }
}
