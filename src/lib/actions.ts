"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { productSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import {
  findDuplicates,
  describeMatches,
  type DuplicateMatch,
  type DuplicateCandidate,
} from "@/lib/duplicates";

async function requireAdmin() {
  const supabase = await createServerSupabase();
  if (!supabase) throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: admin } = await supabase.from("admin_users").select("id").eq("id", user.id).single();
  if (!admin) throw new Error("Not authorized — admin only");
  return supabase;
}

export interface DuplicateCheckInput {
  title?: string | null;
  slug?: string | null;
  amazon_url?: string | null;
  amazon_asin?: string | null;
  oliveyoung_url?: string | null;
  /** Exclude this product id (edit mode) so a product never flags itself. */
  excludeId?: string | null;
}

/** Fetch minimal candidate rows for duplicate comparison. */
async function fetchDuplicateCandidates(
  supabase: NonNullable<Awaited<ReturnType<typeof createServerSupabase>>>,
  excludeId?: string | null
): Promise<DuplicateCandidate[]> {
  let query = supabase
    .from("products")
    .select("id, slug, title, brand, amazon_url, amazon_asin, oliveyoung_url");
  if (excludeId) query = query.neq("id", excludeId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as DuplicateCandidate[];
}

function toDuplicateError(matches: DuplicateMatch[]): Error {
  const summary = describeMatches(matches);
  const payload = matches.map((m) => ({
    id: m.product.id,
    slug: m.product.slug,
    title: m.product.title,
    reasons: m.reasons,
    similarity: m.similarity,
  }));
  // Structured prefix lets the client form recover the matches and render
  // the warning modal even when the server action is the enforcement point.
  return new Error(`DUPLICATE_PRODUCT: ${summary} :: ${JSON.stringify(payload)}`);
}

async function assertNoDuplicates(
  supabase: NonNullable<Awaited<ReturnType<typeof createServerSupabase>>>,
  input: DuplicateCheckInput
): Promise<void> {
  const candidates = await fetchDuplicateCandidates(supabase, input.excludeId ?? null);
  const matches = findDuplicates(input, candidates);
  if (matches.length > 0) throw toDuplicateError(matches);
}

/**
 * Client pre-save check (called from ProductForm before submitting).
 * Returns matches WITHOUT blocking — the form renders the warning modal.
 * Empty input (no title/urls/asin) returns [] to avoid noise on empty forms.
 */
export async function checkDuplicates(input: DuplicateCheckInput): Promise<DuplicateMatch[]> {
  const supabase = await requireAdmin();
  if (
    !String(input.title ?? "").trim() &&
    !String(input.slug ?? "").trim() &&
    !String(input.amazon_url ?? "").trim() &&
    !String(input.amazon_asin ?? "").trim() &&
    !String(input.oliveyoung_url ?? "").trim()
  ) {
    return [];
  }
  const candidates = await fetchDuplicateCandidates(supabase, input.excludeId ?? null);
  return findDuplicates(input, candidates);
}

export async function createProduct(formData: FormData) {
  const supabase = await requireAdmin();
  const raw = {
    title: formData.get("title"),
    slug: (formData.get("slug") as string) || slugify(String(formData.get("title") ?? "")),
    brand: formData.get("brand"),
    description: formData.get("description"),
    price: formData.get("price"),
    compare_at_price: formData.get("compare_at_price") || null,
    category: formData.get("category"),
    concern: formData.getAll("concern"),
    skin_type: formData.getAll("skin_type"),
    key_ingredients: String(formData.get("key_ingredients") ?? "").split(",").map((s) => s.trim()).filter(Boolean),
    image_urls: String(formData.get("image_urls") ?? "").split("\n").map((s) => s.trim()).filter(Boolean),
    amazon_url: formData.get("amazon_url") || null,
    amazon_asin: formData.get("amazon_asin") || null,
    oliveyoung_url: formData.get("oliveyoung_url") || null,
    rating: formData.get("rating") || null,
    review_count: formData.get("review_count") || 0,
    price_checked_at: (formData.get("price_checked_at") as string | null) || null,
    is_featured: formData.get("is_featured") === "on",
    is_active: formData.get("is_active") !== "off",
  };
  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  // Duplicate prevention (server-side enforcement): block identical
  // affiliate links / ASIN / slug / highly-similar titles.
  await assertNoDuplicates(supabase, {
    title: parsed.data.title,
    slug: parsed.data.slug,
    amazon_url: parsed.data.amazon_url ?? null,
    amazon_asin: parsed.data.amazon_asin ?? null,
    oliveyoung_url: parsed.data.oliveyoung_url ?? null,
  });
  const { error } = await supabase.from("products").insert(parsed.data);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath(`/product/${parsed.data.slug}`);
  revalidatePath("/", "layout");
  redirect("/admin/products");
}

export async function updateProduct(id: string, formData: FormData) {
  const supabase = await requireAdmin();
  const raw = {
    title: formData.get("title"),
    slug: formData.get("slug"),
    brand: formData.get("brand"),
    description: formData.get("description"),
    price: formData.get("price"),
    compare_at_price: formData.get("compare_at_price") || null,
    category: formData.get("category"),
    concern: formData.getAll("concern"),
    skin_type: formData.getAll("skin_type"),
    key_ingredients: String(formData.get("key_ingredients") ?? "").split(",").map((s) => s.trim()).filter(Boolean),
    image_urls: String(formData.get("image_urls") ?? "").split("\n").map((s) => s.trim()).filter(Boolean),
    amazon_url: formData.get("amazon_url") || null,
    amazon_asin: formData.get("amazon_asin") || null,
    oliveyoung_url: formData.get("oliveyoung_url") || null,
    rating: formData.get("rating") || null,
    review_count: formData.get("review_count") || 0,
    price_checked_at: (formData.get("price_checked_at") as string | null) || null,
    is_featured: formData.get("is_featured") === "on",
    is_active: formData.get("is_active") !== "off",
  };
  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  // Duplicate prevention (server-side enforcement): same checks as create,
  // excluding the product being edited so it never flags itself.
  await assertNoDuplicates(supabase, {
    title: parsed.data.title,
    slug: parsed.data.slug,
    amazon_url: parsed.data.amazon_url ?? null,
    amazon_asin: parsed.data.amazon_asin ?? null,
    oliveyoung_url: parsed.data.oliveyoung_url ?? null,
    excludeId: id,
  });
  // Capture the previous slug so a rename doesn't leave the old detail page cached.
  const { data: existing } = await supabase.from("products").select("slug").eq("id", id).single();
  const { error } = await supabase.from("products").update(parsed.data).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath(`/product/${parsed.data.slug}`);
  if (existing?.slug && existing.slug !== parsed.data.slug) revalidatePath(`/product/${existing.slug}`);
  revalidatePath("/", "layout");
  redirect("/admin/products");
}

export async function deleteProduct(id: string) {
  const supabase = await requireAdmin();
  const { data: existing } = await supabase.from("products").select("slug").eq("id", id).single();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/admin/products");
  if (existing?.slug) revalidatePath(`/product/${existing.slug}`);
  revalidatePath("/", "layout");
}

export async function trackClick(productId: string, source: "amazon" | "oliveyoung") {
  try {
    const supabase = await createServerSupabase();
    if (!supabase) return;
    await supabase.from("product_clicks").insert({ product_id: productId, source });
  } catch {
    // non-blocking
  }
}
