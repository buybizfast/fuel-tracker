import { SCHEDULE_SOURCE } from "@/lib/fsc";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid sm:grid-cols-[11rem_1fr] gap-x-4 gap-y-0.5 py-2 border-b border-slate-200 last:border-0">
      <dt className="font-semibold text-slate-800">{label}</dt>
      <dd className="text-slate-700">{children}</dd>
    </div>
  );
}

export default function Methodology({
  observationDate,
  releaseDate,
}: {
  observationDate: string;
  releaseDate: string | null;
}) {
  return (
    <section className="max-w-5xl mx-auto px-4 py-8 sm:py-10">
      <details className="group rounded-xl border border-slate-300 bg-white shadow-sm">
        <summary className="cursor-pointer list-none px-4 py-3 font-semibold text-slate-900 flex items-center gap-2 rounded-xl hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
          <span className="text-slate-500 transition-transform group-open:rotate-90" aria-hidden="true">▶</span>
          How this is calculated
        </summary>

        <div className="px-4 pb-5 pt-1 text-sm">
          <dl>
            <Row label="Price input">
              <a href={SCHEDULE_SOURCE.priceIndexUrl} target="_blank" rel="noopener noreferrer"
                 className="underline text-blue-700 hover:text-blue-900">
                {SCHEDULE_SOURCE.priceIndex}
              </a>
              . Published weekly by the U.S. Energy Information Administration.
              This is the only part of this site that comes from the EIA.
            </Row>

            <Row label="Surcharge schedule">
              {SCHEDULE_SOURCE.scheduleName}
              {SCHEDULE_SOURCE.scheduleIssuer ? ` issued by ${SCHEDULE_SOURCE.scheduleIssuer}` : ""}.
              <strong className="text-slate-900"> The EIA does not publish, endorse, or standardise
              any fuel surcharge schedule.</strong>{" "}
              {SCHEDULE_SOURCE.scheduleIssuer === null && (
                <span className="text-amber-800">
                  The issuing carrier for this schedule has not been confirmed, so it should not be
                  assumed to match your carrier or to represent an industry norm.
                </span>
              )}
            </Row>

            <Row label="Truckload FSC">
              A step table: the diesel price falls in a band, and the band gives a
              surcharge in dollars per mile. Bands are $0.06 wide and each step adds
              $0.01/mile. Above the last published band the same rule is projected forward
              (<span className="font-mono">+$0.01 per $0.06</span>).
              <div className="mt-1 font-mono text-xs bg-slate-100 rounded px-2 py-1 inline-block text-slate-800">
                shipment total = rate $/mile × miles
              </div>
            </Row>

            <Row label="Intermodal IML">
              Also a step table, in percent. Bands are $0.04 wide and each step adds 0.5%.
              Above the last published band the rule is projected forward
              (<span className="font-mono">+0.5% per $0.04</span>).
              <div className="mt-1">
                <strong className="text-slate-900">The percentage applies to the linehaul charge</strong>
                {" "}— not to the total invoice, not to accessorials, and it is not a per-mile rate.
              </div>
              <div className="mt-1 font-mono text-xs bg-slate-100 rounded px-2 py-1 inline-block text-slate-800">
                surcharge $ = linehaul $ × (IML % ÷ 100)
              </div>
            </Row>

            <Row label="Custom formula">
              The optional contract calculator uses the common carrier formula, independent
              of the tables above:
              <div className="mt-1 font-mono text-xs bg-slate-100 rounded px-2 py-1 inline-block text-slate-800">
                $/mile = (diesel price − contract base price) ÷ truck MPG
              </div>
              <div className="mt-1">Returns $0.00 when diesel is at or below your base price.</div>
            </Row>

            <Row label="Rounding">
              Prices are matched to the nearest tenth of a cent ($0.001), rounded half-up,
              before a band is selected. Per-mile surcharges are held in whole cents. The
              custom formula is kept to four decimals. Shipment totals round to the cent.
            </Row>

            <Row label="Dates">
              &ldquo;Week of&rdquo; is the EIA observation date — the week the prices describe.
              The release date is the date EIA published them
              {releaseDate ? "" : ", shown only when EIA publishes it"}.
              Current data: observed{" "}
              <time dateTime={observationDate} className="font-mono">{observationDate}</time>
              {releaseDate && (
                <>, released <time dateTime={releaseDate} className="font-mono">{releaseDate}</time></>
              )}.
            </Row>

            <Row label="Assumptions & limits">
              <ul className="list-disc ml-4 space-y-0.5">
                <li>The tables were transcribed from an operator-supplied sheet on {SCHEDULE_SOURCE.transcribedOn}. Its effective date is not stated on the sheet.</li>
                <li>Values above the last published band are projected from the stated step rule. If a carrier caps or re-slopes the surcharge, projections will overstate it.</li>
                <li>Regional FSC figures apply the national schedule to a regional price. Carriers commonly index to the national average instead.</li>
                <li>No fuel economy, empty miles, accessorials, or contract minimums are modelled unless you enter them in the custom calculator.</li>
              </ul>
            </Row>
          </dl>
        </div>
      </details>
    </section>
  );
}
