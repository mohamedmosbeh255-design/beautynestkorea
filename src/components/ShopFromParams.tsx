"use client";

import { useSearchParams } from "next/navigation";
import type { Product } from "@/lib/types";
import ShopClient from "@/components/ShopClient";

// Reads ?concern= / ?category= / ?tag= deep links client-side so /shop stays
// fully static (ISR) — awaiting searchParams in the server page would force
// dynamic rendering and kill CDN caching. The key remounts the filter UI when
// a deep link changes, so initial props stay authoritative without effects.
export default function ShopFromParams({ products }: { products: Product[] }) {
  const params = useSearchParams();
  const concern = params.get("concern") ?? "All";
  const category = params.get("category") ?? "All";
  const tag = params.get("tag") ?? "";
  return (
    <ShopClient
      key={`${concern}|${category}|${tag}`}
      products={products}
      initialConcern={concern}
      initialCategory={category}
      initialTag={tag}
    />
  );
}
