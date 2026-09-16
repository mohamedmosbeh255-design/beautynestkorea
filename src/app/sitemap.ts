import type { MetadataRoute } from "next";
import { MOCK_PRODUCTS } from "@/lib/data/products";
import { getAllAdvice } from "@/lib/advice";
import { listReportDatesSync } from "@/lib/market-report";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://beautynestkorea.com";
  return [
    { url: `${base}/`, lastModified: new Date() },
    { url: `${base}/shop`, lastModified: new Date() },
    { url: `${base}/advice`, lastModified: new Date() },
    { url: `${base}/market-report`, lastModified: new Date() },
    { url: `${base}/market-report/archive`, lastModified: new Date() },
    ...listReportDatesSync().map((d) => ({ url: `${base}/market-report/${d}`, lastModified: new Date(d) })),
    ...MOCK_PRODUCTS.map((p) => ({ url: `${base}/product/${p.slug}`, lastModified: new Date() })),
    ...getAllAdvice().map((p) => ({ url: `${base}/advice/${p.slug}`, lastModified: new Date(p.date) })),
  ];
}
