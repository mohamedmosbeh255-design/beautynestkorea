import ArticleForm from "@/components/admin/ArticleForm";
import { createArticle } from "@/lib/actions";
import { getAllProductsAdmin } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function NewArticlePage() {
  const products = await getAllProductsAdmin();
  const productOptions = products
    .filter((p) => p.is_active !== false)
    .map((p) => ({ id: String(p.id), title: p.title, brand: p.brand }));
  return (
    <div className="max-w-3xl">
      <h1 className="font-serif-display text-3xl font-bold tracking-tight">Add article</h1>
      <p className="mt-1 text-sm text-ink-soft">Write the guide in markdown, link up to 5 products, then publish. The live page shows them as “Recommended Products”.</p>
      <div className="mt-6">
        <ArticleForm productOptions={productOptions} action={createArticle} />
      </div>
    </div>
  );
}
