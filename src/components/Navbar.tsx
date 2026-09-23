"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, ShoppingBag, BookOpen, Menu, Search, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import SearchBox from "@/components/SearchBox";

const links = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/advice", label: "Advice" },
  { href: "/market-report", label: "Market Report" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50">
      <div className="glass border-x-0 border-t-0">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-sage-400 to-sage-600 text-white shadow-lg shadow-sage-200">
              <Sparkles className="h-5 w-5" />
            </span>
            <span className="leading-tight">
              <span className="font-serif-display block text-lg font-bold tracking-tight">BeautyNestKorea</span>
              <span className="block text-[11px] uppercase tracking-[0.18em] text-ink-soft">K-Beauty • Curated</span>
            </span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition",
                  pathname === l.href ? "bg-sage-100 text-sage-800" : "text-ink-soft hover:bg-white/70 hover:text-ink"
                )}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/shop"
              className="ml-2 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-sage-700"
            >
              <ShoppingBag className="h-4 w-4" /> Shop bestsellers
            </Link>
            <SearchBox />
          </div>

          <button className="rounded-full p-2 hover:bg-white/70 md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link
            href="/search"
            className="rounded-full p-2.5 text-ink-soft transition hover:bg-white/70 hover:text-ink md:hidden"
            aria-label="Search products and articles"
          >
            <Search className="h-5 w-5" />
          </Link>
        </nav>
        {open && (
          <div className="border-t border-white/60 px-4 pb-4 pt-2 md:hidden">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-white/70"
              >
                {l.label === "Advice" ? <BookOpen className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
