"use client";

import { useState, type ReactNode } from "react";

/**
 * Clamped report title/headline cell with progressive disclosure.
 * Long titles render as two lines (see `.clamp-2` in globals.css) with a
 * native tooltip carrying the full text; "Read more" expands inline for
 * touch users who can't hover. Short titles render plainly — no chrome.
 */
export default function ReportTitleToggle({ text, children }: { text: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const long = text.length > 90;
  return (
    <span className="report-title-toggle" title={open || !text ? undefined : text}>
      <span className={open ? undefined : "clamp-2"}>{children}</span>
      {long ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-sage-700 underline decoration-sage-300 underline-offset-2 transition hover:text-sage-600"
        >
          {open ? "Show less" : "Read more"}
        </button>
      ) : null}
    </span>
  );
}
