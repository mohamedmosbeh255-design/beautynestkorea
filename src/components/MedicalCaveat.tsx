import { Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Short cosmetic-curation notice extending the article disclaimer to pages
 * without one (shop, product, market-report). Educational content only —
 * product reviews and curation, never medical advice.
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
        Our guides and picks are cosmetic curation for education only — not
        medical advice. Skin varies person to person: patch-test new products
        and see a dermatologist for persistent or concerning issues.
      </span>
    </p>
  );
}
