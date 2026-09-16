import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { MOCK_ADMIN_COOKIE } from "@/app/api/mock-login/route";
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

  const isEntryPage = pathname === ADMIN_ENTRY_PATH;
  if (!pathname.startsWith("/admin") && !isEntryPage) return NextResponse.next();

  const isLoginPage = pathname === "/admin/login";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Unauthenticated admin traffic is bounced to the homepage (302) rather
  // than to the login page, so /admin/* (including /admin/login) never
  // renders publicly. Authenticated staff reach the dashboard / login page.
  // The unlisted staff entry page follows the same rule: unauthenticated
  // hits bounce, authenticated staff see the entry page.
  const bounce = () => NextResponse.redirect(new URL("/", req.url), 302);

  // Security monitoring: log every hit on the unlisted entry (authed or not).
  const logEntry = (authenticated: boolean) =>
    console.log(`[admin-entry] ${new Date().toISOString()} path=${pathname} authenticated=${authenticated}`);

  // ── Mock mode (no Supabase configured): cookie session ──
  if (!url || !anon) {
    const isMockAdmin = req.cookies.get(MOCK_ADMIN_COOKIE)?.value === "1";
    if (isEntryPage) {
      logEntry(isMockAdmin);
      return isMockAdmin ? NextResponse.next() : bounce();
    }
    if (!isMockAdmin) return bounce();
    if (isLoginPage) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.next();
  }

  // ── Supabase mode: every /admin/* route requires a session ──
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
    return user ? NextResponse.next() : bounce();
  }
  if (!user) return bounce();
  if (isLoginPage) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }
  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/product/:slug*", "/beautynest-entry-2026-sable-heron-47"],
};
