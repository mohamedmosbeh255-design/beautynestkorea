# GOLDEN RULE — price_checked_at full-date display (NON-NEGOTIABLE)

Owner-verified working on production 2026-09-26. Any regression here is a
business-critical bug. Read this before ANY deploy, refactor, or date-related edit.

## 1. THE GOLDEN RULE FOR DATES
Any deployment or code change MUST preserve the full date format
(Day + Month + Year, e.g. "Sep 24, 2026") for the `price_checked_at` field.
Never revert to Month/Year only (e.g. "September 2026").

## 2. FORMATTER LOCK
`formatPriceCheckedFull` (in `src/app/product/[slug]/page.tsx` for the detail
page, and in `src/components/ProductCard.tsx` for all cards/listings) MUST
ALWAYS include `day: 'numeric'` in its locale options:

```ts
d.toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
```

Do NOT "unify" these into the shared month-year `formatPriceChecked`
(`src/lib/utils.ts`) — that formatter is intentionally month-year only and
feeds the "Where to buy" snapshot. Do NOT touch it.

## 3. DEPLOYMENT CHECK (mandatory before every production deploy)
- [ ] `git diff --name-only` contains ONLY intended files.
- [ ] Both `formatPriceCheckedFull` definitions still contain `day: 'numeric'`.
- [ ] No git-triggered auto-deploy can silently supersede a CLI deploy: the
  fix has lived in the working tree before — if production is ever rebuilt
  from git without these changes, the live site regresses to month-year.
  Commit/push the formatter files OR redeploy from the working tree that
  contains them, then curl-verify
  `/product/skin1004-madagascar-centella-double-cleansing-duo` shows
  "Sep 24, 2026".

## 4. NEVER (still binding)
- Never backfill, guess, or copy `price_checked_at` for the 35 dateless
  products. Never use `updated_at` as a substitute.
- Null/empty `price_checked_at` → dateless fallback, exactly as today.
