import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Bot, CalendarDays } from "lucide-react";
import MarketReportBody from "@/components/MarketReportBody";
import MedicalCaveat from "@/components/MedicalCaveat";
import { getReportByDate, getReportSnapshot, listReportDates, siteBaseUrl } from "@/lib/market-report";

export const revalidate = 3600;

export async function generateStaticParams() {
  const dates = await listReportDates();
  return dates.map((date) => ({ date }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ date: string }>;
}): Promise<Metadata> {
  const { date } = await params;
  const base = siteBaseUrl();
  const title = `K-Beauty Market Report — ${date}`;
  const description = `Daily skincare market intelligence for ${date}: trending ingredients, Reddit community pulse, social signals and competitor watchlist. Updated daily by our market intelligence bot.`;
  const url = `${base}/market-report/${date}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "article", images: [{ url: `${base}/og-default.png`, width: 1200, height: 630, alt: "BeautyNestKorea — curated K-beauty & skincare" }], publishedTime: `${date}T06:00:00Z` },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function DatedMarketReportPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const base = siteBaseUrl();
  const report = await getReportByDate(date);
  if (!report) notFound();
  const snapshot = await getReportSnapshot(report.date);

  const url = `${base}/market-report/${date}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: `K-Beauty Market Report — ${report.date}`,
      description: `Daily skincare market intelligence for ${report.date}.`,
      datePublished: `${report.date}T06:00:00Z`,
      author: { "@type": "Organization", name: "BeautyNestKorea Market Intelligence Bot" },
      publisher: { "@type": "Organization", name: "BeautyNestKorea" },
      mainEntityOfPage: url,
    },
    {
      "@context": "https://schema.org",
      "@type": "Dataset",
      name: `Skincare Market Intelligence Dataset — ${report.date}`,
      description: `Daily aggregated skincare market signals (trends, community, social, watchlist) for ${report.date}.`,
      temporalCoverage: report.date,
      creator: { "@type": "Organization", name: "BeautyNestKorea" },
      url,
    },
  ];

  return (
    <article className="report-article mx-auto w-full max-w-[1216px] px-4 py-10 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="flex items-center justify-between">
        <Link
          href="/market-report"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-sage-700 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Latest report
        </Link>
        <Link
          href="/market-report/archive"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-sage-700 hover:underline"
        >
          Archive <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-sage-600">Market intelligence</p>
      <h1 className="font-serif-display mt-2 text-2xl font-bold leading-tight tracking-tight sm:text-4xl">
        K-Beauty Market Report — {report.date}
      </h1>

      <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sage-100 px-3 py-1.5 font-semibold text-sage-800">
          <CalendarDays className="h-4 w-4" /> {report.date}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blush-100 px-3 py-1.5 font-semibold text-blush-600">
          <Bot className="h-4 w-4" /> Updated daily by our market intelligence bot
        </span>
      </div>

      <MedicalCaveat className="mt-5" />

      <div className="mt-8">
        <MarketReportBody markdown={report.markdown} reportDate={report.date} ingredientSnapshot={snapshot} />
      </div>
    </article>
  );
}
