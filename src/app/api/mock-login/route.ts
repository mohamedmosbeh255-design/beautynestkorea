import { NextResponse } from "next/server";

export const MOCK_ADMIN_COOKIE = "bnk_mock_admin";
export const MOCK_ADMIN_EMAIL = "admin@beautynestkorea.com";
export const MOCK_ADMIN_PASSWORD = "admin123";

// Mock-mode login: only works when Supabase env is NOT configured.
// Sets a session cookie so the dashboard persists across refreshes.
export async function POST(req: Request) {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ ok: false, error: "Supabase is configured — use real auth." }, { status: 400 });
  }
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }
  if (body.email !== MOCK_ADMIN_EMAIL || body.password !== MOCK_ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false, error: "Invalid mock credentials." }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(MOCK_ADMIN_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return res;
}
