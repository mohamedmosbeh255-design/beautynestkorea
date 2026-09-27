import ArticleForm from "@/components/admin/ArticleForm";
import { createArticle } from "@/lib/actions";
import { getAllProductsAdmin } from "@/lib/products";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

// TEMPORARY deep-debug instrumentation for prod #441 (remove after diagnosis).
// Logs presence/shape only — never secrets, tokens, emails, or cookie values.
export default async function NewArticlePage() {
  const t0 = Date.now();
  try {
    const supabaseConfigured = isSupabaseConfigured();
    let hasAuthCookie = false;
    try {
      const names = (await cookies()).getAll().map((c) => c.name);
      hasAuthCookie = names.some((n) => n.includes("auth"));
    } catch {
      hasAuthCookie = false;
    }
    console.error("[admin-new-debug] start", {
      nodeEnv: process.env.NODE_ENV,
      supabaseConfigured,
      hasAuthCookie,
    });

    const products = (await getAllProductsAdmin()) ?? [];
    const safeProducts = Array.isArray(products) ? products : [];
    console.error("[admin-new-debug] products", {
      count: safeProducts.length,
      firstRowKeys: safeProducts.length > 0 ? Object.keys(safeProducts[0] ?? {}) : [],
      fieldTypes: safeProducts.slice(0, 5).map((p) => ({
        id: typeof p?.id,
        title: typeof p?.title,
        brand: typeof p?.brand,
        is_active: typeof p?.is_active,
      })),
      elapsedMs: Date.now() - t0,
    });

    const productOptions = safeProducts
      .filter((p) => p != null && p.is_active !== false && p.id != null && typeof p.title === "string" && typeof p.brand === "string")
      .map((p) => ({ id: String(p.id), title: p.title, brand: p.brand }));
    console.error("[admin-new-debug] options", {
      count: productOptions.length,
      elapsedMs: Date.now() - t0,
    });

    return (
      <div className="max-w-3xl">
        <h1 className="font-serif-display text-3xl font-bold tracking-tight">Add article</h1>
        <p className="mt-1 text-sm text-ink-soft">Write the guide in markdown, link up to 5 products, then publish. The live page shows them as “Recommended Products”.</p>
        <div className="mt-6">
          <ArticleForm productOptions={productOptions} action={createArticle} />
        </div>
      </div>
    );
  } catch (e) {
    console.error("[admin-new-debug] RENDER THROW", {
      message: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack : undefined,
      cause: e instanceof Error ? (e as { cause?: unknown }).cause : undefined,
      elapsedMs: Date.now() - t0,
    });
    throw e;
  }
}
