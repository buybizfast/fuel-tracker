"use client";

import { getFscRate, getImlRate, formatPrice, formatGasPrice, formatSurcharge, formatIml } from "@/lib/fsc";

interface RegionalBreakdownProps {
  dieselLatest: Record<string, number | null | string>;
  dieselPrior: Record<string, number | null | string>;
  gasLatest: Record<string, number | null | string>;
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
}: RegionalBreakdownProps) {
  return (
    <section className="max-w-5xl mx-auto px-4 py-12">

      {/* ── PADD Diesel + FSC table ─────────────────────────────── */}
      <h2 className="text-2xl font-bold text-slate-800 mb-1">Regional Breakdown</h2>
      <p className="text-sm text-slate-500 mb-6">
        Diesel prices by PADD region with EIA-based linehaul surcharge reference
      </p>

      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm mb-12">
        <table className="w-full text-sm">
          <thead className="bg-slate-800 text-white">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Region</th>
              <th className="text-center px-4 py-3 font-semibold">
                <span className="group relative inline-flex items-center gap-1 cursor-help">
                  PADD
                  <span className="text-slate-400 text-xs">ⓘ</span>
                  <span className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 rounded-lg bg-slate-900 text-white text-xs font-normal px-3 py-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 text-left leading-relaxed">
                    <strong>Petroleum Administration for Defense Districts</strong> — geographic regions used by the U.S. EIA to report fuel price data. Created during WWII to manage fuel distribution, still used today.
                  </span>
                </span>
              </th>
              <th className="text-right px-4 py-3 font-semibold">Diesel $/gal</th>
              <th className="text-right px-4 py-3 font-semibold">Chg</th>
              <th className="text-right px-4 py-3 font-semibold">FSC $/mi</th>
              <th className="text-right px-4 py-3 font-semibold">IML $/mi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {PADD_REGIONS.map((r, idx) => {
              const price = dieselLatest[r.key] as number | null;
              const prior = dieselPrior[r.key] as number | null;
              const fsc = price != null ? getFscRate(price) : null;
              const iml = price != null ? getImlRate(price) : null;
              const chg = price != null && prior != null ? price - prior : null;

              return (
                <tr
                  key={r.key}
                  className={`${idx === 0 ? "bg-blue-50 font-semibold" : "hover:bg-slate-50"} transition-colors`}
                >
                  <td className="px-4 py-3 text-black">{r.label}</td>
                  <td className="px-4 py-3 text-center text-slate-500 text-xs">{r.padd}</td>
                  <td className="px-4 py-3 text-right font-mono text-black">{formatPrice(price)}</td>
                  <td className={`px-4 py-3 text-right font-mono text-xs ${
                    chg == null ? "text-slate-400" : chg > 0 ? "text-red-500" : chg < 0 ? "text-green-600" : "text-slate-400"
                  }`}>
                    {chg != null ? `${chg >= 0 ? "+" : ""}$${chg.toFixed(3)}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-amber-600">
                    {fsc ? formatSurcharge(fsc.linehaulSurcharge) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-indigo-600">
                    {iml ? formatIml(iml.imlPct) : "—"}
                  </td>
                </tr>
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
