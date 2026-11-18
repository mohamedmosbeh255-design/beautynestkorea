"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, ShoppingBag, BookOpen, Menu, Search, X, ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import SearchBox from "@/components/SearchBox";

const links = [
  { href: "/", label: "Home" },
  { href: "/best-picks", label: "Best Picks" },
  { href: "/shop", label: "Shop" },
  { href: "/advice", label: "Advice" },
  { href: "/market-report", label: "Market Report" },
];

// Sub-links for the "Shop" dropdown. The Shop link itself still points at
// /shop — nothing existing moves or changes URL.
const shopMenu = [
  { href: "/shop", label: "All products" },
  { href: "/category/global-skincare", label: "Global Skincare" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50">
      {/* Solid page-matching background (not translucent glass): tags, prices
          and buttons must never show through while scrolling. z-50 already
          tops all page content; only the admin modal shares it (never on
          storefront pages at the same time). */}
      <div className="border-b border-sage-100 bg-cream shadow-[0_1px_12px_rgba(43,43,46,0.06)]">
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
            {links.map((l) =>
              l.href === "/shop" ? (
                <div key={l.href} className="group relative">
                  <Link
                    href={l.href}
                    className={cn(
                      "flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium transition",
                      pathname === l.href ? "bg-sage-100 text-sage-800" : "text-ink-soft hover:bg-white/70 hover:text-ink"
                    )}
                  >
                    {l.label}
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Link>
                  <div className="invisible absolute left-0 top-full z-50 pt-2 opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                    <div className="min-w-[220px] rounded-2xl border border-sage-100 bg-cream p-2 shadow-xl">
                      {shopMenu.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="block whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium text-ink-soft transition hover:bg-sage-50 hover:text-ink"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
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
              )
            )}
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
              <div key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-white/70"
                >
                  {l.label === "Advice" ? <BookOpen className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
                  {l.label}
                </Link>
                {l.href === "/shop" && (
                  <div className="ml-7 border-l border-sage-100 pl-3">
                    {shopMenu.slice(1).map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="block rounded-xl px-3 py-2 text-sm font-medium text-ink-soft hover:bg-white/70"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
