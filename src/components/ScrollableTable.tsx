"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Overflow wrapper for wide report tables. The "scroll →" hint and the
 * right-edge fade render ONLY while the table actually overflows its
 * container (measured live, updated on scroll + resize), so short tables
 * never show chrome they don't need.
 *
 * Layout: tables live inside the shared --report-measure column, so this
 * wrapper never breaks out — overflow-x-auto stays purely as a safety net
 * for any future table wider than the measure.
 */
export default function ScrollableTable({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);
  const [atEnd, setAtEnd] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      setOverflowing(el.scrollWidth > el.clientWidth + 1);
      setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 8);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const showHint = overflowing && !atEnd;

  return (
    <div className={cn("relative -mx-4 px-4 sm:mx-0 sm:px-0", className)}>
      <div ref={ref} className="overflow-x-auto" data-testid="table-scroll">
        {/* No <table> element here on purpose: the child IS the table (see
            ResponsiveTable). A wrapper <table> around it nested two tables,
            and the outer one's min-width forced a 560px overflow on phones
            that no card CSS could undo. */}
        <div className="overflow-hidden rounded-2xl border border-sage-100">
          {children}
        </div>
      </div>
      {showHint && (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-cream via-cream/60 to-transparent sm:right-0"
          />
          <span className="absolute bottom-2 right-5 rounded-full bg-ink/70 px-2 py-0.5 text-[11px] font-semibold text-white">
            scroll →
          </span>
        </>
      )}
    </div>
  );
}
