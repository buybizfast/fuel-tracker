import { formatGasPrice } from "@/lib/fsc";

const STATES = [
  { key: "California", label: "California" },
  { key: "Colorado", label: "Colorado" },
  { key: "Florida", label: "Florida" },
  { key: "Massachusetts", label: "Massachusetts" },
  { key: "Minnesota", label: "Minnesota" },
  { key: "New York", label: "New York" },
  { key: "Ohio", label: "Ohio" },
  { key: "Texas", label: "Texas" },
  { key: "Washington", label: "Washington" },
];

const CITIES = [
  { key: "Boston", label: "Boston, MA" },
  { key: "Chicago", label: "Chicago, IL" },
  { key: "Cleveland", label: "Cleveland, OH" },
  { key: "Denver", label: "Denver, CO" },
  { key: "Houston", label: "Houston, TX" },
  { key: "Los Angeles", label: "Los Angeles, CA" },
  { key: "Miami", label: "Miami, FL" },
  { key: "New York City", label: "New York City, NY" },
  { key: "San Francisco", label: "San Francisco, CA" },
  { key: "Seattle", label: "Seattle, WA" },
];

function PriceCard({ label, price, diff }: { label: string; price: number | null; diff?: number | null }) {
  // Direction is conveyed by the +/- sign and an arrow as well as by colour.
  const up = diff != null && diff > 0;
  const down = diff != null && diff < 0;
  return (
    <div className="bg-white border border-slate-300 rounded-lg p-3 text-center shadow-sm">
      <p className="text-xs text-slate-700 font-medium mb-1">{label}</p>
      <p className="text-xl font-bold text-slate-900">{formatGasPrice(price)}</p>
      {diff != null ? (
        <p className={`text-xs font-medium ${up ? "text-red-700" : down ? "text-green-800" : "text-slate-600"}`}>
          <span aria-hidden="true">{up ? "▲" : down ? "▼" : "—"}</span>{" "}
          {diff >= 0 ? "+" : "−"}${Math.abs(diff).toFixed(2)} vs national
        </p>
      ) : (
        <p className="text-xs text-slate-600">per gallon</p>
      )}
    </div>
  );
}

export default function GasolinePrices({
  gasLatest,
}: {
  gasLatest: Record<string, number | null | string>;
}) {
  const national = gasLatest["National"] as number | null;

  return (
    <section className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">Retail gasoline prices</h2>
      <p className="text-sm text-slate-700 mb-6">
        All grades, all formulations. Provided for context — fuel surcharges on this site
        are based on <strong>diesel</strong>, not gasoline.
      </p>

      <h3 className="text-lg font-bold text-slate-900 mb-1">By state</h3>
      <p className="text-sm text-slate-700 mb-4">EIA weekly retail survey</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-10">
        {STATES.map((s) => (
          <PriceCard key={s.key} label={s.label} price={gasLatest[s.key] as number | null} />
        ))}
      </div>

      <h3 className="text-lg font-bold text-slate-900 mb-1">By metro area</h3>
      <p className="text-sm text-slate-700 mb-4">Compared with the national average</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {CITIES.map((c) => {
          const price = gasLatest[c.key] as number | null;
          const raw = price != null && national != null ? price - national : null;
          return (
            <PriceCard
              key={c.key}
              label={c.label}
              price={price}
              diff={raw != null ? Math.round(raw * 1000) / 1000 : null}
            />
          );
        })}
      </div>
    </section>
  );
}
