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

  // ── Mock mode (no Supabase configured): cookie session ──
  if (!url || !anon) {
    const isMockAdmin = req.cookies.get(MOCK_ADMIN_COOKIE)?.value === "1";
    if (isEntryPage) {
      logEntry(isMockAdmin);
      return isMockAdmin ? toAdmin() : NextResponse.next();
    }
    if (!isMockAdmin) return toLogin();
    return NextResponse.next();
  }

  // ── Supabase mode: sessions required except on public auth pages ──
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
  matcher: ["/admin/:path*", "/product/:slug*", "/beautynest-entry-2026-sable-heron-47"],
};
