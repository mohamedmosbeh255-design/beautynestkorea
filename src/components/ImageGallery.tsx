"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function ImageGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);
  const list = images.length > 0 ? images : ["https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80"];
  return (
    <div>
      <div className="glass relative aspect-square overflow-hidden rounded-3xl">
        <Image
          key={list[active]}
          src={list[active]}
          alt={title}
          fill
          className="object-cover animate-fade-up"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>
      {list.length > 1 && (
        <div className="mt-3 flex gap-3">
          {list.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={cn(
                "relative h-20 w-20 overflow-hidden rounded-2xl border-2 transition",
                i === active ? "border-sage-500" : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              <Image src={src} alt={`${title} ${i + 1}`} fill className="object-cover" sizes="80px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
