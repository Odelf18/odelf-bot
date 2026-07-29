"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMounted } from "@/lib/useMounted";

type Point = { t: string; equity: number };

export function EquityChart({ data }: { data: Point[] }) {
  const mounted = useMounted();
  const last = data[data.length - 1]?.equity ?? 1000;
  const first = data[0]?.equity ?? 1000;
  const up = last >= first;

  return (
    <div className="equity-chart" aria-hidden={!data.length}>
      {!mounted ? (
        <div className="chart-placeholder" />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={up ? "var(--signal)" : "var(--loss)"}
                  stopOpacity={0.35}
                />
                <stop
                  offset="100%"
                  stopColor={up ? "var(--signal)" : "var(--loss)"}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke="rgba(16,20,28,0.08)"
              vertical={false}
              strokeDasharray="3 3"
            />
            <XAxis
              dataKey="t"
              tickFormatter={(v: string) => String(v).slice(5)}
              tick={{ fill: "var(--mute)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={["dataMin - 5", "dataMax + 5"]}
              tick={{ fill: "var(--mute)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={44}
              tickFormatter={(v: number) => `$${Math.round(v)}`}
            />
            <Tooltip
              contentStyle={{
                background: "var(--ink)",
                border: "none",
                borderRadius: 0,
                color: "var(--paper)",
                fontFamily: "var(--font-mono)",
                fontSize: 12,
              }}
              labelStyle={{ color: "var(--mist)" }}
              formatter={(value) => [
                typeof value === "number"
                  ? `$${value.toFixed(2)}`
                  : String(value),
                "Equity",
              ]}
            />
            <Area
              type="monotone"
              dataKey="equity"
              stroke={up ? "var(--signal-ink)" : "var(--loss)"}
              strokeWidth={2}
              fill="url(#equityFill)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
