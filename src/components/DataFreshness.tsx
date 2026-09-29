"use client";

import { useEffect, useState } from "react";

export interface FreshnessMeta {
  series: string;
  source_url: string;
  workbook_url: string;
  observation_date: string;
  release_date: string | null;
  next_release_date: string | null;
  refreshed_at: string;
}

/** EIA publishes weekly. Past this, the data on screen is behind. */
const STALE_AFTER_DAYS = 9;

function fmtDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function DataFreshness({ meta }: { meta: FreshnessMeta }) {
  // Staleness depends on "now", which differs between build and view, so it is
  // resolved after mount to avoid a hydration mismatch.
  const [ageDays, setAgeDays] = useState<number | null>(null);
  const [refreshedLocal, setRefreshedLocal] = useState<string | null>(null);

  useEffect(() => {
    const obs = new Date(meta.observation_date + "T12:00:00").getTime();
    setAgeDays(Math.floor((Date.now() - obs) / 86_400_000));
    setRefreshedLocal(
      new Date(meta.refreshed_at).toLocaleString("en-US", {
        month: "short", day: "numeric", year: "numeric",
        hour: "numeric", minute: "2-digit",
      })
    );
  }, [meta.observation_date, meta.refreshed_at]);

  const stale = ageDays !== null && ageDays > STALE_AFTER_DAYS;

  return (
    <section
      aria-label="Data freshness"
      className={`px-4 py-3 border-b text-sm ${
        stale ? "bg-amber-50 border-amber-300" : "bg-slate-100 border-slate-300"
      }`}
    >
      <div className="max-w-5xl mx-auto">
        {stale && (
          <p className="font-semibold text-amber-900 mb-1">
            <span aria-hidden="true">⚠ </span>
            Data may be out of date — last observation is {ageDays} days old.
            The figures below are the most recent successfully retrieved; no
            placeholder or estimated prices are shown.
          </p>
        )}
        <dl className="flex flex-wrap gap-x-6 gap-y-1 text-slate-700">
          <div className="flex gap-1.5">
            <dt className="text-slate-600">Prices for week of</dt>
            <dd className="font-semibold text-slate-900">
              <time dateTime={meta.observation_date}>{fmtDate(meta.observation_date)}</time>
            </dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-slate-600">EIA released</dt>
            <dd className="font-semibold text-slate-900">
              {meta.release_date ? (
                <time dateTime={meta.release_date}>{fmtDate(meta.release_date)}</time>
              ) : (
                <span className="font-normal text-slate-600">not published</span>
              )}
            </dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-slate-600">This site refreshed</dt>
            <dd className="font-semibold text-slate-900">
              {refreshedLocal ?? <span className="font-normal text-slate-600">—</span>}
            </dd>
          </div>
          {meta.next_release_date && (
            <div className="flex gap-1.5">
              <dt className="text-slate-600">Next EIA release</dt>
              <dd className="font-semibold text-slate-900">
                <time dateTime={meta.next_release_date}>{fmtDate(meta.next_release_date)}</time>
              </dd>
            </div>
          )}
        </dl>
      </div>
    </section>
  );
}
