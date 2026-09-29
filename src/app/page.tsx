import dieselData from "@/data/diesel.json";
import gasData from "@/data/gasoline.json";
import HeroStats from "@/components/HeroStats";
import DataFreshness, { type FreshnessMeta } from "@/components/DataFreshness";
import Dashboard from "@/components/Dashboard";
import Methodology from "@/components/Methodology";
import { SCHEDULE_SOURCE } from "@/lib/fsc";

type Row = Record<string, number | null | string>;

export default function Home() {
  const dieselLatest = dieselData.latest as Row;
  const history = dieselData.history as Row[];
  const dieselPrior = (history[history.length - 2] ?? {}) as Row;
  const gasLatest = gasData.latest as Row;
  const meta = dieselData.meta as FreshnessMeta;

  return (
    <main className="min-h-screen bg-white">
      <header className="bg-slate-900 text-white px-4 py-4 border-b border-slate-700">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              <span aria-hidden="true">⛽ </span>Fuel Surcharge Tracker
            </h1>
            <p className="text-xs text-slate-300 mt-0.5">
              Weekly EIA diesel prices with estimated FSC &amp; IML surcharges
            </p>
          </div>
          <a
            href={SCHEDULE_SOURCE.priceIndexUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-300 hover:text-white underline hidden sm:block rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Price data: EIA.gov ↗
          </a>
        </div>
      </header>

      <DataFreshness meta={meta} />

      <HeroStats
        dieselLatest={dieselLatest}
        dieselPrior={dieselPrior}
        gasLatest={gasLatest}
        gasPrior={{}}
        weekDate={meta.observation_date}
      />

      <Dashboard
        dieselLatest={dieselLatest}
        dieselPrior={dieselPrior}
        gasLatest={gasLatest}
        dieselHistory={history}
      />

      <Methodology
        observationDate={meta.observation_date}
        releaseDate={meta.release_date}
      />

      <footer className="bg-slate-900 text-slate-300 text-xs px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-3">
          <p className="font-semibold text-white">Sources &amp; disclaimer</p>
          <p>
            <strong className="text-white">Prices:</strong> U.S. Energy Information
            Administration weekly retail surveys —{" "}
            <a href={SCHEDULE_SOURCE.priceIndexUrl} target="_blank" rel="noopener noreferrer"
               className="underline hover:text-white">eia.gov/petroleum/gasdiesel</a>.
          </p>
          <p>
            <strong className="text-white">Surcharges:</strong> estimates derived from a carrier
            &ldquo;Self Service&rdquo; tariff schedule supplied by the site operator. The EIA
            publishes fuel prices only; it does not publish, endorse, or standardise any fuel
            surcharge schedule, and nothing here is an EIA product or an industry standard.
            Actual FSC and IML vary by carrier, contract, lane, and mode — always confirm with
            your carrier, broker, or 3PL before billing.
          </p>
          <p className="pt-2 border-t border-slate-700 text-slate-400">
            Built by{" "}
            <a href="https://www.linkedin.com/in/jermaine-potts/" target="_blank" rel="noopener noreferrer"
               className="underline hover:text-white">Jermaine Potts</a>. Feedback:{" "}
            <a href="mailto:jrmn.potts@gmail.com" className="underline hover:text-white">get in touch</a>.
          </p>
        </div>
      </footer>
    </main>
  );
}
