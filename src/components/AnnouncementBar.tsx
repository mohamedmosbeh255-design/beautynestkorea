"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { X } from "lucide-react";

// Dismissal is persisted in localStorage and applied before first paint by the
// inline script in src/app/layout.tsx (html[data-announcement="dismissed"]).
// That keeps returning visitors from seeing a banner flash / layout shift.
export const ANNOUNCEMENT_STORAGE_KEY = "bnk-announcement-dismissed";

const ANNOUNCEMENT = {
  text: "🔥 Black Friday Deals Live: Up to 40% OFF on Top K-Beauty & High-Tech Devices!",
  cta: "Shop Deals →",
  href: "/shop",
};

export default function AnnouncementBar() {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);

  // Never render inside the admin panel (root layout wraps it too).
  if (pathname?.startsWith("/admin")) return null;
  if (hidden) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(ANNOUNCEMENT_STORAGE_KEY, "1");
    } catch {
      // Storage blocked (private mode) — still hide for this page view.
    }
    document.documentElement.setAttribute("data-announcement", "dismissed");
    setHidden(true);
  };

  return (
    <div
      id="announcement-bar"
      role="region"
      aria-label="Announcement"
      className="relative bg-ink text-white"
    >
      <p className="mx-auto max-w-7xl px-11 py-2.5 text-center text-xs font-medium leading-snug sm:px-12 sm:text-sm">
        <span>{ANNOUNCEMENT.text}</span>{" "}
        <Link
          href={ANNOUNCEMENT.href}
          className="whitespace-nowrap font-bold underline decoration-white/40 underline-offset-2 transition hover:decoration-white"
        >
          {ANNOUNCEMENT.cta}
        </Link>
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss announcement"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-white/80 transition hover:bg-white/10 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
