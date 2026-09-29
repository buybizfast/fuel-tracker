"use client";

import { useEffect, useState } from "react";
import {
  getFscRate, getImlRate, customFscPerMile,
  estimateShipmentFsc, estimateIntermodalSurcharge,
  formatSurcharge, formatIml, formatPrice,
} from "@/lib/fsc";

const STORE_KEY = "fsctracker.customRule";

const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });
const num = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });

function Field({
  id, label, hint, suffix, prefix, value, onChange, placeholder, inputMode = "decimal",
}: {
  id: string; label: string; hint?: string; suffix?: string; prefix?: string;
  value: string; onChange: (v: string) => void; placeholder?: string; inputMode?: "decimal" | "numeric";
}) {
  return (
    <div className="flex-1 min-w-0">
      <label htmlFor={id} className="block text-sm font-semibold text-slate-800 mb-1">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 font-semibold" aria-hidden="true">
            {prefix}
          </span>
        )}
        <input
          id={id}
          type="number"
          inputMode={inputMode}
          min="0"
          step="any"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className={`w-full ${prefix ? "pl-7" : "pl-3"} ${suffix ? "pr-14" : "pr-3"} py-2.5 border border-slate-400 rounded-lg
                      text-slate-900 font-mono bg-white
                      focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 text-sm" aria-hidden="true">
            {suffix}
          </span>
        )}
      </div>
      {hint && <p id={`${id}-hint`} className="text-xs text-slate-600 mt-1">{hint}</p>}
    </div>
  );
}

function Result({
  label, value, working, tone = "amber",
}: {
  label: string; value: string; working: string; tone?: "amber" | "indigo" | "slate";
}) {
  const tones = {
    amber: "border-amber-500 text-amber-800 bg-amber-50",
    indigo: "border-indigo-500 text-indigo-800 bg-indigo-50",
    slate: "border-slate-400 text-slate-800 bg-slate-50",
  } as const;
  return (
    <div className={`rounded-lg border-2 px-4 py-3 ${tones[tone]}`} role="status" aria-live="polite">
      <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
      <p className="text-2xl sm:text-3xl font-bold mt-0.5 text-slate-900">{value}</p>
      <p className="text-xs font-mono mt-1 text-slate-700">{working}</p>
      <p className="text-xs mt-1 text-slate-700">Estimate — confirm with your carrier.</p>
    </div>
  );
}

export default function Calculators({ dieselPrice }: { dieselPrice: number | null }) {
  const tableFsc = dieselPrice != null ? getFscRate(dieselPrice) : null;
  const tableIml = dieselPrice != null ? getImlRate(dieselPrice) : null;

  const [miles, setMiles] = useState("");
  const [linehaul, setLinehaul] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [mpg, setMpg] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Preferences persist per browser; no account required.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (typeof p.basePrice === "string") setBasePrice(p.basePrice);
        if (typeof p.mpg === "string") setMpg(p.mpg);
        if (typeof p.useCustom === "boolean") setUseCustom(p.useCustom);
      }
    } catch { /* private mode or blocked storage — fall back to empty */ }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ basePrice, mpg, useCustom }));
    } catch { /* ignore */ }
  }, [basePrice, mpg, useCustom, loaded]);

  const custom =
    dieselPrice != null && basePrice !== "" && mpg !== ""
      ? customFscPerMile(dieselPrice, parseFloat(basePrice), parseFloat(mpg))
      : null;

  const customReady = custom !== null;
  const activeRate = useCustom && customReady ? custom.perMile : tableFsc?.linehaulSurcharge ?? null;
  const rateLabel = useCustom && customReady ? "your contract formula" : "the reference table";

  const shipment =
    miles !== "" && activeRate != null
      ? estimateShipmentFsc(parseFloat(miles), activeRate)
      : null;

  const intermodal =
    linehaul !== "" && tableIml != null
      ? estimateIntermodalSurcharge(parseFloat(linehaul), tableIml.imlPct)
      : null;

  const milesInvalid = miles !== "" && shipment === null;
  const linehaulInvalid = linehaul !== "" && intermodal === null;
  const customInvalid = (basePrice !== "" || mpg !== "") && !customReady;

  return (
    <section className="bg-slate-50 border-y border-slate-300 py-8 sm:py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">Shipment calculator</h2>
          <p className="text-sm text-slate-700">
            Applies the current diesel price of{" "}
            <span className="font-mono font-semibold">{formatPrice(dieselPrice)}</span> to a shipment.
          </p>
        </div>

        {/* ── Truckload ─────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-300 p-4 sm:p-5 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-3">Truckload fuel surcharge</h3>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-start">
            <Field
              id="calc-miles" label="Miles" suffix="mi" value={miles} onChange={setMiles}
              placeholder="1000"
              hint={activeRate != null ? `Using ${formatSurcharge(activeRate)} from ${rateLabel}` : undefined}
            />
            <div className="flex-1">
              {shipment ? (
                <Result
                  label="Estimated total fuel surcharge"
                  value={usd(shipment.total)}
                  working={`${formatSurcharge(shipment.ratePerMile)} × ${num(shipment.miles)} mi = ${usd(shipment.total)}`}
                />
              ) : (
                <p className="text-sm text-slate-600 sm:pt-7">
                  {milesInvalid ? "Enter a positive number of miles." : "Enter miles to see the total."}
                </p>
              )}
            </div>
          </div>

          {customReady && (
            <div className="mt-4 pt-3 border-t border-slate-200">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useCustom}
                  onChange={(e) => setUseCustom(e.target.checked)}
                  className="w-4 h-4 accent-blue-700"
                />
                Use my contract formula ({formatSurcharge(custom.perMile)}) instead of the table
                ({tableFsc ? formatSurcharge(tableFsc.linehaulSurcharge) : "n/a"})
              </label>
            </div>
          )}
        </div>

        {/* ── Intermodal ────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-300 p-4 sm:p-5 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-1">Intermodal surcharge</h3>
          <p className="text-sm text-slate-700 mb-3">
            IML is a percentage <strong>of the linehaul charge</strong>, not of the total invoice.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-start">
            <Field
              id="calc-linehaul" label="Linehaul charge" prefix="$" value={linehaul} onChange={setLinehaul}
              placeholder="2000"
              hint={tableIml ? `Current IML rate ${formatIml(tableIml.imlPct)}` : undefined}
            />
            <div className="flex-1">
              {intermodal ? (
                <Result
                  tone="indigo"
                  label="Estimated intermodal surcharge"
                  value={usd(intermodal.surcharge)}
                  working={`${usd(intermodal.linehaul)} × ${formatIml(intermodal.pct)} = ${usd(intermodal.surcharge)} · linehaul + surcharge = ${usd(intermodal.total)}`}
                />
              ) : (
                <p className="text-sm text-slate-600 sm:pt-7">
                  {linehaulInvalid ? "Enter a positive linehaul amount." : "Enter a linehaul charge to see the surcharge."}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Custom contract rule ──────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-300 p-4 sm:p-5 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-1">Your contract formula (optional)</h3>
          <p className="text-sm text-slate-700 mb-3">
            Separate from the reference table. Uses{" "}
            <span className="font-mono">(diesel − base) ÷ MPG</span>. Saved in this browser only —
            no account, and nothing is sent anywhere.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-start">
            <Field
              id="calc-base" label="Contract base price" prefix="$" value={basePrice} onChange={setBasePrice}
              placeholder="1.250" hint="Diesel price at which no surcharge applies"
            />
            <Field
              id="calc-mpg" label="Truck fuel economy" suffix="mpg" value={mpg} onChange={setMpg}
              placeholder="6.0" hint="Typically 5.5–7.0 for a loaded tractor"
            />
            <div className="flex-1">
              {custom && custom.perMile > 0 ? (
                <Result
                  tone="slate"
                  label="Your surcharge"
                  value={`$${custom.perMile.toFixed(4)}/mi`}
                  working={`(${formatPrice(dieselPrice)} − $${parseFloat(basePrice).toFixed(3)}) ÷ ${parseFloat(mpg)} mpg = $${custom.perMile.toFixed(4)}/mi`}
                />
              ) : custom ? (
                <Result
                  tone="slate"
                  label="Your surcharge"
                  value="$0.0000/mi"
                  working={`Diesel ${formatPrice(dieselPrice)} is at or below your base price — no surcharge applies.`}
                />
              ) : (
                <p className="text-sm text-slate-600 sm:pt-7">
                  {customInvalid
                    ? "Enter a base price and a fuel economy greater than zero."
                    : "Enter both values to calculate."}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
