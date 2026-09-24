"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { productSchema, articleSchema } from "@/lib/validations";
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

/**
 * Today in UTC as YYYY-MM-DD — the price_checked_at stamp format the admin
 * date input and the DB column both accept.
 */
function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Automatic price-check stamping (owner-approved): a product whose price is
 * (re)entered is being verified right now, so an empty stamp would wrongly
 * hide its price block storefront-wide. An explicitly entered date is always
 * respected (backdating a real check must survive).
 */
function autoStamp(raw: { price_checked_at: string | null; price: unknown }): string | null {
  const explicit = (raw.price_checked_at ?? "").trim();
  if (explicit !== "") return raw.price_checked_at;
  return raw.price != null && String(raw.price).trim() !== "" ? todayStamp() : null;
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
  // New products are priced right now: auto-stamp so the price block shows
  // immediately (an explicit date still wins).
  raw.price_checked_at = autoStamp(raw);
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
  // Capture the previous row BEFORE validation so a changed price/rating can
  // re-stamp the check date below (and a rename still clears the old cache).
  const { data: existing } = await supabase
    .from("products")
    .select("slug, price, rating")
    .eq("id", id)
    .single();
  // A (re)entered price or rating is being verified right now: stamp today,
  // overriding even an explicit date (the new numbers supersede it). Untouched
  // numbers keep the submitted value via autoStamp (explicit date or empty).
  const priceChanged = existing != null && Number(existing.price) !== Number(raw.price);
  const ratingChanged =
    existing != null && (existing.rating ?? null) !== (raw.rating != null && raw.rating !== "" ? Number(raw.rating) : null);
  if (priceChanged || ratingChanged) raw.price_checked_at = todayStamp();
  else raw.price_checked_at = autoStamp(raw);
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

// ─── Articles (DB-backed guides with strategic product linking) ───

type ArticleSupabase = NonNullable<Awaited<ReturnType<typeof createServerSupabase>>>;

/** Keep only ids that exist as ACTIVE products (drops stale/deactivated links). */
async function validateRelatedProductIds(
  supabase: ArticleSupabase,
  ids: string[]
): Promise<string[]> {
  const unique = [...new Set(ids.map(String))].slice(0, 5);
  if (unique.length === 0) return [];
  const { data, error } = await supabase
    .from("products")
    .select("id")
    .in("id", unique)
    .eq("is_active", true);
  if (error) throw new Error(error.message);
  const valid = new Set((data ?? []).map((r) => String(r.id)));
  // Preserve the admin-chosen order.
  return unique.filter((id) => valid.has(id));
}

async function assertArticleSlugFree(
  supabase: ArticleSupabase,
  slug: string,
  excludeId?: string
): Promise<void> {
  let query = supabase.from("articles").select("id").eq("slug", slug).limit(1);
  if (excludeId) query = query.neq("id", excludeId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  if (data && data.length > 0) {
    throw new Error(`An article with the slug “${slug}” already exists. Use a different slug.`);
  }
}

function toArticleDate(input: unknown, isPublished: boolean): string | null {
  const raw = String(input ?? "").trim();
  if (raw) {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) throw new Error("Published date must be a valid date");
    return d.toISOString();
  }
  // Auto-stamp the moment an article goes live without an explicit date.
  return isPublished ? new Date().toISOString() : null;
}

function parseArticleForm(formData: FormData) {
  const raw = {
    title: formData.get("title"),
    slug: (formData.get("slug") as string) || slugify(String(formData.get("title") ?? "")),
    content: formData.get("content"),
    excerpt: formData.get("excerpt") || null,
    cover_image_url: formData.get("cover_image_url") || null,
    category: formData.get("category"),
    published_at: (formData.get("published_at") as string | null) || null,
    is_published: formData.get("is_published") === "on",
    related_product_ids: formData.getAll("related_product_ids"),
  };
  const parsed = articleSchema.safeParse(raw);
  if (!parsed.success) throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  return parsed.data;
}

export async function createArticle(formData: FormData) {
  const supabase = await requireAdmin();
  const data = parseArticleForm(formData);
  await assertArticleSlugFree(supabase, data.slug);
  const related_product_ids = await validateRelatedProductIds(supabase, data.related_product_ids);
  const { error } = await supabase.from("articles").insert({
    title: data.title,
    slug: data.slug,
    content: data.content,
    excerpt: data.excerpt || null,
    cover_image_url: data.cover_image_url || null,
    category: data.category,
    published_at: toArticleDate(data.published_at, data.is_published),
    is_published: data.is_published,
    related_product_ids,
  });
  if (error) {
    if ((error as { code?: string }).code === "23505") {
      throw new Error(`An article with the slug “${data.slug}” already exists. Use a different slug.`);
    }
    throw new Error(error.message);
  }
  revalidatePath("/");
  revalidatePath("/articles");
  revalidatePath(`/articles/${data.slug}`);
  revalidatePath("/", "layout");
  redirect("/admin/articles");
}

export async function updateArticle(id: string, formData: FormData) {
  const supabase = await requireAdmin();
  const data = parseArticleForm(formData);
  await assertArticleSlugFree(supabase, data.slug, id);
  const related_product_ids = await validateRelatedProductIds(supabase, data.related_product_ids);
  const { data: existing } = await supabase.from("articles").select("slug").eq("id", id).single();
  const { error } = await supabase
    .from("articles")
    .update({
      title: data.title,
      slug: data.slug,
      content: data.content,
      excerpt: data.excerpt || null,
      cover_image_url: data.cover_image_url || null,
      category: data.category,
      published_at: toArticleDate(data.published_at, data.is_published),
      is_published: data.is_published,
      related_product_ids,
    })
    .eq("id", id);
  if (error) {
    if ((error as { code?: string }).code === "23505") {
      throw new Error(`An article with the slug “${data.slug}” already exists. Use a different slug.`);
    }
    throw new Error(error.message);
  }
  revalidatePath("/");
  revalidatePath("/articles");
  revalidatePath(`/articles/${data.slug}`);
  if (existing?.slug && existing.slug !== data.slug) revalidatePath(`/articles/${existing.slug}`);
  revalidatePath("/", "layout");
  redirect("/admin/articles");
}

export async function deleteArticle(id: string) {
  const supabase = await requireAdmin();
  const { data: existing } = await supabase.from("articles").select("slug").eq("id", id).single();
  const { error } = await supabase.from("articles").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/articles");
  revalidatePath("/admin/articles");
  if (existing?.slug) revalidatePath(`/articles/${existing.slug}`);
  revalidatePath("/", "layout");
}
