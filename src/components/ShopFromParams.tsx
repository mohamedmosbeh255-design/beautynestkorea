"use client";

import { useSearchParams } from "next/navigation";
import type { Product } from "@/lib/types";
import ShopClient from "@/components/ShopClient";

// Reads ?concern= / ?category= deep links client-side so /shop stays fully
// static (ISR) — awaiting searchParams in the server page would force
// dynamic rendering and kill CDN caching.
export default function ShopFromParams({ products }: { products: Product[] }) {
  const params = useSearchParams();
  return (
    <ShopClient
      products={products}
      initialConcern={params.get("concern") ?? "All"}
      initialCategory={params.get("category") ?? "All"}
    />
  );
}
