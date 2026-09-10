# BeautyNestKorea — Affiliate K-Beauty Store

Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + Supabase + React Hook Form + Zod + Lucide.

## Quick start

```bash
npm install
cp .env.local.example .env.local   # fill in Supabase keys
npm run dev                        # http://localhost:3000
```

Works **without** Supabase too — falls back to mock catalog in `src/lib/data/products.ts`.
Dev admin bypass (mock mode only): `admin@beautynestkorea.com` / `admin123`.

## Supabase setup (required for production)

1. Create project at supabase.com → copy URL + anon key into `.env.local`.
2. SQL Editor → run `supabase/schema.sql` (products, admin_users, product_clicks, RLS, seed data).
3. Storage → create public bucket `product-images` (policies are in schema.sql comments).
4. Authentication → Add user (your admin email) → copy UUID → insert into `admin_users`:
   ```sql
   insert into public.admin_users (id, email) values ('<uuid>', 'you@domain.com');
   ```

## Routes

| Route | Description |
|---|---|
| `/` | Hero, Shop by Concern, Featured, Blog teaser |
| `/shop` | Filters: brand, concern, price, source (Amazon/Olive Young), sort |
| `/product/[slug]` | Gallery, ingredients, dual CTA (Amazon + Olive Young), FAQ SEO |
| `/blog`, `/blog/[slug]` | SEO advice content |
| `/admin/login` | Supabase Auth login |
| `/admin` | Overview: products, clicks |
| `/admin/products`, `/new`, `/[id]/edit` | Full CRUD via Server Actions |
| `/api/track-click` | Logs affiliate clicks to `product_clicks` |

## Design

Sage green + blush pink + cream, Playfair Display headings + Inter body, glassmorphism cards (`glass`, `glass-strong` in `globals.css`).

## Deploy to Vercel (free)

1. Push this repo to GitHub (see below).
2. Go to [vercel.com](https://vercel.com) → **Add New → Project** → Import your repo.
3. Keep defaults: Framework **Next.js**, Build Command `next build`, Output `.next`.
4. Open **Environment Variables** and add (all three, scope: Production):
   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://wlbsswmkoahjzentukns.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your `sb_publishable_...` key |
   | `NEXT_PUBLIC_SITE_URL` | your live URL, e.g. `https://beautynestkorea.vercel.app` (update after first deploy) |
5. **Deploy.** Vercel gives you a free `*.vercel.app` URL.
6. Back in Supabase: Authentication → URL Configuration → add the Vercel URL to **Redirect URLs** (needed for admin login sessions).

> Never commit `.env.local` — it's gitignored (`.gitignore` → `.env*`). Production keys live only in Vercel → Project → Settings → Environment Variables.

## Push to GitHub (first time)

```bash
git add -A
git commit -m "Launch BeautyNestKorea storefront + admin"
git remote add origin https://github.com/YOUR_USERNAME/beautynestkorea.git
git branch -M main
git push -u origin main
```

Then on every change: `git add -A && git commit -m "..." && git push` — Vercel auto-redeploys.
