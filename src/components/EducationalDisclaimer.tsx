import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

/** Shared educational disclaimer for every advice page (hub, concerns, articles). */
export default function EducationalDisclaimer({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "flex items-start gap-2 rounded-2xl border border-sage-100 bg-sage-50 px-4 py-3 text-xs leading-relaxed text-sage-800",
        className
      )}
    >
      <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-sage-600" />
      <span>
        Educational only — cosmetic guidance and product curation, not medical
        advice. Patch-test new products and see a dermatologist for persistent issues.
      </span>
    </p>
  );
}
