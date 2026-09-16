import { Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Short health caveat extending the article medical disclaimer to pages
 * without one (shop, product, market-report). Educational content only —
 * never a diagnosis or treatment plan.
 */
export default function MedicalCaveat({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900",
        className
      )}
    >
      <Stethoscope className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
      <span>
        Our guides and picks are for education only — not medical advice, diagnosis, or treatment.
        Skin varies person to person: patch-test new products and see a dermatologist for
        persistent or concerning issues.
      </span>
    </p>
  );
}
