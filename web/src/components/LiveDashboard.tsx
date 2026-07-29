"use client";

import { useEffect, useMemo, useState } from "react";
import type { BotSnapshot, ClosedTrade, OpenTrade } from "@/lib/types";
import { EquityChart } from "./EquityChart";
import { DailyBars } from "./DailyBars";

function fmtPct(n: number | undefined, alreadyPct = false) {
  if (n == null || Number.isNaN(n)) return "—";
  const v = alreadyPct || Math.abs(n) > 1 ? n : n * 100;
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(2)}%`;
}

function fmtUsd(n: number | undefined, signed = true) {
  if (n == null || Number.isNaN(n)) return "—";
  const sign = signed && n > 0 ? "+" : "";
  return `${sign}$${Math.abs(n) >= 1000 ? n.toFixed(0) : n.toFixed(2)}`;
}

function pairLabel(pair: string) {
  return pair.replace(":USDT", "").replace("/USDT", "");
}

function timeAgo(iso: string) {
  const sec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (sec < 5) return "just now";
  if (sec < 60) return `${sec}s ago`;
  return `${Math.floor(sec / 60)}m ago`;
}

function fmtTime(ts?: number) {
  if (!ts) return "—";
  // Fixed locale + UTC to keep SSR/client strings identical
  return new Date(ts).toLocaleString("en-GB", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
}

function fmtDuration(openTs?: number, closeTs?: number) {
  if (!openTs) return "—";
  const end = closeTs ?? Date.now();
  const mins = Math.max(1, Math.round((end - openTs) / 60000));
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

function fmtRate(n?: number) {
  if (n == null) return "—";
  if (n >= 100) return n.toFixed(2);
  if (n >= 1) return n.toFixed(4);
  return n.toPrecision(4);
}

function StatCell({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "up" | "down" | "neutral";
}) {
  return (
    <div className="stat-cell">
      <span className="stat-label">{label}</span>
      <span className={`stat-value mono ${tone === "up" ? "up" : tone === "down" ? "down" : ""}`}>
        {value}
      </span>
    </div>
  );
}

export function LiveDashboard() {
  const [data, setData] = useState<BotSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ago, setAgo] = useState("");
  const [flash, setFlash] = useState(0);
  const [blotter, setBlotter] = useState<"open" | "closed">("open");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/snapshot", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as BotSnapshot;
        if (!cancelled) {
          setData(json);
          setError(null);
          setFlash((n) => n + 1);
          if ((json.openTrades?.length ?? 0) === 0) setBlotter("closed");
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "fetch failed");
      }
    };
    load();
    const id = setInterval(load, 10_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (!data) return;
    const update = () => setAgo(timeAgo(data.updatedAt));
    update();
    const clock = setInterval(update, 1000);
    return () => clearInterval(clock);
  }, [data]);

  const derived = useMemo(() => {
    if (!data) return null;
    const profit = data.profit;
    const closed = data.closedTrades ?? [];
    const wins = closed.filter((t) => (t.profit_abs ?? 0) > 0);
    const losses = closed.filter((t) => (t.profit_abs ?? 0) <= 0);
    const winSum = wins.reduce((s, t) => s + (t.profit_abs ?? 0), 0);
    const lossSum = Math.abs(losses.reduce((s, t) => s + (t.profit_abs ?? 0), 0));
    const avgWin = wins.length ? winSum / wins.length : 0;
    const avgLoss = losses.length ? lossSum / losses.length : 0;
    const equity =
      profit.final_balance ??
      (profit.starting_balance ?? 1000) + (profit.profit_all_coin ?? 0);
    const unrealized = (data.openTrades ?? []).reduce(
      (s, t) => s + (t.profit_abs ?? 0),
      0
    );
    return {
      equity,
      unrealized,
      avgWin,
      avgLoss,
      pnlPositive: (profit.profit_all_coin ?? 0) >= 0,
    };
  }, [data]);

  if (error && !data) {
    return (
      <section id="live" className="section live">
        <p className="meta">Unable to load terminal: {error}</p>
      </section>
    );
  }

  const profit = data?.profit;
  const session = data?.session;
  const side = data?.sideSplit;
  const openExposure = (data?.openTrades ?? []).reduce(
    (s, t) => s + (t.stake_amount ?? 0),
    0
  );

  return (
    <section id="live" className="section live terminal">
      <div className="term-chrome">
        <div className="term-title-block">
          <h2 className="section-title">Trading terminal</h2>
          <p className="section-sub">
            Paper session desk — positions, blotter, and risk stats from the live bot API.
          </p>
        </div>
        <div className="term-status" aria-live="polite">
          <span className={`dot ${data?.online ? "on" : "off"}`} aria-hidden />
          <span className="mono meta">
            {data?.mock ? "DEMO FEED" : "LIVE FEED"}
            {ago ? ` · ${ago}` : ""}
          </span>
          {data?.error ? (
            <span className="mono meta" style={{ color: "var(--loss)" }}>
              · {data.error}
            </span>
          ) : null}
        </div>
      </div>

      <div className="term-tape mono">
        <span>
          <em>MODE</em> {session?.dry_run !== false ? "DRY-RUN" : "LIVE"}
        </span>
        <span>
          <em>EXCH</em> {(session?.exchange ?? "binance").toUpperCase()}
        </span>
        <span>
          <em>MKT</em> {(session?.trading_mode ?? "futures").toUpperCase()}
        </span>
        <span>
          <em>STRAT</em> {data?.strategy ?? "OdelfTrend"}
        </span>
        <span>
          <em>TF</em> {session?.timeframe ?? "5m"}
        </span>
        <span>
          <em>LEV</em> {session?.leverage ?? 2}x
        </span>
        <span>
          <em>SLOTS</em> {data?.openTrades.length ?? 0}/
          {session?.max_open_trades ?? 5}
        </span>
        <span>
          <em>STATE</em> {(data?.state ?? "—").toUpperCase()}
        </span>
      </div>

      <div className="kpi-row term-kpi" key={flash}>
        <div className="kpi">
          <span className="kpi-label">Equity</span>
          <span className="kpi-value mono">
            {fmtUsd(derived?.equity, false)}
          </span>
          <span className="kpi-hint mono">
            start {fmtUsd(profit?.starting_balance, false)}
          </span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Realized PnL</span>
          <span
            className={`kpi-value mono ${(profit?.profit_closed_coin ?? 0) >= 0 ? "up" : "down"}`}
          >
            {fmtUsd(profit?.profit_closed_coin)}
          </span>
          <span className="kpi-hint mono">
            all {fmtUsd(profit?.profit_all_coin)} ({fmtPct(profit?.profit_all_percent_sum, true)})
          </span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Unrealized</span>
          <span
            className={`kpi-value mono ${(derived?.unrealized ?? 0) >= 0 ? "up" : "down"}`}
          >
            {fmtUsd(derived?.unrealized)}
          </span>
          <span className="kpi-hint mono">
            exposure {fmtUsd(openExposure, false)}
          </span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Winrate</span>
          <span className="kpi-value mono">
            {((profit?.winrate ?? 0) * 100).toFixed(1)}%
          </span>
          <span className="kpi-hint mono">
            {profit?.winning_trades ?? 0}W / {profit?.losing_trades ?? 0}L
          </span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Trades</span>
          <span className="kpi-value mono">{profit?.closed_trade_count ?? 0}</span>
          <span className="kpi-hint mono">
            total {profit?.trade_count ?? 0} · open {data?.openTrades.length ?? 0}
          </span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Max DD</span>
          <span className="kpi-value mono down">
            {fmtPct(profit?.max_drawdown_account)}
          </span>
          <span className="kpi-hint mono">
            {fmtUsd(profit?.max_drawdown_abs ? -Math.abs(profit.max_drawdown_abs) : undefined)}
          </span>
        </div>
      </div>

      <div className="term-charts">
        <div className="term-panel">
          <div className="panel-head">
            <h3 className="feed-title">Equity curve</h3>
            <span className="meta mono">14d</span>
          </div>
          <div className="board-chart">
            <EquityChart data={data?.equityCurve ?? []} />
          </div>
        </div>
        <div className="term-panel">
          <div className="panel-head">
            <h3 className="feed-title">Daily PnL</h3>
            <span className="meta mono">USDT</span>
          </div>
          <div className="daily-wrap">
            <DailyBars data={data?.daily ?? []} />
          </div>
        </div>
      </div>

      <div className="stats-matrix">
        <StatCell
          label="Profit factor"
          value={profit?.profit_factor != null ? profit.profit_factor.toFixed(2) : "—"}
          tone={(profit?.profit_factor ?? 0) >= 1 ? "up" : "down"}
        />
        <StatCell
          label="Expectancy"
          value={fmtUsd(profit?.expectancy ?? derived?.avgWin)}
          tone={(profit?.expectancy ?? 0) >= 0 ? "up" : "down"}
        />
        <StatCell label="Avg win" value={fmtUsd(derived?.avgWin)} tone="up" />
        <StatCell label="Avg loss" value={fmtUsd(derived?.avgLoss ? -derived.avgLoss : 0)} tone="down" />
        <StatCell
          label="Best pair"
          value={
            profit?.best_pair
              ? `${pairLabel(profit.best_pair)} ${fmtPct(profit.best_rate, true)}`
              : "—"
          }
          tone="up"
        />
        <StatCell
          label="Worst pair"
          value={
            profit?.worst_pair
              ? `${pairLabel(profit.worst_pair)} ${fmtPct(profit.worst_rate, true)}`
              : "—"
          }
          tone="down"
        />
        <StatCell
          label="Long / Short"
          value={`${side?.long_count ?? 0} / ${side?.short_count ?? 0}`}
        />
        <StatCell
          label="Side PnL"
          value={`L ${fmtUsd(side?.long_profit)} · S ${fmtUsd(side?.short_profit)}`}
        />
        <StatCell label="Avg duration" value={profit?.avg_duration ?? "—"} />
        <StatCell
          label="Volume"
          value={fmtUsd(profit?.trading_volume, false)}
        />
        <StatCell
          label="Mean trade %"
          value={fmtPct(profit?.profit_closed_percent_mean, true)}
        />
        <StatCell
          label="Stake ccy"
          value={session?.stake_currency ?? "USDT"}
        />
      </div>

      <div className="term-split">
        <div className="term-panel blotter-panel">
          <div className="panel-head">
            <h3 className="feed-title">Blotter</h3>
            <div className="blotter-tabs">
              <button
                type="button"
                className={blotter === "open" ? "active" : ""}
                onClick={() => setBlotter("open")}
              >
                Open ({data?.openTrades.length ?? 0})
              </button>
              <button
                type="button"
                className={blotter === "closed" ? "active" : ""}
                onClick={() => setBlotter("closed")}
              >
                Closed ({data?.closedTrades.length ?? 0})
              </button>
            </div>
          </div>

          {blotter === "open" ? (
            (data?.openTrades.length ?? 0) === 0 ? (
              <p className="meta waiting">No open positions — waiting for OdelfTrend signal…</p>
            ) : (
              <div className="table-wrap">
                <table className="term-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Pair</th>
                      <th>Side</th>
                      <th>Lev</th>
                      <th>Entry</th>
                      <th>Mark</th>
                      <th>Stake</th>
                      <th>PnL</th>
                      <th>Dur</th>
                      <th>Tag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data!.openTrades.map((t: OpenTrade) => (
                      <tr key={t.trade_id}>
                        <td className="mono">{t.trade_id}</td>
                        <td className="mono">{pairLabel(t.pair)}</td>
                        <td className={t.is_short ? "down" : "up"}>
                          {t.is_short ? "SHORT" : "LONG"}
                        </td>
                        <td className="mono">{t.leverage}x</td>
                        <td className="mono">{fmtRate(t.open_rate)}</td>
                        <td className="mono">{fmtRate(t.current_rate)}</td>
                        <td className="mono">{fmtUsd(t.stake_amount, false)}</td>
                        <td className={`mono ${(t.profit_abs ?? 0) >= 0 ? "up" : "down"}`}>
                          {fmtUsd(t.profit_abs)} ({fmtPct(t.profit_pct, true)})
                        </td>
                        <td className="mono">{fmtDuration(t.open_timestamp)}</td>
                        <td className="meta">{t.enter_tag ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div className="table-wrap">
              <table className="term-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Pair</th>
                    <th>Side</th>
                    <th>Entry</th>
                    <th>Exit</th>
                    <th>PnL</th>
                    <th>Closed</th>
                    <th>Dur</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.closedTrades ?? []).map((t: ClosedTrade) => (
                    <tr key={t.trade_id}>
                      <td className="mono">{t.trade_id}</td>
                      <td className="mono">{pairLabel(t.pair)}</td>
                      <td className={t.is_short ? "down" : "up"}>
                        {t.is_short ? "SHORT" : "LONG"}
                      </td>
                      <td className="mono">{fmtRate(t.open_rate)}</td>
                      <td className="mono">{fmtRate(t.close_rate)}</td>
                      <td className={`mono ${(t.profit_abs ?? 0) >= 0 ? "up" : "down"}`}>
                        {fmtUsd(t.profit_abs)} ({fmtPct(t.profit_pct, true)})
                      </td>
                      <td className="mono">{fmtTime(t.close_timestamp)}</td>
                      <td className="mono">
                        {fmtDuration(t.open_timestamp, t.close_timestamp)}
                      </td>
                      <td className="meta">{t.exit_reason ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="term-panel">
          <div className="panel-head">
            <h3 className="feed-title">Pair performance</h3>
            <span className="meta mono">closed</span>
          </div>
          <ul className="pair-list">
            {(data?.pairPerf ?? []).map((p) => {
              const wr = p.count ? (p.wins / p.count) * 100 : 0;
              return (
                <li key={p.pair} className="pair-row">
                  <span className="mono pair-name">{pairLabel(p.pair)}</span>
                  <span className="meta mono">
                    {p.count}t · {wr.toFixed(0)}% wr
                  </span>
                  <span className={`mono ${(p.profit ?? 0) >= 0 ? "up" : "down"}`}>
                    {fmtUsd(p.profit)}
                  </span>
                  <div className="pair-bar" aria-hidden>
                    <span
                      className={(p.profit ?? 0) >= 0 ? "fill up" : "fill down"}
                      style={{
                        width: `${Math.min(100, Math.abs(p.profit_pct || p.profit) * 8)}%`,
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="universe">
            <h3 className="feed-title">Universe</h3>
            <p className="universe-tags mono">
              {(session?.whitelist ?? []).map(pairLabel).join(" · ")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
