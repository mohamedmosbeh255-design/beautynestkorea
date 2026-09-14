import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, FlaskConical, Scale, HeartHandshake, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "About BeautyNestKorea",
  description:
    "Our honest K-beauty curation story: how we test and compare products across Amazon and Olive Young, and our mission for glass skin for everyone.",
};

const steps = [
  {
    icon: FlaskConical,
    title: "We test like a routine, not a haul",
    desc: "We wear-test textures, layering order, white cast, scent and finish across skin types — dry, oily, sensitive and acne-prone — before anything earns a recommendation.",
  },
  {
    icon: Scale,
    title: "We compare Amazon vs Olive Young",
    desc: "Every product is price-checked on both Amazon and Olive Young so you can pick the cheaper, faster or more authentic option. Prices shift, so we link both and let you decide.",
  },
  {
    icon: HeartHandshake,
    title: "We keep it honest",
    desc: "If a viral serum pills under sunscreen or a moisturizer breaks out sensitive skin, we say so. No paid placements decide our picks — only formula, fit and value.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-sage-600">Our story</p>
      <h1 className="font-serif-display mt-2 text-4xl font-bold tracking-tight">
        About BeautyNestKorea
      </h1>
      <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">
        Honest, curated K-beauty & global skincare — without the 10-tab confusion.
        We started BeautyNestKorea because great Korean skincare deserved better than
        hype lists and mystery markups.
      </p>

      <div className="glass mt-8 rounded-[2rem] p-8 sm:p-12">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3.5 py-1.5 text-xs font-semibold text-sage-700 shadow-sm">
          <Sparkles className="h-3.5 w-3.5" /> Glass skin for everyone
        </span>
        <h2 className="font-serif-display mt-4 text-2xl font-bold sm:text-3xl">
          Our mission: glow that is simple, affordable and real
        </h2>
        <p className="mt-4 max-w-3xl leading-relaxed text-ink-soft">
          K-beauty works best when it is personal. Our mission is to help every skin
          type — from barrier-damaged to breakout-prone — build a minimal routine
          that actually sticks. That means fewer, better products, clear ingredient
          callouts, and routines for morning and night you can follow without a
          chemistry degree.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {["Ingredients first, marketing last", "Sensitive skin always considered", "Budget-friendly alternatives"].map(
            (t) => (
              <div key={t} className="rounded-2xl bg-white/70 p-5 text-sm font-semibold">
                {t}
              </div>
            )
          )}
        </div>
      </div>

      <div className="mt-10">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blush-500">
          How we curate
        </p>
        <h2 className="font-serif-display mt-2 text-3xl font-bold tracking-tight">
          How we test & compare
        </h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass rounded-3xl p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sage-100 text-sage-700">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="font-serif-display mt-4 text-lg font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-sm font-bold text-white shadow-xl transition hover:bg-sage-700"
        >
          Shop our bestsellers <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/advice"
          className="glass inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold transition hover:bg-white/80"
        >
          Read skincare advice
        </Link>
      </div>
    </div>
  );
}
