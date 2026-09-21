import Link from "next/link";
import { ArrowLeft, ArrowRight, FlaskConical, Moon, Sun, TriangleAlert, Activity, ExternalLink } from "lucide-react";
import type { KbConcern } from "@/lib/advice-kb";
import { getConcernSignal, getConcernShopFilter, getRelatedConcerns, resolveConcernProducts } from "@/lib/advice-kb";
import AffiliateDisclosure from "@/components/AffiliateDisclosure";
import EducationalDisclaimer from "@/components/EducationalDisclaimer";

/** Full concern guide: explanation, ingredients, routines, FAQs, product matches. */
export default async function ConcernArticle({ concern }: { concern: KbConcern }) {
  const [{ matched }, signal, shopFilter] = await Promise.all([
    resolveConcernProducts(concern.productNames),
    Promise.resolve(getConcernSignal(concern.ingredientNames)),
    Promise.resolve(getConcernShopFilter(concern.slug)),
  ]);
  const related = getRelatedConcerns(concern.slug);

  return (
    <article className="mx-auto max-w-prose px-4 py-10 sm:px-6">
      <Link href="/advice" className="inline-flex items-center gap-1.5 text-sm font-semibold text-sage-700 hover:underline">
        <ArrowLeft className="h-4 w-4" /> All concerns
      </Link>
      <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-sage-600">Concern guide</p>
      <h1 className="font-serif-display mt-2 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
        {concern.title}
      </h1>
      <p className="mt-4 leading-relaxed text-ink-soft">{concern.explanation}</p>

      {signal && (
        <div className="glass mt-6 rounded-3xl p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-sage-700">
            <Activity className="h-4 w-4" /> Today&apos;s signal · report {signal.date}
          </h2>
          {signal.matches.length > 0 ? (
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Trending now: <strong className="text-ink">{signal.matches.join(", ")}</strong> — also
              key for this concern. See the full{" "}
              <Link href={`/market-report/${signal.date}`} className="font-semibold text-sage-700 hover:underline">
                {signal.date} market report
              </Link>
              .
            </p>
          ) : (
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              None of this concern&apos;s key ingredients are trending in the latest report ({signal.date}) —{" "}
              <Link href="/market-report" className="font-semibold text-sage-700 hover:underline">
                read it here
              </Link>
              .
            </p>
          )}
        </div>
      )}

      <h2 className="font-serif-display mt-10 flex items-center gap-2 text-2xl font-bold tracking-tight">
        <FlaskConical className="h-5 w-5 text-sage-600" /> Key ingredients
      </h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {concern.ingredients.map((ing) => (
          <li key={ing.name} className="rounded-2xl bg-white/70 px-4 py-3.5">
            <p className="font-semibold">{ing.name}</p>
            {ing.desc && <p className="mt-1 text-sm text-ink-soft">{ing.desc}</p>}
          </li>
        ))}
      </ul>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <div className="glass rounded-3xl p-6">
          <h2 className="font-serif-display flex items-center gap-2 text-xl font-bold">
            <Sun className="h-5 w-5 text-sage-600" /> AM routine
          </h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-ink-soft">
            {concern.am.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
        <div className="glass rounded-3xl p-6">
          <h2 className="font-serif-display flex items-center gap-2 text-xl font-bold">
            <Moon className="h-5 w-5 text-sage-600" /> PM routine
          </h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-ink-soft">
            {concern.pm.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
      </div>

      <h2 className="font-serif-display mt-10 flex items-center gap-2 text-2xl font-bold tracking-tight">
        <TriangleAlert className="h-5 w-5 text-amber-600" /> What to avoid
      </h2>
      <ul className="mt-4 space-y-2">
        {concern.avoid.map((item, i) => (
          <li key={i} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900">
            {item}
          </li>
        ))}
      </ul>

      <h2 className="font-serif-display mt-10 text-2xl font-bold tracking-tight">Frequently asked</h2>
      <div className="mt-4 space-y-4">
        {concern.faqs.map((f) => (
          <div key={f.q} className="glass rounded-3xl p-5 sm:p-6">
            <p className="font-semibold">{f.q}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{f.a}</p>
          </div>
        ))}
      </div>

      {matched.length > 0 && (
        <div className="mt-10">
          <h2 className="font-serif-display text-2xl font-bold tracking-tight">Matching products</h2>
          <p className="mt-1 text-sm text-ink-soft">
            From our catalog — open a product to compare current retailer prices.
          </p>
          <AffiliateDisclosure className="mt-4" />
          <ul className="mt-2 space-y-3">
            {matched.map((m) => (
              <li
                key={m.slug}
                className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-4"
              >
                <span>
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-sage-600">
                    {m.brand}
                  </span>
                  <Link href={`/product/${m.slug}`} className="font-serif-display font-bold hover:underline">
                    {m.name}
                  </Link>
                </span>
                <Link
                  href={`/product/${m.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-xs font-bold text-white transition hover:bg-sage-700"
                >
                  Check current price on Amazon <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </li>
            ))}
          </ul>
          {shopFilter && (
            <Link
              href={`/shop?concern=${encodeURIComponent(shopFilter)}`}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-sage-700 hover:underline"
            >
              Browse all {concern.title} products <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      )}

      <EducationalDisclaimer className="mt-10" />
      <p className="mt-3 text-xs text-ink-soft">{concern.caveat}</p>

      {related.length > 0 && (
        <div className="mt-8">
          <h2 className="font-serif-display text-xl font-bold tracking-tight">Related guides</h2>
          <p className="mt-1 text-sm text-ink-soft">Easily confused with this concern — compare the angles.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/advice/${r.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-sage-50 px-4 py-2 text-sm font-semibold text-sage-700 transition hover:bg-sage-100"
              >
                {r.title} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ))}
          </div>
        </div>
      )}

      <Link
        href="/advice"
        className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-sage-700 hover:underline"
      >
        Explore all concerns <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  );
}
