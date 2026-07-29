"use client";

import { useState } from "react";
import { getFscRate, getImlRate, FSC_TABLE, IML_TABLE, formatSurcharge, formatIml } from "@/lib/fsc";

export default function FscLookup() {
  const [input, setInput] = useState("");
  const price = parseFloat(input);
  const isValid = !isNaN(price) && price > 0 && price < 20;
  const fsc = isValid ? getFscRate(price) : null;
  const iml = isValid ? getImlRate(price) : null;

  return (
    <section className="bg-slate-50 border-y border-slate-200 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-slate-800 mb-1">
          FSC / IML Lookup Tool
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Enter any diesel price to instantly see the EIA-based linehaul
          surcharge reference rate.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 max-w-md mb-6">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">
              $
            </span>
            <input
              type="number"
              step="0.001"
              min="0"
              placeholder="e.g. 5.403"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full pl-7 pr-4 py-3 border border-slate-300 rounded-lg text-slate-800 font-mono text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
          <span className="self-center text-slate-500 text-sm">per gallon</span>
        </div>

        {(fsc || iml) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mb-8">
            {fsc && (
              <ResultCard
                label="Linehaul Surcharge (FSC)"
                value={formatSurcharge(fsc.linehaulSurcharge)}
                sub="per mile"
                color="amber"
              />
            )}
            {iml && iml.imlPct > 0 && (
              <ResultCard
                label="Intermodal (IML)"
                value={formatIml(iml.imlPct)}
                sub="of linehaul"
                color="indigo"
              />
            )}
          </div>
        )}

        <p className="text-xs text-slate-400 mb-8 max-w-2xl">
          ⚠️{" "}
          <strong>Disclaimer:</strong> Rates are a generalized EIA-based
          industry reference (Self Service linehaul surcharge table). Actual
          surcharges vary by carrier, contract, and negotiated terms. Always
          confirm directly with your carrier or broker.
        </p>

        {/* Full reference table */}
        <details className="group">
          <summary className="cursor-pointer text-sm font-semibold text-blue-600 hover:text-blue-700 mb-3 list-none flex items-center gap-1">
            <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
            View full EIA linehaul surcharge reference table
          </summary>

          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm mt-3 max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800 text-white sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold">EIA Fuel Index Range</th>
                  <th className="text-right px-4 py-2 font-semibold">Linehaul Surcharge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {FSC_TABLE.filter((r) => r.linehaulSurcharge > 0).map((row, i) => {
                  const isHighlighted =
                    isValid &&
                    price >= row.minPrice &&
                    (row.maxPrice === null || price < row.maxPrice);
                  return (
                    <tr
                      key={i}
                      className={`${
                        isHighlighted
                          ? "bg-amber-50 font-semibold ring-1 ring-inset ring-amber-300"
                          : "hover:bg-slate-50"
                      } transition-colors`}
                    >
                      <td className="px-4 py-2 font-mono text-slate-700">
                        ${row.minPrice.toFixed(3)}
                        {row.maxPrice != null
                          ? ` – $${(row.maxPrice - 0.001).toFixed(3)}`
                          : "+"}
                        {isHighlighted && (
                          <span className="ml-2 text-xs text-amber-600 font-semibold">
                            ← current
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right font-bold text-amber-700">
                        {formatSurcharge(row.linehaulSurcharge)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </details>

        {/* IML reference table */}
        <details className="group mt-4">
          <summary className="cursor-pointer text-sm font-semibold text-blue-600 hover:text-blue-700 mb-3 list-none flex items-center gap-1">
            <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
            View full IML (Intermodal) reference table
          </summary>

          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm mt-3 max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800 text-white sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold">EIA Fuel Index Range</th>
                  <th className="text-right px-4 py-2 font-semibold">IML Surcharge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {IML_TABLE.filter((r) => r.imlPct > 0).map((row, i) => {
                  const isHighlighted =
                    isValid &&
                    price >= row.minPrice &&
                    (row.maxPrice === null || price <= row.maxPrice);
                  return (
                    <tr
                      key={i}
                      className={`${
                        isHighlighted
                          ? "bg-indigo-50 font-semibold ring-1 ring-inset ring-indigo-300"
                          : "hover:bg-slate-50"
                      } transition-colors`}
                    >
                      <td className="px-4 py-2 font-mono text-slate-700">
                        ${row.minPrice.toFixed(3)}
                        {row.maxPrice != null ? ` – $${row.maxPrice.toFixed(3)}` : "+"}
                        {isHighlighted && (
                          <span className="ml-2 text-xs text-indigo-600 font-semibold">
                            ← current
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right font-bold text-indigo-600">
                        {formatIml(row.imlPct)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </section>
  );
}

function ResultCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: "amber" | "indigo";
}) {
  const border = color === "amber" ? "border-amber-400" : "border-indigo-400";
  const text = color === "amber" ? "text-amber-600" : "text-indigo-600";

  return (
    <div className={`bg-white border-2 ${border} rounded-xl p-5 text-center shadow-sm`}>
      <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-2">{label}</p>
      <p className={`text-4xl font-bold ${text}`}>{value}</p>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
    </div>
  );
}
