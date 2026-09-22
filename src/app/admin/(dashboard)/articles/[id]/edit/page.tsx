import { notFound } from "next/navigation";
import ArticleForm from "@/components/admin/ArticleForm";
import { updateArticle } from "@/lib/actions";
import { createServerSupabase } from "@/lib/supabase/server";
import { getAllProductsAdmin } from "@/lib/products";
import type { Article } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getArticleById(id: string): Promise<Article | null> {
  try {
    const supabase = await createServerSupabase();
    if (!supabase) return null;
    const { data, error } = await supabase.from("articles").select("*").eq("id", id).single();
    if (error || !data) return null;
    return {
      id: String(data.id),
      title: data.title,
      slug: data.slug,
      content: data.content ?? "",
      excerpt: data.excerpt ?? null,
      cover_image_url: data.cover_image_url ?? null,
      category: data.category ?? "Guides",
      published_at: (data.published_at as string | null) ?? null,
      is_published: Boolean(data.is_published),
      related_product_ids: Array.isArray(data.related_product_ids)
        ? data.related_product_ids.map(String)
        : [],
    };
  } catch {
    return null;
  }
}

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [article, products] = await Promise.all([getArticleById(id), getAllProductsAdmin()]);
  if (!article) notFound();
  const productOptions = products
    .filter((p) => p.is_active !== false)
    .map((p) => ({ id: String(p.id), title: p.title, brand: p.brand }));
  return (
    <div className="max-w-3xl">
      <h1 className="font-serif-display text-3xl font-bold tracking-tight">Edit article</h1>
      <p className="mt-1 text-sm text-ink-soft">{article.title}</p>
      <div className="mt-6">
        <ArticleForm initial={article} productOptions={productOptions} action={updateArticle.bind(null, id)} />
      </div>
    </div>
  );
}
