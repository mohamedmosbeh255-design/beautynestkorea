import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number | null | undefined, currency = "$") {
  if (price == null) return "—";
  return `${currency}${price.toFixed(2)}`;
}

/**
 * Price provenance stamp: "September 2026" from a product's VERIFIED
 * price-checked timestamp. Returns null when no usable date exists —
 * callers must then HIDE the price block entirely rather than show an
 * undated price as current (affiliate accuracy: never show an unknown date).
 */
export function formatPriceChecked(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
