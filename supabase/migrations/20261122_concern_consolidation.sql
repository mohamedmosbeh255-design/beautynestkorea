-- Package 3 — concern taxonomy cleanup.
-- 1) Unify skin-concern labels (Sensitive/Sensitivity → Sensitive Skin,
--    Dry Skin → Dryness, Oiliness → Oily Skin) while preserving array order.
-- 2) Drop 'Global Skincare' from concern[]: the collection is derived at read
--    time from the brand whitelist (src/lib/concerns.ts), so nothing is lost.
-- 3) Remove unsupported 'Wrinkles'/'Fine Lines' from Paula's Choice 2% BHA.
-- Idempotent: re-running changes nothing. Run in Supabase SQL Editor.

begin;

-- 1) Label consolidation (order-preserving; no duplicates introduced).
update public.products
set concern = (
  select array_agg(
    case
      when c in ('Sensitive', 'Sensitivity') then 'Sensitive Skin'
      when c = 'Dry Skin'                  then 'Dryness'
      when c = 'Oiliness'                  then 'Oily Skin'
      else c
    end
    order by ord
  )
  from unnest(concern) with ordinality as t(c, ord)
)
where concern && array['Sensitive', 'Sensitivity', 'Dry Skin', 'Oiliness'];

-- 2) Collection tag out of the skin-concern array (brand-derived membership).
update public.products
set concern = array_remove(concern, 'Global Skincare')
where 'Global Skincare' = any (concern);

-- 3) Paula's Choice BHA: no wrinkle claims.
update public.products
set concern = array_remove(array_remove(concern, 'Wrinkles'), 'Fine Lines')
where slug = 'paulas-choice-2-bha-liquid-exfoliant';

commit;

-- Verification (expect 0 rows / expected counts).
select count(*) as legacy_rows
from public.products
where concern && array['Sensitive', 'Sensitivity', 'Dry Skin', 'Oiliness', 'Global Skincare'];

select concern from public.products
where slug = 'paulas-choice-2-bha-liquid-exfoliant';

select tag, count(*)
from public.products, unnest(concern) as tag
where is_active
  and tag in ('Sensitive Skin', 'Dryness', 'Oily Skin')
group by tag;

select slug from public.products where cardinality(concern) = 0;
