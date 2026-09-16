"use client";

import { ExternalLink, ShoppingCart } from "lucide-react";

export default function AffiliateButtons({
  productId,
  amazonUrl,
  oliveyoungUrl,
  title,
}: {
  productId: string;
  amazonUrl?: string | null;
  oliveyoungUrl?: string | null;
  title: string;
}) {
  const track = (source: "amazon" | "oliveyoung") => {
    try {
      fetch("/api/track-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, source }),
      }).catch(() => {
        // ignore
      });
    } catch {
      // ignore
    }
  };

  if (!amazonUrl && !oliveyoungUrl) return null;

  const both = Boolean(amazonUrl && oliveyoungUrl);

  return (
    <div className={both ? "grid gap-3 sm:grid-cols-2" : "grid gap-3 grid-cols-1"}>
      {amazonUrl ? (
        <a
          href={amazonUrl}
          target="_blank"
          rel="nofollow sponsored noopener"
          onClick={() => track("amazon")}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#FF9900] px-6 py-4 text-sm font-bold text-black shadow-lg shadow-orange-200 transition hover:brightness-95"
          aria-label={`View ${title} on Amazon`}
        >
          <ShoppingCart className="h-5 w-5" /> View on Amazon <ExternalLink className="h-4 w-4" />
        </a>
      ) : null}
      {oliveyoungUrl ? (
        <a
          href={oliveyoungUrl}
          target="_blank"
          rel="sponsored noopener noreferrer"
          onClick={() => track("oliveyoung")}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-sage-600 bg-sage-50 px-6 py-4 text-sm font-bold text-sage-700 transition hover:bg-sage-100"
          aria-label={`View ${title} on Olive Young`}
        >
          <ShoppingCart className="h-5 w-5" /> View on Olive Young <ExternalLink className="h-4 w-4" />
        </a>
      ) : null}
    </div>
  );
}
