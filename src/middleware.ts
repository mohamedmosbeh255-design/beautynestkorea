import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getRetiredRedirect } from "@/lib/retired-slugs";
import { ADMIN_ENTRY_PATH } from "@/lib/admin-entry";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Retired catalog slugs → closest live product with a literal 301
  // (mirrors the next.config.ts permanent redirects; middleware runs first).
  const productMatch = pathname.match(/^\/product\/([a-z0-9-]+)\/?$/);
  if (productMatch) {
    const destination = getRetiredRedirect(productMatch[1]);
    if (destination) {
      return NextResponse.redirect(new URL(`/product/${destination}`, req.url), 301);
    }
  }

  // 301 /shop?concern=<Name> → canonical /category/<slug>.
  // Only the 20 canonical concerns (plus the 3 legacy aliases already
  // redirected at /category/*) are redirected — unknown values keep the
  // previous "show all products" behaviour instead of becoming a 404.
  if (pathname === "/shop") {
    const raw = req.nextUrl.searchParams.get("concern");
    if (raw) {
      const ALIASES: Record<string, string> = {
        sensitive: "sensitive-skin",
        elasticity: "anti-aging",
        firming: "anti-aging",
      };
      const slug = raw.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      const target = ALIASES[slug] ?? slug;
      const CANONICAL = new Set([
        "acne", "anti-aging", "barrier-repair", "blackheads", "brightening",
        "dark-circles", "dehydration", "dryness", "dullness", "fine-lines",
        "hydration", "hyperpigmentation", "loss-of-elasticity", "oiliness",
        "pores", "redness", "sensitive-skin", "sun-protection",
        "uneven-texture", "wrinkles",
      ]);
      if (CANONICAL.has(target)) {
        const url = req.nextUrl.clone();
        url.pathname = `/category/${target}`;
        url.search = "";
        return NextResponse.redirect(url, 301);
      }
    }
  }

  const isEntryPage = pathname === ADMIN_ENTRY_PATH;
  if (!pathname.startsWith("/admin") && !isEntryPage) return NextResponse.next();

  const isLoginPage = pathname === "/admin/login";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // /admin/login is PUBLIC — the sign-in form must stay reachable while
  // logged out, otherwise nobody can sign in through the site.
  if (isLoginPage) return NextResponse.next();

  // Protected /admin/* bounces logged-out visitors to the login form —
  // never to home, so staff can always reach the sign-in. The unlisted
  // entry page stays public too: logged-out staff see it (button to
  // /admin/login), signed-in staff skip straight to the dashboard.
  const toLogin = () => NextResponse.redirect(new URL("/admin/login", req.url), 302);
  const toAdmin = () => NextResponse.redirect(new URL("/admin", req.url), 302);

  // Security monitoring: log every hit on the unlisted entry (authed or not).
  const logEntry = (authenticated: boolean) =>
    console.log(`[admin-entry] ${new Date().toISOString()} path=${pathname} authenticated=${authenticated}`);

  // Sessions required except on public auth pages.
  // Mock mode (cookie session) has been removed — there are no hardcoded
  // credentials left in the codebase. If Supabase env is unset, the
  // middleware simply bounces unauthenticated admin hits to the login
  // page instead of serving a guessable fallback.
  if (!url || !anon) {
    if (isEntryPage) {
      logEntry(false);
    }
    return toLogin();
  }

  const res = NextResponse.next();
  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (isEntryPage) {
    logEntry(Boolean(user));
    return user ? toAdmin() : NextResponse.next();
  }
  if (!user) return toLogin();
  return res;
}

export const config = {
  matcher: ["/shop", "/admin/:path*", "/product/:slug*", "/beautynest-entry-2026-sable-heron-47"],
};
