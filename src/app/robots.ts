import type { MetadataRoute } from "next";
import { siteBaseUrl } from "@/lib/market-report";

export default function robots(): MetadataRoute.Robots {
  const base = siteBaseUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/beautynest-entry-2026-sable-heron-47"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
