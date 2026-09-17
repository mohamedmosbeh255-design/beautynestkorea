import ProductForm from "@/components/admin/ProductForm";
import { createProduct } from "@/lib/actions";

export default function NewProductPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="font-serif-display text-3xl font-bold tracking-tight">Add product</h1>
      <p className="mt-1 text-sm text-ink-soft">Fill every field. Use your own photos: upload them to Supabase Storage (bucket: product-images, public) and paste the URLs. Never upload retailer images.</p>
      <div className="mt-6">
        <ProductForm action={createProduct} />
      </div>
    </div>
  );
}
