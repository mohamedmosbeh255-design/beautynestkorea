import Link from "next/link";
import Image from "next/image";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { getAllProductsAdmin } from "@/lib/products";
import { deleteProduct } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await getAllProductsAdmin();
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif-display text-3xl font-bold tracking-tight">Products ({products.length})</h1>
          <p className="mt-1 text-sm text-ink-soft">Add, edit or remove catalog items. Changes revalidate the storefront.</p>
        </div>
        <Link href="/admin/products/new" className="inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-sage-700">
          <Plus className="h-4 w-4" /> Add
        </Link>
      </div>

      <div className="mt-6 grid gap-4">
        {products.map((p) => (
          <div key={p.id} className="glass flex flex-wrap items-center gap-4 rounded-3xl p-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-sage-50">
              {p.image_urls[0] && <Image src={p.image_urls[0]} alt={p.title} fill className="object-cover" sizes="64px" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{p.title}</p>
              <p className="text-xs text-ink-soft">{p.brand} • {p.category} • ${p.price.toFixed(2)} {p.is_featured ? "• ★ Featured" : ""} {!p.is_active ? "• Hidden" : ""}</p>
              <p className="truncate text-xs text-ink-soft">/{p.slug}</p>
            </div>
            <div className="flex gap-2">
              <Link href={`/admin/products/${p.id}/edit`} className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-4 py-2 text-xs font-semibold hover:bg-sage-50">
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Link>
              <form action={deleteProduct.bind(null, p.id)}>
                <button className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </form>
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <div className="glass rounded-3xl p-12 text-center text-sm text-ink-soft">No products yet. Add your first one.</div>
        )}
      </div>
    </div>
  );
}
