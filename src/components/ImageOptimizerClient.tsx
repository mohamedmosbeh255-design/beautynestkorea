"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Download, Image as ImageIcon, RotateCcw } from "lucide-react";

interface Result {
  url: string;
  bytes: number;
  width: number;
  height: number;
  format: string;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Client-side image optimizer for authoring (resize + compress + download).
 * WHY client-side canvas instead of server sharp here: this tool prepares
 * images BEFORE upload — no server round-trip, no new dependencies. Delivery
 * optimization is already handled by next/image (AVIF/WebP, capped widths in
 * next.config.ts, sharp on the production server). Nothing on this page
 * touches products, articles, or affiliate links.
 */
export default function ImageOptimizerClient() {
  const [src, setSrc] = useState<string | null>(null);
  const [name, setName] = useState("image");
  const [origBytes, setOrigBytes] = useState(0);
  const [origDims, setOrigDims] = useState({ w: 0, h: 0 });
  const [maxWidth, setMaxWidth] = useState(1080);
  const [quality, setQuality] = useState(80);
  const [format, setFormat] = useState<"jpeg" | "webp" | "png">("webp");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Revoke object URLs on unmount / replace to avoid leaking blob memory.
  useEffect(() => {
    return () => {
      if (src) URL.revokeObjectURL(src);
      if (result) URL.revokeObjectURL(result.url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onFile = useCallback((file: File | undefined) => {
    setError(null);
    setResult(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (JPEG, PNG, WebP, …).");
      return;
    }
    setSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setName(file.name.replace(/\.[a-z0-9]+$/i, "") || "image");
    setOrigBytes(file.size);
    const probe = new window.Image();
    probe.onload = () => setOrigDims({ w: probe.naturalWidth, h: probe.naturalHeight });
    probe.src = URL.createObjectURL(file);
  }, []);

  const optimize = useCallback(() => {
    setError(null);
    if (!src) return;
    const img = new window.Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, maxWidth / img.naturalWidth);
        const w = Math.max(1, Math.round(img.naturalWidth * scale));
        const h = Math.max(1, Math.round(img.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setError("Canvas is not available in this browser.");
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const mime = format === "jpeg" ? "image/jpeg" : format === "webp" ? "image/webp" : "image/png";
        // PNG is lossless: quality slider does not apply (canvas ignores it).
        const q = format === "png" ? undefined : quality / 100;
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              setError("Could not encode the image — try another format.");
              return;
            }
            setResult((prev) => {
              if (prev) URL.revokeObjectURL(prev.url);
              return { url: URL.createObjectURL(blob), bytes: blob.size, width: w, height: h, format };
            });
          },
          mime,
          q
        );
      } catch {
        setError("Something went wrong while processing the image.");
      }
    };
    img.onerror = () => setError("Could not read that image file.");
    img.src = src;
  }, [src, maxWidth, quality, format]);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  const savings = result && origBytes > 0 ? Math.round((1 - result.bytes / origBytes) * 100) : 0;

  return (
    <div>
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onFile(e.dataTransfer.files?.[0]);
        }}
        className="glass cursor-pointer rounded-3xl p-8 text-center transition hover:shadow-xl"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") fileRef.current?.click();
        }}
        aria-label="Choose an image to optimize"
      >
        <ImageIcon className="mx-auto h-8 w-8 text-sage-600" />
        <p className="mt-3 font-semibold">Drop an image here, or click to choose one</p>
        <p className="mt-1 text-sm text-ink-soft">Processed entirely in your browser — nothing is uploaded.</p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-2xl bg-blush-50 px-4 py-3 text-sm font-medium text-blush-600">
          {error}
        </p>
      )}

      {src && (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="glass overflow-hidden rounded-3xl">
            <div className="relative aspect-[4/3] bg-sage-50">
              <Image src={src} alt="Original upload preview" fill className="object-contain" sizes="50vw" />
            </div>
            <div className="p-5">
              <p className="text-sm font-semibold">Original</p>
              <p className="mt-1 text-sm text-ink-soft">
                {origDims.w > 0 ? `${origDims.w} × ${origDims.h} px · ` : ""}{formatBytes(origBytes)}
              </p>
            </div>
          </div>

          <div className="glass rounded-3xl p-5 sm:p-6">
            <p className="text-sm font-semibold">Settings</p>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-ink-soft">
              Max width — {maxWidth}px
              <input
                type="range" min={320} max={2000} step={10} value={maxWidth}
                onChange={(e) => setMaxWidth(Number(e.target.value))}
                className="mt-2 w-full accent-sage-600"
              />
            </label>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-ink-soft">
              Quality — {quality}%{format === "png" ? " (PNG is lossless — ignored)" : ""}
              <input
                type="range" min={10} max={100} step={5} value={quality} disabled={format === "png"}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="mt-2 w-full accent-sage-600 disabled:opacity-40"
              />
            </label>
            <div className="mt-4 flex gap-2" role="group" aria-label="Output format">
              {(["jpeg", "webp", "png"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormat(f)}
                  aria-pressed={format === f}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    format === f ? "bg-sage-600 text-white" : "bg-sage-50 text-sage-700 hover:bg-sage-100"
                  }`}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={optimize}
                className="inline-flex items-center gap-2 rounded-2xl bg-ink px-6 py-3 text-sm font-bold text-white transition hover:bg-sage-600"
              >
                <ImageIcon className="h-4 w-4" /> Optimize
              </button>
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-2 rounded-2xl bg-sage-50 px-6 py-3 text-sm font-bold text-sage-700 transition hover:bg-sage-100"
              >
                <RotateCcw className="h-4 w-4" /> Reset
              </button>
            </div>

            {result && (
              <div className="mt-6 rounded-2xl bg-white/70 p-4">
                <p className="text-sm font-semibold">
                  Optimized — {result.width} × {result.height} px · {formatBytes(result.bytes)}
                  {savings > 0 && <span className="text-sage-600"> ({savings}% smaller)</span>}
                </p>
                <a
                  href={result.url}
                  download={`${name}-${result.width}w.${result.format === "jpeg" ? "jpg" : result.format}`}
                  className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-[#FF9900] px-6 py-3 text-sm font-bold text-black shadow-lg shadow-orange-200 transition hover:brightness-95"
                >
                  <Download className="h-4 w-4" /> Download {result.format.toUpperCase()}
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
