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

## Image policy (locked — do not re-host retailer images)

(a) **Own photos are the default.** Every product image on the site is shot by the owner.
User-shot photos are the *only* product assets uploaded to Supabase Storage
(`product-images` bucket) or Vercel. A product with no own photo yet shows a
neutral "photo coming soon" placeholder while its shop buttons keep linking out.

(b) **Retailer images are hotlinked, never re-hosted.** Images served from
`m.media-amazon.com` or the Olive Young CDN (`*.oliveyoung.com`,
`image.oliveyoung.co.kr`) must never be downloaded, cropped, edited,
screenshotted, copied, or re-hosted — on Supabase Storage, Vercel, or anywhere
else. The one-off migration script that did this has been permanently deleted.

(c) **Hotlinking is a documented fallback with limits.** A hotlinked retailer
image is allowed only as a fallback (never the default), only under the
retailer's affiliate terms: served from the retailer's own CDN, always wrapped
in a link to the related product detail page with
`rel="nofollow sponsored noopener"`, never used for Amazon customer-review text
or star ratings, and never used in email / PDF / print / offline promotion.
The license is limited and revocable.

(d) **Self-created assets stay self-hosted.** Hero images, logo, OG images and
brand graphics are made by the owner and live in `public/` or Supabase
`site-assets`. Retailer-sourced images use a plain `<img>` with explicit
width/height and `loading="lazy"` (no proxy transformation); `next/image`
optimization stays reserved for self-hosted assets.

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
