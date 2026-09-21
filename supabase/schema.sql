-- BeautyNestKorea Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─── products ──────────────────────────────────────────────
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  brand text not null,
  description text not null,
  price numeric(10,2) not null default 0,
  compare_at_price numeric(10,2),
  currency text not null default '$',
  category text not null,
  concern text[] not null default '{}',
  skin_type text[] not null default '{}',
  key_ingredients text[] not null default '{}',
  image_urls text[] not null default '{}',
  amazon_url text,
  oliveyoung_url text,
  amazon_asin text, -- bare ASIN (B0…) for dynamic ?tag= link building; NULL = use amazon_url verbatim
  rating numeric(2,1) default 4.5,
  review_count integer default 0,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
  before update on public.products
  for each row execute function public.handle_updated_at();

-- Indexes
create index if not exists idx_products_slug on public.products (slug);
create index if not exists idx_products_brand on public.products (brand);
create index if not exists idx_products_category on public.products (category);
create index if not exists idx_products_featured on public.products (is_featured) where is_featured = true;
create index if not exists idx_products_active on public.products (is_active) where is_active = true;

-- ASIN builder column (added 2026-09-19): bare ASIN for dynamic ?tag= links.
-- Run on existing databases; fresh creates get it from the table def above.
alter table public.products add column if not exists amazon_asin text;

-- Price provenance (added 2026-09-21): verified price-check timestamp.
-- NULL = collection date unknown → the storefront hides the price block
-- entirely. Never backfill from updated_at (that tracks edits, not checks).
alter table public.products add column if not exists price_checked_at timestamptz;

-- ─── categories ────────────────────────────────────────────
-- Concern/category catalog (Acne, Hydration, ...). The storefront derives
-- "Shop by Concern" cards from product data, so new concerns added on
-- products appear automatically; this table organizes them + powers future
-- category landing pages.
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  slug text unique not null,
  description text,
  image_url text,
  created_at timestamptz not null default now()
);

-- ─── admin_users ───────────────────────────────────────────
create table if not exists public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  created_at timestamptz not null default now()
);

-- ─── product_clicks (affiliate click tracking) ─────────────
create table if not exists public.product_clicks (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  source text not null check (source in ('amazon', 'oliveyoung')),
  clicked_at timestamptz not null default now(),
  referrer text,
  user_agent text
);
create index if not exists idx_clicks_product on public.product_clicks (product_id);
create index if not exists idx_clicks_date on public.product_clicks (clicked_at desc);

-- ─── Row Level Security ────────────────────────────────────
alter table public.products enable row level security;
alter table public.categories enable row level security;
alter table public.admin_users enable row level security;
alter table public.product_clicks enable row level security;

-- Public can read active products
drop policy if exists "Public read active products" on public.products;
create policy "Public read active products"
  on public.products for select
  to anon, authenticated
  using (is_active = true);

-- Only admins (service role bypasses RLS) — authenticated admins manage via server actions with service role.
-- For simplicity, allow authenticated users who exist in admin_users to write:
drop policy if exists "Admins full access products" on public.products;
create policy "Admins full access products"
  on public.products for all
  to authenticated
  using (exists (select 1 from public.admin_users where admin_users.id = auth.uid()))
  with check (exists (select 1 from public.admin_users where admin_users.id = auth.uid()));

drop policy if exists "Admins read admin_users" on public.admin_users;
create policy "Admins read admin_users"
  on public.admin_users for select
  to authenticated
  using (admin_users.id = auth.uid());

drop policy if exists "Anyone can log clicks" on public.product_clicks;
create policy "Anyone can log clicks"
  on public.product_clicks for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Admins read clicks" on public.product_clicks;
create policy "Admins read clicks"
  on public.product_clicks for select
  to authenticated
  using (exists (select 1 from public.admin_users where admin_users.id = auth.uid()));

-- Categories: public read, admins write
drop policy if exists "Public read categories" on public.categories;
create policy "Public read categories"
  on public.categories for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins full access categories" on public.categories;
create policy "Admins full access categories"
  on public.categories for all
  to authenticated
  using (exists (select 1 from public.admin_users where admin_users.id = auth.uid()))
  with check (exists (select 1 from public.admin_users where admin_users.id = auth.uid()));

-- ─── Storage bucket for product images ─────────────────────
-- Run in dashboard or via SQL:
-- insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true)
-- on conflict (id) do nothing;
--
-- create policy "Public read product images"
--   on storage.objects for select to anon, authenticated using (bucket_id = 'product-images');
-- create policy "Admins upload product images"
--   on storage.objects for insert to authenticated
--   with check (bucket_id = 'product-images' and exists (select 1 from public.admin_users where admin_users.id = auth.uid()));

-- ─── Seed data (optional) ──────────────────────────────────
-- Live-catalog insert for the Arencia Vitamin C serum (conflict-safe;
-- mirrors the Admin-panel row so fresh databases surface it on day one).
insert into public.products (slug, title, brand, description, price, compare_at_price, category, concern, skin_type, key_ingredients, image_urls, amazon_url, amazon_asin, oliveyoung_url, rating, review_count, is_featured, price_checked_at)
values
  ('arencia-vitamin-c-booster-shot', 'Vitamin C Booster Shot Serum 30ml', 'Arencia', 'Brightening booster serum with vitamin C, glutathione, niacinamide and vitamin E. Made to improve the look of dark spots and fine lines while supporting a glass-skin glow. 30ml bottle.', 22.00, null, 'Serum', '{Brightening,Anti-aging,Hydration}', '{All}', '{Vitamin C,Glutathione,Niacinamide,Vitamin E}', '{https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?w=800&q=80,https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=800&q=80}', 'https://www.amazon.com/dp/B0FX418XT8', 'B0FX418XT8', 'https://global.oliveyoung.com/product/detail?prdtNo=GA260439702', 4.4, 3866, true, '2026-09-21T12:00:00+00')
on conflict (slug) do nothing;

insert into public.products (slug, title, brand, description, price, compare_at_price, category, concern, skin_type, key_ingredients, image_urls, amazon_url, oliveyoung_url, rating, review_count, is_featured)
values
  ('beauty-of-joseon-relief-sun', 'Relief Sun : Rice + Probiotics SPF50+', 'Beauty of Joseon', 'A lightweight organic sunscreen with rice extract and grain probiotics that hydrates while protecting. No white cast, perfect under makeup.', 18.00, 22.00, 'Sunscreen', '{Hydration,Brightening,Sensitive}', '{All,Sensitive,Dry}', '{Rice Extract,Probiotics,Niacinamide}', '{https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80}', 'https://www.amazon.com/s?k=beauty+of+joseon+relief+sun', 'https://www.oliveyoung.com/', 4.8, 12400, true),
  ('cosrx-snail-96-mucin', 'Advanced Snail 96 Mucin Power Essence', 'COSRX', 'Cult-favorite essence with 96.3% snail secretion filtrate to repair, hydrate and plump skin. Fades acne scars and boosts glow.', 17.50, 25.00, 'Serum', '{Acne,Hydration,Anti-aging}', '{All,Oily,Combination}', '{Snail Mucin,Hyaluronic Acid,Panthenol}', '{https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80}', 'https://www.amazon.com/s?k=cosrx+snail+mucin', 'https://www.oliveyoung.com/', 4.7, 28900, true),
  ('anua-heartleaf-toner', 'Heartleaf 77% Soothing Toner', 'Anua', 'Calming toner with 77% heartleaf extract that soothes redness, balances oil and preps skin. A must for acne-prone routines.', 15.00, 20.00, 'Toner', '{Acne,Sensitive,Pores}', '{Oily,Combination,Sensitive}', '{Heartleaf,Centella,Panthenol}', '{https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800&q=80}', 'https://www.amazon.com/s?k=anua+heartleaf+toner', 'https://www.oliveyoung.com/', 4.6, 15200, true)
on conflict (slug) do nothing;

insert into public.categories (name, slug, description) values
  ('Acne', 'acne', 'Calm breakouts, fade marks'),
  ('Anti-aging', 'anti-aging', 'Firm, smooth & glow'),
  ('Hydration', 'hydration', 'Glass-skin moisture'),
  ('Brightening', 'brightening', 'Fade dark spots, glow'),
  ('Sensitive', 'sensitive', 'Gentle, barrier-first'),
  ('Pores', 'pores', 'Refine & balance oil')
on conflict (slug) do nothing;

-- ─── Admin bootstrap (run AFTER creating your auth user) ─────
-- 1. Supabase Dashboard → Authentication → Users → Add user (email + password).
--    If "Confirm email" is on in Auth → Providers → Email, confirm the user
--    (open the user → Confirm email) or turn confirmation off.
-- 2. Copy the user's UUID, then run:
-- insert into public.admin_users (id, email, full_name)
-- values ('PASTE-UUID-HERE', 'you@domain.com', 'Store Admin')
-- on conflict (id) do nothing;
