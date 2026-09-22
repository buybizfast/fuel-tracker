import dieselData from "@/data/diesel.json";
import gasData from "@/data/gasoline.json";
import HeroStats from "@/components/HeroStats";
import RegionalBreakdown from "@/components/RegionalBreakdown";
import FscLookup from "@/components/FscLookup";
import TrendChart from "@/components/TrendChart";

export default function Home() {
  const dieselLatest = dieselData.latest as Record<string, number | null | string>;
  const dieselPrior = (dieselData.history_52w[dieselData.history_52w.length - 2] ?? {}) as Record<string, number | null | string>;
  const gasLatest = gasData.latest as Record<string, number | null | string>;

  const weekDate = dieselLatest.date as string;

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-slate-900 text-white px-4 py-4 border-b border-slate-700">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              ⛽ Fuel Surcharge Tracker
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              National &amp; Regional FSC / IML Rates — Powered by EIA Data
            </p>
          </div>
          <a
            href="https://www.eia.gov/petroleum/gasdiesel/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-400 hover:text-white underline transition-colors hidden sm:block"
          >
            Data source: EIA.gov ↗
          </a>
        </div>
      </header>

      {/* Hero — current prices + FSC/IML */}
      <HeroStats
        dieselLatest={dieselLatest}
        dieselPrior={dieselPrior}
        gasLatest={gasLatest}
        gasPrior={{}}
        weekDate={weekDate}
      />

      {/* FSC / IML Lookup Tool */}
      <FscLookup />

      {/* 52-Week Trend Charts */}
      <TrendChart
        history52w={
          dieselData.history_52w as Array<{
            date: string;
            National?: number | null;
          }>
        }
      />

      {/* Regional + State + City Breakdown */}
      <RegionalBreakdown
        dieselLatest={dieselLatest}
        dieselPrior={dieselPrior}
        gasLatest={gasLatest}
        dieselHistory={dieselData.history_52w as Array<Record<string, number | null | string>>}
      />

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs px-4 py-8 mt-4">
        <div className="max-w-5xl mx-auto space-y-2">
          <p className="font-semibold text-slate-300">Data Sources &amp; Disclaimer</p>
          <p>
            Diesel prices sourced from the{" "}
            <a
              href="https://www.eia.gov/petroleum/gasdiesel/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white"
            >
              U.S. Energy Information Administration (EIA)
            </a>{" "}
            — Weekly On-Highway Diesel Fuel Prices. Gasoline prices from EIA
            Weekly Retail Gasoline Prices. Data updated weekly (Tuesday release).
          </p>
          <p>
            <strong className="text-slate-300">FSC/IML Disclaimer:</strong> Fuel
            surcharge and intermodal rates shown are generalized estimates based
            on a common industry reference table. Actual surcharges vary
            significantly by carrier, contract terms, lane, mode, and
            negotiated agreements. This tool is for informational purposes only.
            Always confirm current rates directly with your carrier, broker, or
            3PL.
          </p>
          <p className="pt-2 border-t border-slate-700 text-slate-500">
            Built by{" "}
            <a
              href="https://www.linkedin.com/in/jermaine-potts/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white"
            >
              Jermaine Potts
            </a>
            . Have feedback?{" "}
            <a
              href="mailto:jrmn.potts@gmail.com"
              className="underline hover:text-white"
            >
              Get in touch.
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}
