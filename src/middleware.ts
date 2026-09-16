import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { MOCK_ADMIN_COOKIE } from "@/app/api/mock-login/route";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/admin")) return NextResponse.next();

  const isLoginPage = pathname === "/admin/login";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Unauthenticated admin traffic is bounced to the homepage (302) rather
  // than to the login page, so /admin/* (including /admin/login) never
  // renders publicly. Authenticated staff reach the dashboard / login page.
  const bounce = () => NextResponse.redirect(new URL("/", req.url), 302);

  // ── Mock mode (no Supabase configured): cookie session ──
  if (!url || !anon) {
    const isMockAdmin = req.cookies.get(MOCK_ADMIN_COOKIE)?.value === "1";
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
  if (!user) return bounce();
  if (isLoginPage) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }
  return res;
}

export const config = {
  matcher: ["/admin/:path*"],
};
