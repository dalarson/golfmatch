import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMatchDate } from "../../lib/utils";
import type { EloHistoryPoint } from "../../services/statistics";

type ChartRange = "10" | "25" | "all";

export function EloChart({ history }: { history: EloHistoryPoint[] }) {
  const [range, setRange] = useState<ChartRange>("all");
  const chartData = useMemo(() => {
    const selected =
      range === "all" ? history : history.slice(-Number.parseInt(range, 10));
    return selected.map((point) => ({
      ...point,
      dateLabel: formatMatchDate(point.date, "MMM d"),
    }));
  }, [history, range]);

  if (history.length === 0) {
    return (
      <section className="card" aria-labelledby="elo-history-title">
        <p className="eyebrow">Rating progression</p>
        <h2 id="elo-history-title" className="mt-1 text-xl font-extrabold">
          ELO history
        </h2>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          ELO history will appear after this player completes a match.
        </p>
      </section>
    );
  }

  const first = chartData[0];
  const last = chartData[chartData.length - 1];
  const change = last.rating_after - first.rating_before;

  return (
    <section className="card min-w-0" aria-labelledby="elo-history-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Rating progression</p>
          <h2 id="elo-history-title" className="mt-1 text-xl font-extrabold">
            ELO history
          </h2>
        </div>
        <label className="text-xs font-bold text-slate-600">
          <span className="sr-only">Chart range</span>
          <select
            className="min-h-11 rounded-xl border bg-white px-3"
            value={range}
            onChange={(event) => setRange(event.target.value as ChartRange)}
          >
            <option value="10">Last 10</option>
            <option value="25">Last 25</option>
            <option value="all">All time</option>
          </select>
        </label>
      </div>
      <p className="mt-3 text-sm text-slate-600">
        {chartData.length} {chartData.length === 1 ? "match" : "matches"} shown.{" "}
        ELO moved from {first.rating_before} to {last.rating_after} (
        {change > 0 ? "+" : ""}
        {change}).
      </p>
      <div
        className="mt-5 h-64 min-w-0"
        role="img"
        aria-label={`ELO chart showing a change from ${first.rating_before} to ${last.rating_after} across ${chartData.length} matches.`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 4 }}>
            <CartesianGrid stroke="#dcece1" strokeDasharray="4 4" />
            <XAxis
              dataKey="dateLabel"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 11 }}
              minTickGap={28}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 11 }}
              domain={["dataMin - 20", "dataMax + 20"]}
              width={52}
            />
            <Tooltip
              labelStyle={{ color: "#17231c", fontWeight: 700 }}
              contentStyle={{ borderRadius: 12, borderColor: "#dcece1" }}
            />
            <Line
              type="monotone"
              dataKey="rating_after"
              name="ELO"
              stroke="#1d533a"
              strokeWidth={3}
              dot={{ r: 3, fill: "#f5f3ec", stroke: "#1d533a", strokeWidth: 2 }}
              activeDot={{ r: 5, fill: "#d6b55f", stroke: "#123d2a", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ol className="sr-only">
        {chartData.map((point) => (
          <li key={point.match_id}>
            {formatMatchDate(point.date, "MMMM d, yyyy")}: ELO {point.rating_after},{" "}
            change {point.rating_change > 0 ? "plus " : ""}
            {point.rating_change}.
          </li>
        ))}
      </ol>
    </section>
  );
}
