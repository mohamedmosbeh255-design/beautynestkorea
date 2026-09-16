import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Bot, CalendarDays } from "lucide-react";
import MarketReportBody from "@/components/MarketReportBody";
import { getLatestReport, listReportDates, siteBaseUrl } from "@/lib/market-report";

export const revalidate = 3600;

// Evergreen hub SEO (no date): dated editions live at /market-report/[date].
const HUB_TITLE = "K-Beauty Market Report: Daily Skincare Trends & Ingredient Movers";
const HUB_DESCRIPTION =
  "Daily K-beauty market intelligence: trending skincare ingredients, community buzz, social signals and price watchlists — refreshed every morning by our market intelligence bot.";

export async function generateMetadata(): Promise<Metadata> {
  const base = siteBaseUrl();
  const latest = await getLatestReport();
  const url = `${base}/market-report`;
  return {
    title: HUB_TITLE,
    description: HUB_DESCRIPTION,
    alternates: { canonical: url },
    openGraph: {
      title: HUB_TITLE,
      description: HUB_DESCRIPTION,
      url,
      type: "article",
      publishedTime: latest ? `${latest.date}T06:00:00Z` : undefined,
    },
    twitter: { card: "summary_large_image", title: HUB_TITLE, description: HUB_DESCRIPTION },
  };
}

function jsonLd(base: string, date: string) {
  const url = `${base}/market-report`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: HUB_TITLE,
      description: HUB_DESCRIPTION,
      datePublished: `${date}T06:00:00Z`,
      author: { "@type": "Organization", name: "BeautyNestKorea Market Intelligence Bot" },
      publisher: { "@type": "Organization", name: "BeautyNestKorea" },
      mainEntityOfPage: url,
    },
    {
      "@context": "https://schema.org",
      "@type": "Dataset",
      name: `Skincare Market Intelligence Dataset — ${date}`,
      description: `Daily aggregated skincare market signals (trends, community, social, watchlist) for ${date}.`,
      temporalCoverage: date,
      creator: { "@type": "Organization", name: "BeautyNestKorea" },
      url,
    },
  ];
}

export default async function MarketReportPage() {
  const base = siteBaseUrl();
  const [report, dates] = await Promise.all([getLatestReport(), listReportDates()]);

  if (!report) {
    return (
      <div className="mx-auto max-w-prose px-4 py-16 sm:px-6">
        <h1 className="font-serif-display text-3xl font-bold tracking-tight">Market Report</h1>
        <p className="mt-4 text-ink-soft">No market report is available yet. Check back soon.</p>
      </div>
    );
  }

  const { title, description } = { title: HUB_TITLE, description: HUB_DESCRIPTION };

  return (
    <article className="mx-auto max-w-prose px-4 py-10 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(base, report.date)) }}
      />
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-sage-600">Market intelligence</p>
      <h1 className="font-serif-display mt-2 text-2xl font-bold leading-tight tracking-tight sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 text-base text-ink-soft sm:text-lg">{description}</p>
      <p className="mt-2 text-sm font-medium text-ink-soft">
        Showing the latest edition below ({report.date}) — new reports publish daily at 06:00 UTC.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sage-100 px-3 py-1.5 font-semibold text-sage-800">
          <CalendarDays className="h-4 w-4" /> {report.date}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blush-100 px-3 py-1.5 font-semibold text-blush-600">
          <Bot className="h-4 w-4" /> Updated daily by our market intelligence bot
        </span>
      </div>

      <div className="mt-8">
        <MarketReportBody markdown={report.markdown} />
      </div>

      <div className="glass mt-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-5">
        <p className="text-sm text-ink-soft">
          {dates.length > 1
            ? `${dates.length} reports published — browse every edition.`
            : "New editions publish daily at 06:00 UTC."}
        </p>
        <Link
          href="/market-report/archive"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-sage-700 hover:underline"
        >
          View archive <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
