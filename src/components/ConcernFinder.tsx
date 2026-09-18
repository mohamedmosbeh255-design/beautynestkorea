"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Compass, ArrowRight } from "lucide-react";

const CONCERNS = [
  { slug: "acne", label: "Breakouts / acne" },
  { slug: "hyperpigmentation-dark-spots", label: "Dark spots" },
  { slug: "dehydration", label: "Dehydration" },
  { slug: "anti-aging-fine-lines", label: "Fine lines" },
  { slug: "sensitive-skin-redness", label: "Redness / sensitivity" },
  { slug: "enlarged-pores", label: "Visible pores" },
  { slug: "blackheads", label: "Blackheads" },
  { slug: "dull-skin", label: "Dullness" },
  { slug: "damaged-skin-barrier", label: "Damaged barrier" },
  { slug: "oily-skin-sebum-control", label: "Oiliness / shine" },
];

const SKIN_TYPES = ["Oily", "Dry", "Sensitive", "Combination"] as const;

const GOALS = [
  { value: "", label: "Pick a goal…" },
  { value: "acne", label: "Fewer breakouts" },
  { value: "hyperpigmentation-dark-spots", label: "Fade dark spots" },
  { value: "dehydration", label: "Deep hydration" },
  { value: "anti-aging-fine-lines", label: "Softer fine lines" },
  { value: "sensitive-skin-redness", label: "Calm redness" },
  { value: "enlarged-pores", label: "Smoother-looking pores" },
  { value: "blackheads", label: "Clearer blackheads" },
  { value: "dull-skin", label: "More radiance" },
  { value: "damaged-skin-barrier", label: "Repair my barrier" },
  { value: "oily-skin-sebum-control", label: "Control shine" },
];

const SKIN_TIPS: Record<string, string> = {
  Oily: "Tip for oily skin: prefer lightweight gel textures and skip heavy occlusives.",
  Dry: "Tip for dry skin: layer humectants under a richer moisturizer.",
  Sensitive: "Tip for sensitive skin: patch-test every new product before full-face use.",
  Combination: "Tip for combination skin: zone-treat — light on the T-zone, richer on cheeks.",
};

/** 3-question concern finder → deep-links to the matching concern guide. */
export default function ConcernFinder() {
  const [concern, setConcern] = useState(CONCERNS[0].slug);
  const [skinType, setSkinType] = useState<string>("");
  const [goal, setGoal] = useState<string>("");

  const target = useMemo(() => {
    if (goal) return CONCERNS.find((c) => c.slug === goal) ?? CONCERNS[0];
    return CONCERNS.find((c) => c.slug === concern) ?? CONCERNS[0];
  }, [concern, goal]);

  const select =
    "w-full rounded-xl border border-sage-100 bg-white/85 px-3 py-2.5 text-sm outline-none focus:border-sage-400";

  return (
    <div className="glass mt-8 rounded-[2rem] p-6 sm:p-8">
      <h2 className="font-serif-display flex items-center gap-2 text-xl font-bold sm:text-2xl">
        <Compass className="h-5 w-5 text-sage-600" /> Find your concern in 3 questions
      </h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-soft">
            1 · Main concern
          </label>
          <select value={concern} onChange={(e) => setConcern(e.target.value)} className={select}>
            {CONCERNS.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-soft">
            2 · Skin type
          </label>
          <select value={skinType} onChange={(e) => setSkinType(e.target.value)} className={select}>
            <option value="">Pick a skin type…</option>
            {SKIN_TYPES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-soft">
            3 · Goal
          </label>
          <select value={goal} onChange={(e) => setGoal(e.target.value)} className={select}>
            {GOALS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Link
          href={`/advice/${target.slug}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sage-700"
        >
          Open your guide <ArrowRight className="h-4 w-4" />
        </Link>
        {skinType && SKIN_TIPS[skinType] && (
          <p className="text-sm text-ink-soft">{SKIN_TIPS[skinType]}</p>
        )}
      </div>
    </div>
  );
}
