import Link from "next/link";
import { ChevronRight } from "lucide-react";

/**
 * Visible breadcrumb trail (B4). Pure navigation over existing routes —
 * schema counterparts already ship as JSON-LD on these pages.
 */
export default function Breadcrumbs({ trail }: { trail: Array<{ label: string; href?: string }> }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <ol className="flex flex-wrap items-center gap-1 text-ink-soft">
        {trail.map((item, i) => {
          const last = i === trail.length - 1;
          return (
            <li key={item.label} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-ink-soft/60" aria-hidden="true" />}
              {item.href && !last ? (
                <Link href={item.href} className="font-medium text-sage-700 hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className={last ? "font-semibold text-ink" : ""}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
