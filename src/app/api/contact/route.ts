import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export async function POST(req: Request) {
  // Rate limit: 5 messages per IP per minute.
  if (!rateLimit(clientKey(req), { windowMs: 60_000, max: 5 })) {
    return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429 });
  }
  try {
    const { name, email, message } = await req.json();
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
    }
    if (!message || typeof message !== "string" || message.trim().length < 5) {
      return NextResponse.json({ ok: false, error: "Message too short" }, { status: 400 });
    }
    const supabase = await createServerSupabase();
    if (supabase) {
      const { error } = await supabase
        .from("contact_messages")
        .insert({
          name: name ? String(name).trim().slice(0, 120) : null,
          email: email.trim().toLowerCase(),
          message: message.trim().slice(0, 5000),
        });
      if (error) {
        console.error("[contact] insert failed", error);
        return NextResponse.json({ ok: false, error: "Could not save your message" }, { status: 500 });
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[contact] unexpected", e);
    return NextResponse.json({ ok: false, error: "Something went wrong" }, { status: 500 });
  }
}