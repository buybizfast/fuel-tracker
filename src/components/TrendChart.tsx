"use client";

import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getFscRate, getImlRate } from "@/lib/fsc";

interface WeekRow {
  date: string;
  National?: number | null;
  [key: string]: unknown;
}

interface TrendChartProps {
  history: WeekRow[];
}

export default function TrendChart({ history }: TrendChartProps) {
  const filtered = history.filter((r) => r.National != null);

  const data = filtered
    .map((r) => {
      const price = r.National as number;
      const fsc = getFscRate(price);
      const iml = getImlRate(price);
      if (!fsc || !iml) return null;
      return {
        date: r.date,
        "Diesel $/gal": price,
        "FSC $/mi": fsc.linehaulSurcharge,
        "IML %": iml.imlPct,
      };
    })
    .filter((d) => d !== null);

  // Label only the first week of each new month to avoid crowding
  const labelDates = new Set<string>();
  const seenMonths = new Set<string>();
  data.forEach((d) => {
    const dt = new Date(d.date + "T12:00:00");
    const key = `${dt.getFullYear()}-${dt.getMonth()}`;
    if (!seenMonths.has(key)) {
      seenMonths.add(key);
      labelDates.add(d.date);
    }
  });

  const tickFormatter = (dateStr: string) => {
    if (!labelDates.has(dateStr)) return "";
    const dt = new Date(dateStr + "T12:00:00");
    const mon = dt.toLocaleDateString("en-US", { month: "short" });
    const yr = dt.getFullYear().toString().slice(2);
    return `${mon} '${yr}`;
  };

  const tooltipLabel = (label: unknown) => {
    const dt = new Date(String(label) + "T12:00:00");
    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const xAxisProps = {
    dataKey: "date",
    tickFormatter,
    interval: 0,
    tick: { fontSize: 10, fill: "#94a3b8", angle: -45, textAnchor: "end" as const, dy: 4 },
    tickLine: false,
    height: 48,
  };

  return (
    <section className="max-w-5xl mx-auto px-4 py-12">
      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">Fuel Trend since Jan 2025</h2>
      <p className="text-sm text-slate-700 mb-6">
        EIA national diesel price, with estimated truckload (FSC) and intermodal (IML) surcharges from the carrier schedule
      </p>

      {/* Diesel price */}
      <ChartCard title="Diesel price, US average ($/gal) — EIA">
        <ComposedChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis {...xAxisProps} />
          <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => `$${Number(v).toFixed(2)}`} tickLine={false} axisLine={false} width={52} />
          <Tooltip labelFormatter={tooltipLabel} formatter={(val) => [`$${Number(val).toFixed(3)}`, "Diesel"]} labelStyle={{ fontWeight: "bold" }} contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
          <Bar dataKey="Diesel $/gal" fill="#3b82f6" opacity={0.2} radius={[2, 2, 0, 0]} tooltipType="none" />
          <Line type="monotone" dataKey="Diesel $/gal" stroke="#2563eb" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ChartCard>

      {/* FSC $/mi */}
      <ChartCard title="Estimated truckload surcharge — FSC ($/mile)">
        <ComposedChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis {...xAxisProps} />
          <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => `$${Number(v).toFixed(2)}`} tickLine={false} axisLine={false} width={44} />
          <Tooltip labelFormatter={tooltipLabel} formatter={(val, name) => [`$${Number(val).toFixed(2)}/mi`, name]} labelStyle={{ fontWeight: "bold" }} contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
          <Bar dataKey="FSC $/mi" fill="#f59e0b" opacity={0.2} radius={[2, 2, 0, 0]} tooltipType="none" />
          <Line type="monotone" dataKey="FSC $/mi" stroke="#f59e0b" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ChartCard>

      {/* IML % */}
      <ChartCard title="Estimated intermodal surcharge — IML (% of linehaul)">
        <ComposedChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis {...xAxisProps} />
          <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => `${Number(v).toFixed(1)}%`} tickLine={false} axisLine={false} width={48} />
          <Tooltip labelFormatter={tooltipLabel} formatter={(val, name) => [`${Number(val).toFixed(1)}%`, name]} labelStyle={{ fontWeight: "bold" }} contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
          <Bar dataKey="IML %" fill="#6366f1" opacity={0.2} radius={[2, 2, 0, 0]} tooltipType="none" />
          <Line type="monotone" dataKey="IML %" stroke="#6366f1" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ChartCard>
    </section>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-sm mb-4 sm:mb-6 last:mb-0">
      <p className="text-sm font-semibold text-slate-800 mb-2 sm:mb-3">{title}</p>
      <ResponsiveContainer width="100%" height={180} className="sm:!h-[220px]">
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  );
}
