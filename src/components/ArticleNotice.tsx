import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Single merged disclosure box for article templates: affiliate + educational
 * in one compact notice. Article bodies no longer repeat their own copy.
 */
export default function ArticleNotice({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        "flex items-start gap-2.5 rounded-2xl border border-sage-100 bg-sage-50/80 px-4 py-3 text-xs leading-relaxed text-sage-800",
        className
      )}
    >
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sage-600" />
      <span>
        Our picks are cosmetic product recommendations, not medical prescriptions.
        Some links are affiliate links — we may earn a commission at no extra cost to you.
        Educational only: patch-test new products and see a dermatologist for persistent issues.
      </span>
    </aside>
  );
}
