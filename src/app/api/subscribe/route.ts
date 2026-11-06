import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export async function POST(req: Request) {
  // Rate limit: 10 signups per IP per minute.
  if (!rateLimit(clientKey(req), { windowMs: 60_000, max: 10 })) {
    return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429 });
  }
  try {
    const { email, source } = await req.json();
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
    }
    const supabase = await createServerSupabase();
    if (supabase) {
      const { error } = await supabase
        .from("email_subscribers")
        .insert({ email: email.trim().toLowerCase(), source: source ?? "unknown" });
      // Duplicate email is a success for the user (they're already subscribed).
      if (error && error.code !== "23505") {
        console.error("[subscribe] insert failed", error);
        return NextResponse.json({ ok: false, error: "Could not save your email" }, { status: 500 });
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[subscribe] unexpected", e);
    return NextResponse.json({ ok: false, error: "Something went wrong" }, { status: 500 });
  }
}