import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export async function POST(req: Request) {
  // Rate limit: 5 reviews per IP per minute.
  if (!rateLimit(clientKey(req), { windowMs: 60_000, max: 5 })) {
    return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429 });
  }
  try {
    const { productId, rating, comment } = await req.json();
    if (!productId || typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json({ ok: false, error: "Invalid rating" }, { status: 400 });
    }
    const supabase = await createServerSupabase();
    if (supabase) {
      const { error } = await supabase
        .from("product_reviews")
        .insert({
          product_id: productId,
          rating: Math.round(rating),
          comment: comment ? String(comment).trim().slice(0, 2000) : null,
        });
      if (error) {
        console.error("[reviews] insert failed", error);
        return NextResponse.json({ ok: false, error: "Could not save your review" }, { status: 500 });
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[reviews] unexpected", e);
    return NextResponse.json({ ok: false, error: "Something went wrong" }, { status: 500 });
  }
}