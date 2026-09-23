import type { ReactNode } from "react";

/**
 * Universal scroll container for markdown tables in article bodies.
 *
 * ONE shared renderer used by every article route (advice + articles, present
 * + future) so all markdown tables scroll horizontally on mobile, safely and
 * consistently — no per-page table code, no CSS !important hacks.
 *
 * Structure (single scroll container, never nested overflow):
 *   outer div  — full-bleed on mobile (-mx-4 px-4), contained on desktop,
 *                owns the horizontal scroll + iOS touch momentum.
 *   table      — min-width forces overflow on phones (<560px viewports);
 *                w-full keeps it clean on desktop. Cells don't wrap so
 *                columns swipe instead of squashing.
 *
 * Scope safety: this component is only referenced from article markdown
 * renderers. Admin panels, dashboards, product spec tables, and market-report
 * tables (`.report-table` stacked cards) never import it and are unaffected.
 * A soft, non-!important `.prose-beauty table` fallback lives in globals.css
 * for raw-HTML tables; component classes always win over it.
 */
export default function ArticleTable({ children }: { children?: ReactNode }) {
  return (
    <div
      className="w-full overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-2 touch-pan-x"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <table
        className="article-table w-full whitespace-nowrap rounded-2xl border border-sage-100 border-collapse text-sm"
        style={{ minWidth: "max(100%, 560px)" }}
      >
        {children}
      </table>
    </div>
  );
}

export function ArticleTableHead({ children }: { children?: ReactNode }) {
  return <thead className="bg-sage-50">{children}</thead>;
}

export function ArticleTableHeader({ children }: { children?: ReactNode }) {
  return (
    <th className="border-b border-sage-100 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-sage-700">
      {children}
    </th>
  );
}

export function ArticleTableCell({ children }: { children?: ReactNode }) {
  return (
    <td className="border-b border-sage-50 px-4 py-3 align-top text-ink-soft last:border-b-0">
      {children}
    </td>
  );
}
