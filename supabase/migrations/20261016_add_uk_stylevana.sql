-- Preview-only additive migration (2026-10-16): Amazon UK + Stylevana links.
-- Run manually in Supabase Dashboard → SQL Editor. Do NOT run on prod
-- without explicit approval. All statements are IF NOT EXISTS / additive,
-- no backfill, no NOT NULL, Olive Young untouched.
--
-- 1) Two new nullable columns on products (null = button hidden).
alter table public.products add column if not exists amazon_uk_url text;
alter table public.products add column if not exists stylevana_url text;

-- 2) Widen product_clicks.source check additively (no data rewrite).
-- Uses NOT VALID + VALIDATE to avoid a full table scan lock on live traffic.
do $$
begin
  -- Drop the legacy two-value check if present (auto-named inline check).
  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.product_clicks'::regclass
      and conname = 'product_clicks_source_check'
  ) then
    alter table public.product_clicks drop constraint product_clicks_source_check;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.product_clicks'::regclass
      and conname = 'product_clicks_source_check_v2'
  ) then
    alter table public.product_clicks
      add constraint product_clicks_source_check_v2
      check (source in ('amazon', 'oliveyoung', 'amazon_uk', 'stylevana'))
      not valid;
    alter table public.product_clicks validate constraint product_clicks_source_check_v2;
  end if;
end $$;
