import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Star, ShieldCheck, Leaf, Droplets } from "lucide-react";
import { getProductBySlug, getProducts } from "@/lib/products";
import ImageGallery from "@/components/ImageGallery";
import AffiliateButtons from "@/components/AffiliateButtons";
import ProductCard from "@/components/ProductCard";
import { formatPrice } from "@/lib/utils";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.title,
    description: product.description.slice(0, 155),
    openGraph: { title: product.title, description: product.description.slice(0, 155), images: product.image_urls.slice(0, 1) },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = (await getProducts()).filter((p) => p.slug !== product.slug && p.concern.some((c) => product.concern.includes(c))).slice(0, 3);
  const discount = product.compare_at_price && product.compare_at_price > product.price
    ? Math.round((1 - product.price / product.compare_at_price) * 100) : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-2">
        <ImageGallery images={product.image_urls} title={product.title} />

        <div className="animate-fade-up">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-sage-600">{product.brand} • {product.category}</p>
          <h1 className="font-serif-display mt-2 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{product.title}</h1>
          <div className="mt-3 flex items-center gap-2 text-sm">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="font-bold">{product.rating?.toFixed(1) ?? "—"}</span>
            <span className="text-ink-soft">{(product.review_count ?? 0).toLocaleString()} verified reviews</span>
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold">{formatPrice(product.price, product.currency)}</span>
            {discount > 0 && (
              <>
                <span className="text-lg text-ink-soft line-through">{formatPrice(product.compare_at_price, product.currency)}</span>
                <span className="rounded-full bg-blush-500 px-2.5 py-1 text-xs font-bold text-white">Save {discount}%</span>
              </>
            )}
          </div>

          <p className="mt-5 leading-relaxed text-ink-soft">{product.description}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            {product.concern.map((c) => (
              <span key={c} className="rounded-full bg-sage-50 px-3 py-1 text-xs font-semibold text-sage-700">{c}</span>
            ))}
            {product.skin_type.map((s) => (
              <span key={s} className="rounded-full bg-blush-50 px-3 py-1 text-xs font-semibold text-blush-600">{s} skin</span>
            ))}
          </div>

          <div className="mt-7">
            <AffiliateButtons productId={product.id} amazonUrl={product.amazon_url} oliveyoungUrl={product.oliveyoung_url} title={product.title} />
            <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-soft">
              <ShieldCheck className="h-3.5 w-3.5 text-sage-600" />
              Prices checked weekly. We may earn a commission at no cost to you.
            </p>
          </div>

          <div className="glass mt-7 rounded-3xl p-6">
            <h2 className="flex items-center gap-2 font-serif-display text-lg font-bold">
              <Leaf className="h-5 w-5 text-sage-600" /> Key ingredients
            </h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {product.key_ingredients.map((ing) => (
                <li key={ing} className="flex items-center gap-2 rounded-xl bg-white/70 px-3.5 py-2.5 text-sm font-medium">
                  <Droplets className="h-4 w-4 shrink-0 text-sage-500" /> {ing}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="font-serif-display text-2xl font-bold">Pairs well with</h2>
          <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}

      {/* SEO FAQ */}
      <div className="glass mt-12 rounded-3xl p-6 sm:p-8">
        <h2 className="font-serif-display text-xl font-bold">Frequently asked</h2>
        <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="font-semibold">Is {product.title} good for sensitive skin?</p>
            <p className="mt-1 text-ink-soft">{product.skin_type.includes("Sensitive") || product.skin_type.includes("All") ? "Yes — its formula is well tolerated by sensitive types. Patch-test first." : "It suits " + product.skin_type.join(", ") + " skin best. Patch-test if you're sensitive."}</p>
          </div>
          <div>
            <p className="font-semibold">Where is it cheapest — Amazon or Olive Young?</p>
            <p className="mt-1 text-ink-soft">Prices rotate with sales. Use the buttons above to compare live prices; Olive Young often bundles minis and limited editions.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
