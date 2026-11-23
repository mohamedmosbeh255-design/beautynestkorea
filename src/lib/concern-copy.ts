/**
 * Hand-written category copy. Keys are canonical /category/<slug> slugs; any
 * concern without an entry (including Global Skincare, which keeps its own
 * special-cased copy in the page) falls back to the generic sentence.
 * Titles are intentionally NOT changed — only the meta description and the
 * visible intro paragraph come from this map.
 */
export const CONCERN_COPY: Record<string, { description: string; intro: string }> = {
  "hair-scalp-care": {
    description:
      "Korean scalp rituals and global hair essentials — gentle cleansers, scalp toners and treatments for a healthier-looking scalp.",
    intro:
      "A healthy scalp is the foundation for healthy-looking hair. These picks pair Korean scalp rituals — gentle cleansing, soothing toners and lightweight treatments — with trusted global essentials.",
  },
  "anti-aging": {
    description:
      "Firm-looking skin without the hype: retinoids, peptides and barrier-first moisturizers for fine lines and elasticity.",
    intro:
      "Firmer-looking skin comes from consistency, sunscreen and a tolerable retinoid — not ten steps. These picks cover gentle retinal, peptide serums and barrier creams that pair safely.",
  },
  hydration: {
    description:
      "Layered hydration for a glass-skin finish: toners, essences, serums and creams that hold water without heaviness.",
    intro:
      "Dehydrated skin needs water first, then a seal. Start with a hydrating toner or essence, follow with a serum, and lock it in with a moisturizer suited to your skin type.",
  },
  brightening: {
    description:
      "Even-looking tone and glow with vitamin C, niacinamide, tranexamic acid and gentle exfoliants — strength notes included.",
    intro:
      "Brightening is slow, cumulative work. These picks target dullness and uneven tone; pair any active with daily SPF or the effort reverses.",
  },
  pores: {
    description:
      "Refine the look of enlarged pores with BHA, niacinamide and lightweight hydration that will not clog.",
    intro:
      "Pore size is genetic, but the look of them responds to oil control and exfoliation. Introduce one BHA or niacinamide product at a time and keep moisturizer in the routine.",
  },
  acne: {
    description:
      "Gentle, evidence-informed picks for clogged pores and blemishes — plus barrier support so actives stay tolerable.",
    intro:
      "Acne routines fail when they irritate. These picks combine salicylic acid, azelaic acid and retinoids with soothing, non-comedogenic hydration.",
  },
  "sensitive-skin": {
    description:
      "Fragrance-free, barrier-first formulas for reactive skin, with patch-test guidance before you commit.",
    intro:
      "Reactive skin does best with fewer products and simpler formulas. These picks skip fragrance and drying alcohol where possible; patch-test anything new.",
  },
  dryness: {
    description:
      "Rich moisturizers, occlusives and gentle cleansers for tight, flaky or winter-dry skin.",
    intro:
      "Dry skin lacks oil, not just water. These picks pair humectants with ceramides and occlusives so moisture stays in through cold weather and indoor heating.",
  },
  "barrier-repair": {
    description:
      "Ceramides, panthenol and occlusives that support a compromised moisture barrier.",
    intro:
      "A stressed barrier feels tight, stings and flakes. These picks focus on ceramides, panthenol and petrolatum — and fewer actives while skin recovers.",
  },
  "sun-protection": {
    description:
      "Daily broad-spectrum SPF for every skin type, including no-white-cast Korean formulas.",
    intro:
      "Sunscreen is the one step that protects every other result. These picks cover mineral, chemical and hybrid filters, with texture notes for oily and dry skin.",
  },
  redness: {
    description:
      "Soothing formulas with centella, azelaic acid and panthenol for the look of redness.",
    intro:
      "Persistent redness deserves a dermatologist's opinion. For everyday flushing and post-blemish redness, these picks focus on calming ingredients and a gentle routine.",
  },
  blackheads: {
    description:
      "BHA and clay-based picks that help clear the look of congested pores without stripping.",
    intro:
      "Blackheads are oxidized plugs, not dirt. Salicylic acid and consistent cleansing help; harsh scrubs and pore strips usually make the look worse.",
  },
  hyperpigmentation: {
    description:
      "Target the look of dark spots with vitamin C, tranexamic acid, niacinamide and daily SPF.",
    intro:
      "Pigmentation fades slowly and only with sun protection. These picks combine brightening actives with formulas gentle enough for regular use.",
  },
  "oily-skin": {
    description:
      "Lightweight hydration and oil-balancing actives that will not leave skin tight.",
    intro:
      "Oily skin still needs moisture. These picks favour gel textures, niacinamide and gentle foaming cleansers over stripping, alcohol-heavy products.",
  },
  "uneven-texture": {
    description:
      "Exfoliants and smoothing treatments for rough patches and uneven-looking texture.",
    intro:
      "Texture improves with gentle, regular exfoliation — not scrubbing. These picks include AHA/BHA options and soothing partners to keep the barrier comfortable.",
  },
  dehydration: {
    description:
      "Water-first hydration for skin that looks dull and feels tight after cleansing.",
    intro:
      "Dehydration is a lack of water, not oil. Layer a hydrating toner or essence, then seal it with a moisturizer suited to your skin type.",
  },
  dullness: {
    description:
      "Brightening toners, essences and masks for tired-looking, dull skin.",
    intro:
      "Dullness often follows dehydration and dead-cell buildup. These picks combine gentle hydration with brightening ingredients and mild exfoliation.",
  },
  blemishes: {
    description:
      "Spot-friendly picks for occasional blemishes, with barrier support built in.",
    intro:
      "Occasional blemishes need targeted care, not a whole new routine. Use one active at a time and keep the rest of the routine calming.",
  },
  "dark-circles": {
    description:
      "Eye-area picks with caffeine, peptides and hydration for the look of tired eyes.",
    intro:
      "Dark circles have several causes, and cosmetics can only do so much. These picks focus on hydration, peptides and a gentle eye-area routine.",
  },
  "loss-of-elasticity": {
    description:
      "Peptide and collagen-focused picks for firmer-looking, bouncier skin.",
    intro:
      "Elasticity claims are easy to overstate. These picks focus on peptides, collagen and consistent hydration — with sunscreen doing the heavy lifting.",
  },
  "normal-skin": {
    description:
      "Maintenance picks for balanced skin that just needs consistency.",
    intro:
      "Balanced skin needs less, not more. These picks keep cleansing gentle, hydration steady and SPF daily.",
  },
  "post-acne-marks": {
    description:
      "Fade the look of post-blemish marks with azelaic acid, niacinamide and daily SPF.",
    intro:
      "Post-acne marks fade with time and sun protection. These picks target the look of leftover redness and pigmentation without irritating active acne.",
  },
  whiteheads: {
    description:
      "Gentle exfoliation and oil control for the look of closed, congested pores.",
    intro:
      "Whiteheads are closed plugs. Salicylic acid, consistent cleansing and non-comedogenic moisture help; picking at them does not.",
  },
};
