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

  const releaseDate = new Date(weekDate + "T12:00:00");
  releaseDate.setDate(releaseDate.getDate() + 1);
  const formattedDate = releaseDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white px-4 py-14">
      <div className="max-w-5xl mx-auto">
        <p className="text-slate-400 text-sm font-medium uppercase tracking-widest mb-1">
          Week of {formattedDate}
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold mb-8">
          National Fuel Snapshot
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Diesel Price */}
          <StatCard
            label="Nat'l Diesel (DOE)"
            value={formatPrice(diesel)}
            sub={change ? `${change} from last week` : "on-highway avg"}
            accent={isUp ? "red" : isDown ? "green" : "blue"}
            badge={isUp ? "▲" : isDown ? "▼" : "—"}
          />

          {/* Linehaul FSC */}
          <StatCard
            label="Linehaul Surcharge (FSC)"
            value={fsc ? formatSurcharge(fsc.linehaulSurcharge) : "N/A"}
            sub="EIA self-service reference"
            accent="amber"
          />

          {/* IML */}
          <StatCard
            label="Intermodal (IML)"
            value={iml ? formatIml(iml.imlPct) : "N/A"}
            sub="EIA self-service reference"
            accent="indigo"
          />

          {/* Gas Price */}
          <StatCard
            label="Nat'l Gasoline (All Grades)"
            value={formatPrice(gas)}
            sub={
              gasPrev != null && gas != null
                ? `${weeklyChange(gas, gasPrev)} from last week`
                : "retail avg"
            }
            accent="emerald"
          />
        </div>

        <p className="mt-6 text-xs text-slate-500 max-w-3xl">
          ⚠️{" "}
          <strong className="text-slate-400">Disclaimer:</strong> Linehaul
          surcharge rates shown are a generalized EIA-based industry reference.
          Actual FSC and IML rates vary by carrier, contract terms, lane, and
          negotiated agreements. Always confirm current rates directly with your
          carrier or broker.
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
    <div className={`bg-slate-800/60 border-l-4 ${accentMap[accent]} rounded-xl p-5 backdrop-blur`}>
      <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-2">
        {label}
      </p>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold tracking-tight">{value}</span>
        {badge && (
          <span className="text-sm font-semibold text-slate-400 mb-1">{badge}</span>
        )}
      </div>
      <p className="text-xs text-slate-500 mt-1">{sub}</p>
    </div>
  );
}
