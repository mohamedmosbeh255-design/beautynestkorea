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
  const track = async (source: "amazon" | "oliveyoung", url: string) => {
    try {
      await fetch("/api/track-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, source }),
      });
    } catch {
      // ignore
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {amazonUrl ? (
        <button
          onClick={() => track("amazon", amazonUrl)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#FF9900] px-6 py-4 text-sm font-bold text-black shadow-lg shadow-orange-200 transition hover:brightness-95"
          aria-label={`Buy ${title} on Amazon`}
        >
          <ShoppingCart className="h-5 w-5" /> Buy on Amazon <ExternalLink className="h-4 w-4" />
        </button>
      ) : (
        <div className="rounded-2xl bg-gray-100 px-6 py-4 text-center text-sm text-gray-500">Not on Amazon</div>
      )}
      {oliveyoungUrl ? (
        <button
          onClick={() => track("oliveyoung", oliveyoungUrl)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sage-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-sage-200 transition hover:bg-sage-700"
          aria-label={`Buy ${title} on Olive Young`}
        >
          <ShoppingCart className="h-5 w-5" /> Buy on Olive Young <ExternalLink className="h-4 w-4" />
        </button>
      ) : (
        <div className="rounded-2xl bg-gray-100 px-6 py-4 text-center text-sm text-gray-500">Not on Olive Young</div>
      )}
    </div>
  );
}
