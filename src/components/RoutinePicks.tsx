import Link from "next/link";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { getProductBySlug } from "@/lib/products";
import type { RoutinePick } from "@/lib/advice";

/**
 * House product-card embed for advice "Gentle Routine Picks": product image +
 * title + the pick blurb verbatim + an internal link to the product page.
 * Funnel rule: advice cards NEVER link outbound to Amazon directly — users
 * must land on our product page first (cookies + full details). The product
 * page already carries the correct affiliate CTA via AffiliateButtons.
 * Slugs that don't resolve are skipped, never rendered broken.
 */
export default async function RoutinePicks({ picks }: { picks: RoutinePick[] }) {
  const resolved = (
    await Promise.all(
      picks.map(async (pick) => ({ pick, product: await getProductBySlug(pick.slug) }))
    )
  ).filter((r): r is { pick: RoutinePick; product: NonNullable<Awaited<ReturnType<typeof getProductBySlug>>> } =>
    Boolean(r.product)
  );
  if (resolved.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="font-serif-display scroll-mt-24 pt-4 text-xl font-bold tracking-tight text-ink sm:text-2xl">
        Gentle Routine Picks
      </h2>
      <div className="mt-5 grid gap-6 sm:grid-cols-2">
        {resolved.map(({ pick, product }) => {
          const img = product.image_urls[0];
          return (
            <div key={pick.slug} className="glass overflow-hidden rounded-3xl">
              {img && (
                <div className="relative aspect-[16/9] overflow-hidden">
                  <Image
                    src={img}
                    alt={product.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sage-600">
                  {product.brand}
                </p>
                <h3 className="font-serif-display mt-1 text-lg font-bold leading-snug">
                  <Link href={`/product/${product.slug}`} className="hover:underline">
                    {product.title}
                  </Link>
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{pick.blurb}</p>
                <div className="mt-4">
                  <Link
                    href={`/product/${product.slug}`}
                    className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-[#FF9900] px-6 py-4 text-sm font-bold text-black shadow-lg shadow-orange-200 transition hover:brightness-95"
                    aria-label={`View ${product.title} — product page`}
                  >
                    <ShoppingCart className="h-5 w-5" /> View on Amazon
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
