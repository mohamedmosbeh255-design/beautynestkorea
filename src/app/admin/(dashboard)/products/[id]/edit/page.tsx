import { notFound } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import { updateProduct } from "@/lib/actions";
import { createServerSupabase } from "@/lib/supabase/server";
import { getMockProductBySlug, MOCK_PRODUCTS } from "@/lib/data/products";

export const dynamic = "force-dynamic";

async function getById(id: string) {
  const mock = MOCK_PRODUCTS.find((p) => p.id === id);
  try {
    const supabase = await createServerSupabase();
    if (!supabase) return mock ?? null;
    const { data } = await supabase.from("products").select("*").eq("id", id).single();
    if (!data) return mock ?? null;
    return {
      id: String(data.id),
      slug: data.slug,
      title: data.title,
      brand: data.brand,
      description: data.description,
      price: Number(data.price),
      compare_at_price: data.compare_at_price != null ? Number(data.compare_at_price) : null,
      category: data.category,
      concern: data.concern ?? [],
      skin_type: data.skin_type ?? [],
      key_ingredients: data.key_ingredients ?? [],
      image_urls: data.image_urls ?? [],
      amazon_url: data.amazon_url,
      amazon_asin: data.amazon_asin ?? null,
      oliveyoung_url: data.oliveyoung_url,
      rating: data.rating != null ? Number(data.rating) : null,
      review_count: data.review_count ?? 0,
      is_featured: Boolean(data.is_featured),
      is_active: data.is_active ?? true,
    };
  } catch {
    return mock ?? null;
  }
}

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getById(id);
  if (!product) notFound();
  return (
    <div className="max-w-3xl">
      <h1 className="font-serif-display text-3xl font-bold tracking-tight">Edit product</h1>
      <p className="mt-1 text-sm text-ink-soft">{product.title}</p>
      <div className="mt-6">
        <ProductForm initial={product} action={updateProduct.bind(null, id)} />
      </div>
    </div>
  );
}

// Silence unused import warning while keeping helper available
void getMockProductBySlug;
