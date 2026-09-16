import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, SearchX } from "lucide-react";
import { siteBaseUrl } from "@/lib/market-report";

export const metadata: Metadata = {
  title: "Page Not Found — Let's Get You Back to Glowing Skin",
  description: "This page doesn't exist, but great skincare does. Browse bestsellers, guides and our daily market report.",
  alternates: { canonical: siteBaseUrl() },
};

const links = [
  { href: "/", label: "Home", desc: "Start fresh" },
  { href: "/shop", label: "Shop bestsellers", desc: "Curated K-beauty picks" },
  { href: "/advice", label: "Skincare advice", desc: "Routines & guides" },
  { href: "/market-report", label: "Market report", desc: "Daily trends" },
  { href: "/market-report/archive", label: "Report archive", desc: "Every edition" },
  { href: "/contact", label: "Contact us", desc: "Ask anything" },
];

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-sage-100 text-sage-700">
        <SearchX className="h-7 w-7" />
      </span>
      <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-sage-600">404 — Lost in the routine</p>
      <h1 className="font-serif-display mt-2 text-3xl font-bold tracking-tight sm:text-5xl">
        This Page Got Rinsed Off
      </h1>
      <p className="mx-auto mt-3 max-w-md text-ink-soft">
        The link you followed doesn&apos;t exist (anymore). Here are six good places to glow next:
      </p>
      <ul className="mt-8 grid gap-3 text-left sm:grid-cols-2">
        {links.map(({ href, label, desc }) => (
          <li key={href}>
            <Link
              href={href}
              className="glass group flex items-center justify-between gap-3 rounded-2xl px-5 py-4 transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              <span>
                <span className="font-serif-display block font-bold">{label}</span>
                <span className="block text-xs text-ink-soft">{desc}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-sage-600 transition group-hover:translate-x-1" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
