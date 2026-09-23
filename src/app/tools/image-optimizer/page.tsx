import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ImageOptimizerClient from "@/components/ImageOptimizerClient";
import { siteBaseUrl } from "@/lib/market-report";

const TITLE = "Image Optimizer — Resize & Compress for the Web";
const DESCRIPTION =
  "Free in-browser image optimizer: resize, compress to JPEG/WebP/PNG and download — nothing is uploaded, everything runs on your device.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${siteBaseUrl()}/tools/image-optimizer` },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website" },
};

/**
 * Builds the /tools/image-optimizer URL the sitemap already advertises.
 * Purely additive authoring utility — no products, articles, routes, or
 * affiliate links are touched by this page.
 */
export default function ImageOptimizerPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-sage-700 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Home
      </Link>
      <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-sage-600">Free tool</p>
      <h1 className="font-serif-display mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Image optimizer</h1>
      <p className="mt-3 max-w-2xl text-base text-ink-soft">
        Shrink images before upload: pick a max width, tune quality, export WebP/JPEG/PNG.
        For delivery, the site already serves responsive AVIF/WebP via next/image.
      </p>
      <div className="mt-8">
        <ImageOptimizerClient />
      </div>
    </div>
  );
}
