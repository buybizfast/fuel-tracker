"use client";

import { Fragment, useState } from "react";
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getFscRate, getImlRate, formatPrice, formatGasPrice, formatSurcharge, formatIml } from "@/lib/fsc";

interface RegionalBreakdownProps {
  dieselLatest: Record<string, number | null | string>;
  dieselPrior: Record<string, number | null | string>;
  gasLatest: Record<string, number | null | string>;
  dieselHistory: Array<Record<string, number | null | string>>;
}

const PADD_REGIONS = [
  { key: "National",         label: "🇺🇸 National Average", padd: "" },
  { key: "East Coast",       label: "East Coast",           padd: "PADD 1" },
  { key: "New England",      label: "New England",          padd: "PADD 1A" },
  { key: "Central Atlantic", label: "Central Atlantic",     padd: "PADD 1B" },
  { key: "Lower Atlantic",   label: "Lower Atlantic",       padd: "PADD 1C" },
  { key: "Midwest",          label: "Midwest",              padd: "PADD 2" },
  { key: "Gulf Coast",       label: "Gulf Coast",           padd: "PADD 3" },
  { key: "Rocky Mountain",   label: "Rocky Mountain",       padd: "PADD 4" },
  { key: "West Coast",       label: "West Coast",           padd: "PADD 5" },
  { key: "California",       label: "California",           padd: "PADD 5" },
];

const STATES = [
  { key: "California",    label: "California" },
  { key: "Colorado",      label: "Colorado" },
  { key: "Florida",       label: "Florida" },
  { key: "Massachusetts", label: "Massachusetts" },
  { key: "Minnesota",     label: "Minnesota" },
  { key: "New York",      label: "New York" },
  { key: "Ohio",          label: "Ohio" },
  { key: "Texas",         label: "Texas" },
  { key: "Washington",    label: "Washington" },
];

const CITIES = [
  { key: "Boston",        label: "Boston, MA" },
  { key: "Chicago",       label: "Chicago, IL" },
  { key: "Cleveland",     label: "Cleveland, OH" },
  { key: "Denver",        label: "Denver, CO" },
  { key: "Houston",       label: "Houston, TX" },
  { key: "Los Angeles",   label: "Los Angeles, CA" },
  { key: "Miami",         label: "Miami, FL" },
  { key: "New York City", label: "New York City, NY" },
  { key: "San Francisco", label: "San Francisco, CA" },
  { key: "Seattle",       label: "Seattle, WA" },
];

export default function RegionalBreakdown({
  dieselLatest,
  dieselPrior,
  gasLatest,
  dieselHistory,
}: RegionalBreakdownProps) {
  const [activeRegion, setActiveRegion] = useState<string | null>(null);

  function toggleRegion(key: string) {
    setActiveRegion((prev) => (prev === key ? null : key));
  }

  function buildChartData(regionKey: string) {
    const data = dieselHistory
      .filter((row) => row[regionKey] != null)
      .map((row) => {
        const price = row[regionKey] as number;
        return {
          date: String(row.date),
          price,
          fsc: getFscRate(price).linehaulSurcharge,
        };
      });

    // Label the first week of each quarter only — monthly labels collide on phones.
    // Every date stays in the data (and so in the axis domain); the rest just render blank.
    const seenQuarters = new Set<string>();
    const labelDates = new Set<string>();
    data.forEach((d) => {
      const dt = new Date(d.date + "T12:00:00");
      const qk = `${dt.getFullYear()}-Q${Math.floor(dt.getMonth() / 3)}`;
      if (!seenQuarters.has(qk)) {
        seenQuarters.add(qk);
        labelDates.add(d.date);
      }
    });

    return { data, labelDates };
  }

  const makeTickFormatter = (labelDates: Set<string>) => (dateStr: string) => {
    if (!labelDates.has(dateStr)) return "";
    const dt = new Date(dateStr + "T12:00:00");
    return `${dt.toLocaleDateString("en-US", { month: "short" })} '${dt.getFullYear().toString().slice(2)}`;
  };

  const tooltipLabel = (label: unknown) => {
    const dt = new Date(String(label) + "T12:00:00");
    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <section className="max-w-5xl mx-auto px-4 py-8 sm:py-12">

      {/* ── PADD Diesel + FSC table ─────────────────────────────── */}
      <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-1">Regional Breakdown</h2>
      <p className="text-sm text-slate-500 mb-4 sm:mb-6">
        Tap a region to see its diesel &amp; FSC trend
      </p>

      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm mb-8 sm:mb-12">
        <table className="w-full text-sm">
          <thead className="bg-slate-800 text-white">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Region</th>
              <th className="hidden sm:table-cell text-center px-4 py-3 font-semibold">
                <span className="group relative inline-flex items-center gap-1 cursor-help">
                  PADD
                  <span className="text-slate-400 text-xs">ⓘ</span>
                  <span className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 rounded-lg bg-slate-900 text-white text-xs font-normal px-3 py-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 text-left leading-relaxed">
                    <strong>Petroleum Administration for Defense Districts</strong> — geographic regions used by the U.S. EIA to report fuel price data. Created during WWII to manage fuel distribution, still used today.
                  </span>
                </span>
              </th>
              <th className="text-right px-3 sm:px-4 py-3 font-semibold">Diesel</th>
              <th className="text-right px-3 sm:px-4 py-3 font-semibold">Chg</th>
              <th className="text-right px-3 sm:px-4 py-3 font-semibold">FSC</th>
              <th className="hidden md:table-cell text-right px-4 py-3 font-semibold">IML</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {PADD_REGIONS.map((r, idx) => {
              const price = dieselLatest[r.key] as number | null;
              const prior = dieselPrior[r.key] as number | null;
              const fsc = price != null ? getFscRate(price) : null;
              const iml = price != null ? getImlRate(price) : null;
              const chg = price != null && prior != null ? price - prior : null;
              const isActive = activeRegion === r.key;
              const chart = isActive ? buildChartData(r.key) : null;

              return (
                <Fragment key={r.key}>
                  <tr
                    onClick={() => toggleRegion(r.key)}
                    className={`cursor-pointer transition-colors ${
                      isActive
                        ? "bg-blue-50 border-l-2 border-blue-500"
                        : idx === 0
                        ? "bg-slate-50 font-semibold hover:bg-blue-50"
                        : "hover:bg-blue-50"
                    }`}
                  >
                    <td className="px-3 sm:px-4 py-3 text-black text-xs sm:text-sm">
                      <span className="flex items-center gap-1.5">
                        <span className={`text-slate-400 text-xs transition-transform ${isActive ? "rotate-90" : ""}`}>▶</span>
                        {r.label}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3 text-center text-slate-500 text-xs">{r.padd}</td>
                    <td className="px-3 sm:px-4 py-3 text-right font-mono text-black text-xs sm:text-sm">{formatPrice(price)}</td>
                    <td className={`px-3 sm:px-4 py-3 text-right font-mono text-xs ${
                      chg == null ? "text-slate-400" : chg > 0 ? "text-red-500" : chg < 0 ? "text-green-600" : "text-slate-400"
                    }`}>
                      {chg != null ? `${chg >= 0 ? "+" : ""}$${chg.toFixed(3)}` : "—"}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-right font-semibold text-amber-600 text-xs sm:text-sm">
                      {fsc ? formatSurcharge(fsc.linehaulSurcharge) : "—"}
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-right font-semibold text-indigo-600">
                      {iml ? formatIml(iml.imlPct) : "—"}
                    </td>
                  </tr>
                  {chart && (
                    <tr>
                      <td colSpan={6} className="px-2 sm:px-4 py-3 sm:py-4 bg-blue-50 border-l-2 border-blue-500">
                        <p className="text-xs font-semibold text-slate-600 mb-2 sm:mb-3 px-1">
                          {r.label}
                          {" — Diesel & FSC since Jan 2025"}
                        </p>
                        <ResponsiveContainer width="100%" height={190}>
                          <ComposedChart data={chart.data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#cbd8e8" vertical={false} />
                            <XAxis
                              dataKey="date"
                              interval={0}
                              tickFormatter={makeTickFormatter(chart.labelDates)}
                              tick={{ fontSize: 9, fill: "#94a3b8" }}
                              tickLine={false}
                              height={20}
                            />
                            <YAxis
                              yAxisId="price"
                              domain={["auto", "auto"]}
                              tick={{ fontSize: 9, fill: "#2563eb" }}
                              tickFormatter={(v) => `$${Number(v).toFixed(2)}`}
                              tickLine={false}
                              axisLine={false}
                              width={40}
                            />
                            <YAxis
                              yAxisId="fsc"
                              orientation="right"
                              tick={{ fontSize: 9, fill: "#f59e0b" }}
                              tickFormatter={(v) => `$${Number(v).toFixed(2)}`}
                              tickLine={false}
                              axisLine={false}
                              width={38}
                            />
                            <Tooltip
                              labelFormatter={tooltipLabel}
                              formatter={(val, name) =>
                                name === "Diesel"
                                  ? [`$${Number(val).toFixed(3)}/gal`, name]
                                  : [`$${Number(val).toFixed(2)}/mi`, name]
                              }
                              contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                            />
                            <Bar yAxisId="price" dataKey="price" name="Diesel" fill="#3b82f6" opacity={0.15} radius={[2,2,0,0]} tooltipType="none" />
                            <Line yAxisId="price" type="monotone" dataKey="price" name="Diesel" stroke="#2563eb" strokeWidth={2} dot={false} />
                            <Line yAxisId="fsc" type="monotone" dataKey="fsc" name="FSC" stroke="#f59e0b" strokeWidth={2} dot={false} />
                          </ComposedChart>
                        </ResponsiveContainer>
                        <p className="text-xs text-slate-400 mt-1 px-1">
                          <span className="text-blue-600 font-medium">Diesel $/gal</span> (left) ·{" "}
                          <span className="text-amber-600 font-medium">FSC $/mi</span> (right)
                        </p>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── State Gasoline Prices ────────────────────────────────── */}
      <h3 className="text-lg font-bold text-slate-800 mb-1">State Gasoline Prices</h3>
      <p className="text-sm text-slate-500 mb-4">
        All grades, all formulations (EIA weekly retail)
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-12">
        {STATES.map((s) => {
          const price = gasLatest[s.key] as number | null;
          return (
            <div key={s.key} className="bg-white border border-slate-200 rounded-lg p-3 text-center shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs text-slate-500 font-medium mb-1">{s.label}</p>
              <p className="text-xl font-bold text-slate-800">{formatGasPrice(price)}</p>
              <p className="text-xs text-slate-400">per gallon</p>
            </div>
          );
        })}
      </div>

      {/* ── Metro City Gasoline Prices ───────────────────────────── */}
      <h3 className="text-lg font-bold text-slate-800 mb-1">Metro Area Gasoline Prices</h3>
      <p className="text-sm text-slate-500 mb-4">
        All grades, all formulations — vs. national average
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {CITIES.map((c) => {
          const price = gasLatest[c.key] as number | null;
          const national = gasLatest["National"] as number | null;
          const rawDiff = price != null && national != null ? price - national : null;
          const diff = rawDiff != null ? Math.round(rawDiff * 1000) / 1000 : null;

          return (
            <div key={c.key} className="bg-white border border-slate-200 rounded-lg p-3 text-center shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs text-slate-500 font-medium mb-1">{c.label}</p>
              <p className="text-xl font-bold text-slate-800">{formatGasPrice(price)}</p>
              {diff != null && (
                <p className={`text-xs font-medium ${diff > 0 ? "text-red-500" : diff < 0 ? "text-green-600" : "text-slate-400"}`}>
                  {diff >= 0 ? "+" : "-"}${Math.abs(diff).toFixed(2)} vs nat&apos;l
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
