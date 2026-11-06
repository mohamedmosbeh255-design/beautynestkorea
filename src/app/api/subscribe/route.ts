import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(req: Request) {
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
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      }
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}