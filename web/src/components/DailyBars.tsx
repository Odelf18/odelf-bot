"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyRow } from "@/lib/types";
import { useMounted } from "@/lib/useMounted";

export function DailyBars({ data }: { data: DailyRow[] }) {
  const mounted = useMounted();
  const rows = [...data].slice(-14);
  return (
    <div className="daily-chart">
      {!mounted ? (
        <div className="chart-placeholder" />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
            <XAxis
              dataKey="date"
              tickFormatter={(v: string) => String(v).slice(5)}
              tick={{ fill: "var(--mute)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "var(--mute)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip
              contentStyle={{
                background: "var(--ink)",
                border: "none",
                borderRadius: 0,
                color: "var(--paper)",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
              }}
              formatter={(value, _name, item) => {
                const n = typeof value === "number" ? value : Number(value);
                const count =
                  item && typeof item === "object" && "payload" in item
                    ? (item.payload as DailyRow).trade_count
                    : 0;
                return [`$${n.toFixed(2)} · ${count} trades`, "Daily PnL"];
              }}
            />
            <Bar dataKey="abs_profit" maxBarSize={18} isAnimationActive={false}>
              {rows.map((row) => (
                <Cell
                  key={row.date}
                  fill={
                    row.abs_profit >= 0 ? "var(--signal-ink)" : "var(--loss)"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
