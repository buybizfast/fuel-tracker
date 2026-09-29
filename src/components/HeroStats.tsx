"use client";

import { getFscRate, getImlRate, formatSurcharge, formatIml, formatPrice, weeklyChange } from "@/lib/fsc";

interface HeroStatsProps {
  dieselLatest: Record<string, number | null | string>;
  dieselPrior: Record<string, number | null | string>;
  gasLatest: Record<string, number | null | string>;
  gasPrior: Record<string, number | null | string>;
  weekDate: string;
}

export default function HeroStats({
  dieselLatest,
  dieselPrior,
  gasLatest,
  gasPrior,
  weekDate,
}: HeroStatsProps) {
  const diesel = dieselLatest["National"] as number | null;
  const dieselPrev = dieselPrior["National"] as number | null;
  const gas = gasLatest["National"] as number | null;
  const gasPrev = gasPrior["National"] as number | null;

  const fsc = diesel != null ? getFscRate(diesel) : null;
  const iml = diesel != null ? getImlRate(diesel) : null;
  const change = weeklyChange(diesel, dieselPrev);
  const isUp = diesel != null && dieselPrev != null && diesel > dieselPrev;
  const isDown = diesel != null && dieselPrev != null && diesel < dieselPrev;

  const formattedDate = new Date(weekDate + "T12:00:00").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white px-4 py-8 sm:py-14">
      <div className="max-w-5xl mx-auto">
        <p className="text-slate-300 text-xs sm:text-sm font-medium uppercase tracking-widest mb-1">
          Week of {formattedDate}
        </p>
        <h2 className="text-2xl sm:text-4xl font-bold mb-5 sm:mb-8">
          National Fuel Snapshot
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Diesel Price */}
          <StatCard
            label="US diesel avg (EIA)"
            value={formatPrice(diesel)}
            sub={change ? `${change} from last week` : "on-highway avg"}
            accent={isUp ? "red" : isDown ? "green" : "blue"}
            badge={isUp ? "▲" : isDown ? "▼" : "—"}
          />

          {/* Linehaul FSC */}
          <StatCard
            label="Truckload FSC (est.)"
            value={fsc ? formatSurcharge(fsc.linehaulSurcharge) : "N/A"}
            sub="Carrier schedule estimate"
            accent="amber"
          />

          {/* IML */}
          <StatCard
            label="Intermodal IML (est.)"
            value={iml ? formatIml(iml.imlPct) : "N/A"}
            sub="Carrier schedule estimate"
            accent="indigo"
          />

          {/* Gas Price */}
          <StatCard
            label="US gasoline avg (EIA)"
            value={formatPrice(gas)}
            sub={
              gasPrev != null && gas != null
                ? `${weeklyChange(gas, gasPrev)} from last week`
                : "retail avg"
            }
            accent="emerald"
          />
        </div>

        <p className="mt-6 text-xs text-slate-300 max-w-3xl">
          <strong className="text-slate-200">Prices</strong> are from the U.S. EIA.{" "}
          <strong className="text-slate-200">Surcharges are estimates</strong> derived from a
          carrier tariff schedule — the EIA does not publish or endorse any fuel surcharge
          schedule. Rates vary by carrier, contract, lane, and mode. See &ldquo;How this is
          calculated&rdquo; below, and confirm with your carrier.
        </p>
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
  badge,
}: {
  label: string;
  value: string;
  sub: string;
  accent: "blue" | "amber" | "indigo" | "emerald" | "red" | "green";
  badge?: string;
}) {
  const accentMap: Record<string, string> = {
    blue: "border-blue-500",
    amber: "border-amber-400",
    indigo: "border-indigo-400",
    emerald: "border-emerald-400",
    red: "border-red-400",
    green: "border-green-400",
  };

  return (
    <div className={`bg-slate-800/60 border-l-4 ${accentMap[accent]} rounded-xl p-3 sm:p-5 backdrop-blur`}>
      <p className="text-xs text-slate-300 uppercase tracking-wide font-medium mb-1 sm:mb-2 leading-tight">
        {label}
      </p>
      <div className="flex items-end gap-1 sm:gap-2">
        <span className="text-2xl sm:text-3xl font-bold tracking-tight">{value}</span>
        {badge && (
          <span className="text-sm font-semibold text-slate-300 mb-0.5">{badge}</span>
        )}
      </div>
      <p className="text-xs text-slate-300 mt-1 leading-tight">{sub}</p>
    </div>
  );
}
