import Link from "next/link";
import { Sparkles, Globe, Play, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-sage-100 bg-white/70 backdrop-blur">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-sage-400 to-sage-600 text-white">
              <Sparkles className="h-5 w-5" />
            </span>
            <span className="font-serif-display text-lg font-bold">BeautyNestKorea</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-soft">
            Honest, curated K-beauty & global skincare recommendations. We compare Amazon and Olive Young so you always get the best price.
          </p>
          <p className="mt-4 max-w-sm text-xs leading-relaxed text-ink-soft/80">
            Affiliate disclosure: we may earn a commission when you buy through our links — at no extra cost to you. This supports our independent reviews.
          </p>
          <div className="mt-4 flex gap-2">
            {[Globe, Play, Mail].map((Icon, i) => (
              <a key={i} href="#" className="flex h-9 w-9 items-center justify-center rounded-full bg-sage-50 text-sage-700 transition hover:bg-sage-100">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-ink">Shop</h4>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            <li><Link href="/shop" className="hover:text-ink">All products</Link></li>
            <li><Link href="/shop?concern=Acne" className="hover:text-ink">Acne care</Link></li>
            <li><Link href="/shop?concern=Anti-aging" className="hover:text-ink">Anti-aging</Link></li>
            <li><Link href="/shop?concern=Hydration" className="hover:text-ink">Hydration</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-ink">Learn</h4>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            <li><Link href="/blog" className="hover:text-ink">Skincare advice</Link></li>
            <li><Link href="/blog/10-step-korean-routine-beginners" className="hover:text-ink">Beginner routine</Link></li>
            <li><Link href="/admin/login" className="hover:text-ink">Admin login</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-sage-100 py-5 text-center text-xs text-ink-soft">
        © {new Date().getFullYear()} BeautyNestKorea. All rights reserved.
      </div>
    </footer>
  );
}
