import { createServerSupabase } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { MOCK_PRODUCTS, getMockProductBySlug } from "@/lib/data/products";
import type { Product } from "@/lib/types";

function mapRow(row: any): Product {
  return {
    id: String(row.id),
    slug: row.slug,
    title: row.title,
    brand: row.brand,
    description: row.description,
    price: Number(row.price),
    compare_at_price: row.compare_at_price != null ? Number(row.compare_at_price) : null,
    currency: row.currency ?? "$",
    category: row.category,
    concern: row.concern ?? [],
    skin_type: row.skin_type ?? [],
    key_ingredients: row.key_ingredients ?? [],
    image_urls: row.image_urls ?? [],
    amazon_url: row.amazon_url,
    oliveyoung_url: row.oliveyoung_url,
    rating: row.rating != null ? Number(row.rating) : null,
    review_count: row.review_count ?? 0,
    is_featured: Boolean(row.is_featured),
    is_active: row.is_active ?? true,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// Production rule: mock data is ONLY a development convenience.
// - Supabase unconfigured → mocks (local preview without env).
// - Supabase configured + query succeeds → live data wins, even if empty.
// - Query fails → mocks in dev (so you can keep working), empty in
//   production (never show fake products or fake admin rows on the live site).
function devFallback<T>(mockValue: T, emptyValue: T): T {
  return process.env.NODE_ENV === "production" ? emptyValue : mockValue;
}

// Cookie-free public client for catalog reads. The session-aware
// createServerSupabase() calls cookies(), which opts every consumer out of
// ISR caching — public product data needs no session, so it must not pay
// that cost. Admin paths keep the session client.
function createPublicSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  return createSupabaseClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function getProducts(opts?: { featuredOnly?: boolean; limit?: number }): Promise<Product[]> {
  try {
    const supabase = createPublicSupabase();
    if (!supabase) return filterMock(opts);
    const query = supabase.from("products").select("*").eq("is_active", true).order("created_at", { ascending: false });
    if (opts?.featuredOnly) query.eq("is_featured", true);
    if (opts?.limit) query.limit(opts.limit);
    const { data, error } = await query;
    if (!error && data) return data.map(mapRow);
    return devFallback(filterMock(opts), []);
  } catch {
    return devFallback(filterMock(opts), []);
  }
}

function filterMock(opts?: { featuredOnly?: boolean; limit?: number }) {
  let list = [...MOCK_PRODUCTS];
  if (opts?.featuredOnly) list = list.filter((p) => p.is_featured);
  if (opts?.limit) list = list.slice(0, opts.limit);
  return list;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const supabase = createPublicSupabase();
    if (!supabase) return getMockProductBySlug(slug);
    const { data, error } = await supabase.from("products").select("*").eq("slug", slug).eq("is_active", true).single();
    if (!error && data) return mapRow(data);
    if (error && error.code === "PGRST116") return null; // live DB: no such product → 404
    return devFallback(getMockProductBySlug(slug), null); // query failed: mock in dev, 404 in prod
  } catch {
    return devFallback(getMockProductBySlug(slug), null);
  }
}

export async function getAllProductsAdmin(): Promise<Product[]> {
  try {
    const supabase = await createServerSupabase();
    if (!supabase) return MOCK_PRODUCTS; // local preview mode
    const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (!error && data) return data.map(mapRow);
    // Configured but unreadable (e.g. SQL not run yet): mocks in dev, empty in prod.
    return devFallback(MOCK_PRODUCTS, []);
  } catch {
    return devFallback(MOCK_PRODUCTS, []);
  }
}
