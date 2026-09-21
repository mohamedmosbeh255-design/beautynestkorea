import Link from "next/link";
import Image from "next/image";
import { Star, ArrowUpRight } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatPriceChecked, formatPrice } from "@/lib/utils";

export default function ProductCard({ product }: { product: Product }) {
  const img = product.image_urls[0] ?? "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80";
  // Price provenance: the WHOLE price block (price, discount badge, stamp)
  // renders only with a verified priceCheckedAt date. Unknown → NULL → hidden.
  const priceChecked = formatPriceChecked(product.priceCheckedAt);
  const discount = priceChecked && product.compare_at_price && product.compare_at_price > product.price
    ? Math.round((1 - product.price / product.compare_at_price) * 100)
    : 0;
  return (
    <Link
      href={`/product/${product.slug}`}
      className="glass group overflow-hidden rounded-3xl transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_-20px_rgba(95,138,84,0.35)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={img}
          alt={product.title}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        {discount > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-blush-500 px-2.5 py-1 text-xs font-bold text-white shadow">
            -{discount}%
          </span>
        )}
        {product.is_featured && (
          <span className="absolute right-3 top-3 rounded-full bg-white/85 px-2.5 py-1 text-xs font-semibold text-sage-700 backdrop-blur">
            Featured
          </span>
        )}
      </div>
      <div className="p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sage-600">{product.brand}</p>
        <h3 className="font-serif-display mt-1 text-lg font-semibold leading-snug clamp-2">{product.title}</h3>
        <div className="mt-2 flex items-center gap-1.5 text-sm">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          <span className="font-semibold">{product.rating?.toFixed(1) ?? "—"}</span>
          <span className="text-ink-soft">({(product.review_count ?? 0).toLocaleString()})</span>
        </div>
        {priceChecked && (
          <>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold">{formatPrice(product.price, product.currency)}</span>
                {discount > 0 && (
                  <span className="text-sm text-ink-soft line-through">{formatPrice(product.compare_at_price, product.currency)}</span>
                )}
              </div>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-ink text-white transition group-hover:bg-sage-600">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-1 text-[11px] text-ink-soft">Price checked {priceChecked} · may have changed</p>
          </>
        )}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {product.concern.slice(0, 3).map((c) => (
            <span key={c} className="rounded-full bg-sage-50 px-2.5 py-0.5 text-xs font-medium text-sage-700">{c}</span>
          ))}
        </div>
      </div>
    </Link>
  );
}
