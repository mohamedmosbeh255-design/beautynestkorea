"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

/**
 * Navbar search (B4): expanding input on desktop that routes to /search?q=.
 * WHY a separate /search page instead of inline results: one static index
 * page keeps the navbar light and keyboard-friendly, and results span
 * products + advice through the existing card components. No analytics, no
 * affiliate logic — pure navigation.
 */
export default function SearchBox() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const router = useRouter();

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = value.trim();
    if (!q) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search products and articles"
        className="rounded-full p-2.5 text-ink-soft transition hover:bg-white/70 hover:text-ink"
      >
        <Search className="h-[18px] w-[18px]" />
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      role="search"
      className="flex items-center gap-1 rounded-full bg-white/80 py-1 pl-3 pr-1 shadow-sm"
    >
      <Search className="h-4 w-4 shrink-0 text-ink-soft" aria-hidden="true" />
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder="Search products, guides…"
        aria-label="Search products and articles"
        className="w-44 bg-transparent text-sm outline-none placeholder:text-ink-soft/70 lg:w-52"
      />
      <button
        type="button"
        onClick={() => {
          setValue("");
          setOpen(false);
        }}
        aria-label="Close search"
        className="rounded-full p-1.5 text-ink-soft transition hover:bg-sage-100 hover:text-ink"
      >
        <X className="h-4 w-4" />
      </button>
    </form>
  );
}
