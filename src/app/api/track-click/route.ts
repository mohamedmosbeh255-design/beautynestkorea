import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export async function POST(req: Request) {
  // Rate limit: 30 clicks per IP per minute.
  if (!rateLimit(clientKey(req), { windowMs: 60_000, max: 30 })) {
    return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429 });
  }
  try {
    const { productId, source } = await req.json();
    if (!productId || !["amazon", "oliveyoung", "amazon_uk", "stylevana"].includes(source)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const supabase = await createServerSupabase();
    if (supabase) {
      const { error } = await supabase
        .from("product_clicks")
        .insert({ product_id: productId, source });
      if (error) {
        console.error("[track-click] insert failed", error);
        return NextResponse.json({ ok: false, error: "Could not record click" }, { status: 500 });
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[track-click] unexpected", e);
    return NextResponse.json({ ok: false, error: "Something went wrong" }, { status: 500 });
  }
}
