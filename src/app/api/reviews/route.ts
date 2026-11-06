import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(req: Request) {
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
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      }
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}