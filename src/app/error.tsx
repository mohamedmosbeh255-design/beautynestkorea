"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Home, LifeBuoy, RotateCcw } from "lucide-react";

/**
 * Root error boundary (App Router).
 * Renders INSIDE the root layout, so the announcement bar, navbar and footer
 * stay on screen — a failure here never strips the site down to a white page.
 * No metadata export is possible in a client component: this route is a 500
 * and must never be indexed, which Next handles automatically.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaces in Vercel Runtime Logs with the digest that support can trace.
    console.error("[app-error]", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="relative overflow-hidden rounded-[2rem] bg-ink px-6 py-14 text-center text-white shadow-2xl sm:px-12 sm:py-16">
        {/* Sage glow — decorative only, never affects layout or CLS. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-sage-500/25 blur-3xl"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-blush-500/15 blur-3xl"
        />

        <span className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-3xl border border-white/15 bg-white/10 text-sage-200">
          <LifeBuoy className="h-7 w-7" />
        </span>

        <p className="relative mt-6 text-xs font-bold uppercase tracking-[0.2em] text-sage-300">
          Something slipped
        </p>
        <h1 className="font-serif-display relative mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          This page needs a moment
        </h1>
        <p className="relative mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/70">
          We hit a temporary glitch while loading this page. Your skincare
          shelf is untouched — try again, or head somewhere useful.
        </p>

        <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-sage-400 px-6 py-3 text-sm font-bold text-ink transition hover:bg-sage-300 sm:w-auto"
          >
            <RotateCcw className="h-4 w-4" /> Try again
          </button>
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10 sm:w-auto"
          >
            <Home className="h-4 w-4" /> Back home
          </Link>
        </div>

        {error.digest ? (
          <p className="relative mt-8 text-[11px] uppercase tracking-wider text-white/35">
            Reference: {error.digest}
          </p>
        ) : null}
      </div>
    </div>
  );
}
