-- Correct the malformed La Roche-Posay slug (missing leading "l").
-- The old URL gets a literal 301 from next.config.ts.
-- No FK depends on slug (reviews/clicks use product_id), so this is safe.

-- 1) Pre-check: must return exactly one row (the old slug).
select slug
from public.products
where slug in (
  'a-roche-posay-toleriane-hydrating-gentle-facial-cleanser',
  'la-roche-posay-toleriane-hydrating-gentle-facial-cleanser'
);

-- 2) Update.
update public.products
set slug = 'la-roche-posay-toleriane-hydrating-gentle-facial-cleanser'
where slug = 'a-roche-posay-toleriane-hydrating-gentle-facial-cleanser';

-- 3) Verification: expect only the corrected slug.
select slug
from public.products
where slug like '%roche-posay-toleriane%';
