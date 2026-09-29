"use client";

import { useRef, useState } from "react";
import FscLookup from "@/components/FscLookup";
import Calculators from "@/components/Calculators";
import TrendChart from "@/components/TrendChart";
import RegionalBreakdown from "@/components/RegionalBreakdown";
import GasolinePrices from "@/components/GasolinePrices";

type TabId = "diesel" | "gasoline";

const TABS: { id: TabId; label: string }[] = [
  { id: "diesel", label: "Diesel & surcharges" },
  { id: "gasoline", label: "Gasoline prices" },
];

type Row = Record<string, number | null | string>;

export default function Dashboard({
  dieselLatest, dieselPrior, gasLatest, dieselHistory,
}: {
  dieselLatest: Row;
  dieselPrior: Row;
  gasLatest: Row;
  dieselHistory: Row[];
}) {
  const [tab, setTab] = useState<TabId>("diesel");
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Left/Right/Home/End move between tabs, per the WAI-ARIA tabs pattern.
  function onKeyDown(e: React.KeyboardEvent, i: number) {
    const last = TABS.length - 1;
    let next: number | null = null;
    if (e.key === "ArrowRight") next = i === last ? 0 : i + 1;
    else if (e.key === "ArrowLeft") next = i === 0 ? last : i - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    if (next === null) return;
    e.preventDefault();
    setTab(TABS[next].id);
    btnRefs.current[next]?.focus();
  }

  return (
    <>
      <div className="border-b border-slate-300 bg-white sticky top-0 z-20">
        <div
          role="tablist"
          aria-label="Dashboard sections"
          className="max-w-5xl mx-auto px-4 flex gap-1"
        >
          {TABS.map((t, i) => {
            const selected = tab === t.id;
            return (
              <button
                key={t.id}
                ref={(el) => { btnRefs.current[i] = el; }}
                role="tab"
                id={`tab-${t.id}`}
                aria-selected={selected}
                aria-controls={`panel-${t.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setTab(t.id)}
                onKeyDown={(e) => onKeyDown(e, i)}
                className={`px-3 sm:px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors
                  focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-blue-600
                  ${selected
                    ? "border-blue-700 text-blue-800"
                    : "border-transparent text-slate-700 hover:text-slate-900 hover:border-slate-400"}`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        role="tabpanel"
        id="panel-diesel"
        aria-labelledby="tab-diesel"
        tabIndex={0}
        hidden={tab !== "diesel"}
      >
        <FscLookup />
        <TrendChart history={dieselHistory as Array<{ date: string; National?: number | null }>} />
        <RegionalBreakdown
          dieselLatest={dieselLatest}
          dieselPrior={dieselPrior}
          dieselHistory={dieselHistory}
        />
        <Calculators dieselPrice={dieselLatest["National"] as number | null} />
      </div>

      <div
        role="tabpanel"
        id="panel-gasoline"
        aria-labelledby="tab-gasoline"
        tabIndex={0}
        hidden={tab !== "gasoline"}
      >
        <GasolinePrices gasLatest={gasLatest} />
      </div>
    </>
  );
}
