import { cn } from "@/lib/utils";

export const AFFILIATE_DISCLOSURE_TEXT =
  "We may earn a commission from links on this page — at no extra cost to you.";

/** One-line commission notice placed immediately above buy buttons / monetised content. */
export default function AffiliateDisclosure({ className }: { className?: string }) {
  return (
    <p className={cn("mb-3 text-xs leading-relaxed text-ink-soft", className)}>
      {AFFILIATE_DISCLOSURE_TEXT}
    </p>
  );
}
