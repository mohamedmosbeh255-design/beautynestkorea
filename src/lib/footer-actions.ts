"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  DEFAULT_FOOTER,
  FOOTER_CACHE_TAG,
  FOOTER_SETTINGS_KEY,
  isAllowedFooterHref,
  sanitizeFooterData,
  type FooterData,
} from "@/lib/footer";

async function requireAdmin() {
  const supabase = await createServerSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: admin } = await supabase.from("admin_users").select("id").eq("id", user.id).single();
  if (!admin) throw new Error("Not authorized — admin only");
  return supabase;
}

const linkSchema = z.object({
  label: z.string().trim().min(1, "Label required").max(60),
  href: z.string().trim().min(1, "URL required").max(500),
});

const footerSchema = z.object({
  tagline: z.string().trim().min(1).max(500),
  disclosure: z.string().trim().min(1).max(500),
  shop: z.array(linkSchema).min(1, "Shop needs at least 1 link").max(8),
  learn: z.array(linkSchema).min(1, "Learn needs at least 1 link").max(8),
  company: z.array(linkSchema).min(1, "Company needs at least 1 link").max(8),
  socials: z.array(linkSchema).min(1, "Socials needs at least 1 link").max(12),
});

function parseColumn(formData: FormData, name: "shop" | "learn" | "company" | "socials") {
  const raw = String(formData.get(name) ?? "[]");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Invalid ${name} data — please reload and try again`);
  }
  if (!Array.isArray(parsed)) throw new Error(`Invalid ${name} data`);
  return parsed;
}

/**
 * Save footer settings (Admin only). Enforces the allowlist so internal
 * columns can never leak external URLs, then purges the 24h footer cache
 * so the edit is live site-wide within seconds.
 */
export async function saveFooterSettings(formData: FormData) {
  const supabase = await requireAdmin();
  const candidate = {
    tagline: String(formData.get("tagline") ?? ""),
    disclosure: String(formData.get("disclosure") ?? ""),
    shop: parseColumn(formData, "shop"),
    learn: parseColumn(formData, "learn"),
    company: parseColumn(formData, "company"),
    socials: parseColumn(formData, "socials"),
  };
  const parsed = footerSchema.safeParse(candidate);
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }
  // SEO allowlist enforcement (server-side, cannot be bypassed via devtools).
  const columns = ["shop", "learn", "company", "socials"] as const;
  for (const col of columns) {
    for (const link of parsed.data[col]) {
      if (!isAllowedFooterHref(link.href, col)) {
        throw new Error(
          col === "socials"
            ? `Socials: "${link.label}" must be https:// or mailto: (got "${link.href}")`
            : `${col}: "${link.label}" must be an internal link starting with / (got "${link.href}"). External URLs are not allowed here — they leak link equity.`
        );
      }
    }
  }
  const clean = sanitizeFooterData(parsed.data) ?? parsed.data;
  const { error } = await supabase
    .from("site_settings")
    .upsert({ key: FOOTER_SETTINGS_KEY, value: clean as unknown as Record<string, unknown> }, { onConflict: "key" });
  if (error) throw new Error(error.message);

  // Immediate site-wide update: purge footer tag + root layout cache.
  // (Next 16 revalidateTag requires a cache-life profile second arg.)
  revalidateTag(FOOTER_CACHE_TAG, "max");
  revalidatePath("/", "layout");
  redirect("/admin/settings/footer?saved=1");
}

/** One-click rollback to the frozen SEO baseline (today's hardcoded footer). */
export async function resetFooterSettings() {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("site_settings")
    .upsert(
      { key: FOOTER_SETTINGS_KEY, value: DEFAULT_FOOTER as unknown as Record<string, unknown> },
      { onConflict: "key" }
    );
  if (error) throw new Error(error.message);
  revalidateTag(FOOTER_CACHE_TAG, "max");
  revalidatePath("/", "layout");
  redirect("/admin/settings/footer?saved=1");
}

/** Admin-only read of the live DB row (force-dynamic admin, session client OK here). */
export async function getFooterSettingsAdmin(): Promise<FooterData> {
  try {
    const supabase = await createServerSupabase();
    if (!supabase) return DEFAULT_FOOTER;
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", FOOTER_SETTINGS_KEY)
      .single();
    if (error || !data?.value) return DEFAULT_FOOTER;
    return sanitizeFooterData(data.value) ?? DEFAULT_FOOTER;
  } catch {
    return DEFAULT_FOOTER;
  }
}
