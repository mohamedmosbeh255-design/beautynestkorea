-- Correct the live brand typo on the First Aid Beauty row.
-- Safe: one row, display/filter/JSON-LD only, no URL or slug change.
-- The read-time Global Skincare membership still resolves because
-- src/lib/concerns.ts already contains the clean key "firstaidbeauty".

update public.products
set brand = 'First Aid Beauty'
where slug = 'first-aid-beauty-ultra-repair-cream'
  and brand = 'First Aid Beautyv';

-- Verification: expect brand = 'First Aid Beauty'
select slug, brand
from public.products
where slug = 'first-aid-beauty-ultra-repair-cream';
