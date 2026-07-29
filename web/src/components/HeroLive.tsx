"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  YAxis,
} from "recharts";
import type { BotSnapshot } from "@/lib/types";
import { useMounted } from "@/lib/useMounted";

function fmtUsd(n: number | undefined, signed = false) {
  if (n == null || Number.isNaN(n)) return "—";
  const sign = signed && n > 0 ? "+" : signed && n < 0 ? "" : "";
  return `${sign}$${n.toFixed(2)}`;
}

function fmtPct(n: number | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  const v = Math.abs(n) <= 1 ? n * 100 : n;
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(2)}%`;
}

function pairLabel(pair: string) {
  return pair.replace(":USDT", "").replace("/USDT", "");
}

type TapeItem = {
  id: string;
  text: string;
  tone: "up" | "down" | "neutral";
};

function buildTape(data: BotSnapshot | null): TapeItem[] {
  if (!data) {
    return [
      { id: "w", text: "CONNECTING TO PAPER SESSION…", tone: "neutral" },
    ];
  }

  const items: TapeItem[] = [];

  for (const t of data.openTrades ?? []) {
    items.push({
      id: `o-${t.trade_id}`,
      text: `OPEN ${t.is_short ? "SHORT" : "LONG"} ${pairLabel(t.pair)} ${(t.profit_pct ?? 0) >= 0 ? "+" : ""}${(t.profit_pct ?? 0).toFixed(2)}%`,
      tone: (t.profit_pct ?? 0) >= 0 ? "up" : "down",
    });
  }

  for (const t of (data.closedTrades ?? []).slice(0, 8)) {
    items.push({
      id: `c-${t.trade_id}`,
      text: `FILL ${t.is_short ? "SHORT" : "LONG"} ${pairLabel(t.pair)} ${fmtPct(t.profit_pct)} · ${t.exit_reason ?? "exit"}`,
      tone: (t.profit_abs ?? 0) >= 0 ? "up" : "down",
    });
  }

  if (items.length === 0) {
    items.push({
      id: "idle",
      text: "PAPER SESSION LIVE · WAITING FOR ODELFTREND SIGNAL",
      tone: "neutral",
    });
  }

  return [...items, ...items.map((i) => ({ ...i, id: `${i.id}-b` }))];
}

export function HeroLive() {
  const mounted = useMounted();
  const [data, setData] = useState<BotSnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/snapshot", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as BotSnapshot;
        if (!cancelled) setData(json);
      } catch {
        /* keep previous */
      }
    };
    load();
    const id = setInterval(load, 10_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const equity =
    data?.profit.final_balance ??
    (data?.profit.starting_balance ?? 1000) + (data?.profit.profit_all_coin ?? 0);
  const pnl = data?.profit.profit_all_coin ?? 0;
  const pnlPct = data?.profit.profit_all_percent_sum ?? 0;
  const up = pnl >= 0;
  const open = data?.openTrades?.length ?? 0;
  const closed = data?.profit.closed_trade_count ?? 0;
  const tape = useMemo(() => buildTape(data), [data]);

  const curve = data?.equityCurve?.length
    ? data.equityCurve
    : [
        { t: "a", equity: 1000 },
        { t: "b", equity: 1008 },
        { t: "c", equity: 1004 },
        { t: "d", equity: 1018 },
        { t: "e", equity: 1038 },
      ];

  const sessionLabel = data
    ? data.mock
      ? "PAPER DEMO"
      : "PAPER LIVE"
    : "PAPER SESSION";

  return (
    <section id="top" className="hero">
      <div className="hero-copy animate-in">
        <p className="brand-hero">Odelf Bot</p>
        <h1 className="headline">The bot is trading. Watch the paper session live.</h1>
        <p className="lede">
          Crypto futures dry-run on OdelfTrend — positions, fills and PnL update
          every few seconds. Not a mock landing: a running paper desk.
        </p>
        <div className="cta-row">
          <a className="cta primary" href="#live">
            Open live terminal
          </a>
          <a className="cta ghost" href="#stack">
            How it works
          </a>
        </div>
      </div>

      <div className="hero-visual animate-in delay" aria-live="polite">
        <div className="hero-desk">
          <div className="hero-desk-meta mono">
            <span className="hero-live-pulse">
              <span className="dot on" aria-hidden />
              {sessionLabel}
            </span>
            <span>
              {(data?.session?.exchange ?? "BINANCE").toUpperCase()} FUTURES ·{" "}
              {data?.strategy ?? "OdelfTrend"} · {data?.session?.timeframe ?? "5m"}
            </span>
            <span>
              {open} OPEN · {closed} CLOSED
            </span>
          </div>

          <div className="hero-desk-readout">
            <div>
              <span className="hero-read-label">Equity</span>
              <span className="hero-read-value mono">{fmtUsd(equity)}</span>
            </div>
            <div>
              <span className="hero-read-label">Session PnL</span>
              <span className={`hero-read-value mono ${up ? "up" : "down"}`}>
                {fmtUsd(pnl, true)}{" "}
                <span className="hero-read-sub">{fmtPct(pnlPct)}</span>
              </span>
            </div>
          </div>

          <div className="hero-desk-chart">
            {!mounted ? (
              <div className="chart-placeholder" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={curve} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="heroLiveFill" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor={up ? "#B6F000" : "#E23D2B"}
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="100%"
                        stopColor={up ? "#B6F000" : "#E23D2B"}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <YAxis hide domain={["dataMin - 4", "dataMax + 4"]} />
                  <Area
                    type="monotone"
                    dataKey="equity"
                    stroke={up ? "#7A9A00" : "#E23D2B"}
                    strokeWidth={2.5}
                    fill="url(#heroLiveFill)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="hero-tape" aria-hidden={!tape.length}>
            <div className="hero-tape-track">
              {tape.map((item) => (
                <span key={item.id} className={`hero-tape-item mono ${item.tone}`}>
                  {item.text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
