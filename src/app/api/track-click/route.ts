import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { productId, source } = await req.json();
    if (!productId || !["amazon", "oliveyoung"].includes(source)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const supabase = await createServerSupabase();
    if (supabase) {
      await supabase.from("product_clicks").insert({ product_id: productId, source });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
