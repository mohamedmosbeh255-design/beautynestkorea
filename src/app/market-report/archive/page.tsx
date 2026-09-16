import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, CalendarDays } from "lucide-react";
import { listReportDates, siteBaseUrl } from "@/lib/market-report";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Market Report Archive",
  description:
    "Browse every daily K-beauty market intelligence report: trending ingredients, community pulse, social signals and competitor watchlist.",
  alternates: { canonical: `${siteBaseUrl()}/market-report/archive` },
};

export default async function MarketReportArchivePage() {
  const dates = await listReportDates();

  return (
    <div className="mx-auto max-w-prose px-4 py-10 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-sage-600">Market intelligence</p>
      <h1 className="font-serif-display mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
        Market Report Archive
      </h1>
      <p className="mt-2 max-w-xl text-ink-soft">
        Every daily edition of our skincare market intelligence — newest first.
      </p>

      {dates.length === 0 ? (
        <p className="mt-8 text-ink-soft">No reports published yet. Check back soon.</p>
      ) : (
        <ul className="mt-8 space-y-3">
          {dates.map((date, i) => (
            <li key={date}>
              <Link
                href={`/market-report/${date}`}
                className="glass group flex items-center justify-between gap-3 rounded-2xl px-5 py-4 transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-100 text-sage-700">
                    <CalendarDays className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="font-serif-display block font-bold">
                      K-Beauty Market Report — {date}
                    </span>
                    <span className="block text-xs font-semibold uppercase tracking-wider text-sage-600">
                      {i === 0 ? "Latest edition" : date}
                    </span>
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-sage-600 transition group-hover:translate-x-1" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/market-report"
        className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-sage-700 hover:underline"
      >
        Back to latest report <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
