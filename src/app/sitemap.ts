import type { MetadataRoute } from "next";
import { MOCK_PRODUCTS } from "@/lib/data/products";
import { getAllAdvice } from "@/lib/advice";
import { getConcernSlugs } from "@/lib/advice-kb";
import { listReportDatesSync, siteBaseUrl } from "@/lib/market-report";
import { RETIRED_PRODUCT_SLUGS } from "@/lib/retired-slugs";

interface LiveProductRow {
  slug: string | null;
  updated_at?: string | null;
  created_at?: string | null;
}

/** Live product slugs from Supabase. Falls back to mocks (minus retired) when unconfigured. */
async function getLiveProductRows(): Promise<LiveProductRow[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && anon) {
    try {
      const res = await fetch(
        `${url}/rest/v1/products?select=slug,updated_at,created_at&is_active=eq.true&slug=not.is.null`,
        { headers: { apikey: anon, Authorization: `Bearer ${anon}` }, next: { revalidate: 3600 } }
      );
      if (res.ok) {
        const rows = (await res.json()) as LiveProductRow[];
        return rows.filter((r) => r.slug && !RETIRED_PRODUCT_SLUGS.has(r.slug as string));
      }
    } catch {
      // fall through to mocks
    }
  }
  return MOCK_PRODUCTS.filter((p) => !RETIRED_PRODUCT_SLUGS.has(p.slug)).map((p) => ({
    slug: p.slug,
    updated_at: p.updated_at ?? null,
    created_at: null,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteBaseUrl();
  const [products, advice, reportDates, concernSlugs] = await Promise.all([
    getLiveProductRows(),
    Promise.resolve(getAllAdvice()),
    Promise.resolve(listReportDatesSync()),
    Promise.resolve(getConcernSlugs()),
  ]);

  return [
    { url: `${base}/`, lastModified: new Date() },
    { url: `${base}/shop`, lastModified: new Date() },
    { url: `${base}/advice`, lastModified: new Date() },
    { url: `${base}/market-report`, lastModified: new Date() },
    { url: `${base}/market-report/archive`, lastModified: new Date() },
    { url: `${base}/tools/image-optimizer`, lastModified: new Date() },
    { url: `${base}/about`, lastModified: new Date() },
    { url: `${base}/contact`, lastModified: new Date() },
    { url: `${base}/privacy`, lastModified: new Date() },
    { url: `${base}/disclosure`, lastModified: new Date() },
    { url: `${base}/affiliate-disclosure`, lastModified: new Date() },
    { url: `${base}/author`, lastModified: new Date() },
    ...reportDates.map((d) => ({ url: `${base}/market-report/${d}`, lastModified: new Date(d) })),
    ...products
      .filter((p): p is LiveProductRow & { slug: string } => Boolean(p.slug))
      .map((p) => ({
        url: `${base}/product/${p.slug}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : p.created_at ? new Date(p.created_at) : new Date(),
      })),
    ...advice.map((p) => ({ url: `${base}/advice/${p.slug}`, lastModified: new Date(p.date) })),
    ...concernSlugs.map((slug) => ({ url: `${base}/advice/${slug}`, lastModified: new Date() })),
  ];
}
