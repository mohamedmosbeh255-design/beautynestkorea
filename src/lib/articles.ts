import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createServerSupabase } from "@/lib/supabase/server";
import { getProducts } from "@/lib/products";
import type { Article, Product } from "@/lib/types";

// Data layer for DB-backed editorial articles (Supabase `articles` table).
// Mirrors lib/products.ts conventions:
// - public reads use a cookie-free client (keeps ISR caching intact),
// - admin reads use the session client,
// - unconfigured Supabase → empty lists (never fake articles in production).

function mapRow(row: any): Article {
  return {
    id: String(row.id),
    title: row.title,
    slug: row.slug,
    content: row.content ?? "",
    excerpt: row.excerpt ?? null,
    cover_image_url: row.cover_image_url ?? null,
    category: row.category ?? "Guides",
    published_at: (row.published_at as string | null) ?? null,
    is_published: Boolean(row.is_published),
    related_product_ids: Array.isArray(row.related_product_ids)
      ? row.related_product_ids.map(String)
      : [],
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function createPublicSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  return createSupabaseClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Published articles for the storefront, newest first. */
export async function getPublishedArticles(): Promise<Article[]> {
  try {
    const supabase = createPublicSupabase();
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("is_published", true)
      .order("published_at", { ascending: false, nullsFirst: false });
    if (!error && data) return data.map(mapRow);
    return [];
  } catch {
    return [];
  }
}

/** Single published article by slug (null → 404). */
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  try {
    const supabase = createPublicSupabase();
    if (!supabase) return null;
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .single();
    if (!error && data) return mapRow(data);
    return null;
  } catch {
    return null;
  }
}

/** All articles (incl. drafts) for the admin panel. */
export async function getAllArticlesAdmin(): Promise<Article[]> {
  try {
    const supabase = await createServerSupabase();
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .order("updated_at", { ascending: false });
    if (!error && data) return data.map(mapRow);
    return [];
  } catch {
    return [];
  }
}

/**
 * Resolve an article's linked products: active catalog rows only, in the
 * admin-chosen order. Stale ids (deleted/deactivated products) are dropped
 * so the storefront never renders dead "Recommended Products" cards.
 */
export async function getRelatedProducts(ids: string[]): Promise<Product[]> {
  if (!ids.length) return [];
  const catalog = await getProducts();
  const byId = new Map(catalog.map((p) => [String(p.id), p]));
  const out: Product[] = [];
  for (const id of ids) {
    const hit = byId.get(String(id));
    if (hit) out.push(hit);
    if (out.length >= 5) break;
  }
  return out;
}
