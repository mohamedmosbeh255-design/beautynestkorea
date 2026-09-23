"use client";

import { useState } from "react";
import { Link2, Mail, Send, Check } from "lucide-react";

/**
 * Article share controls (B4): native share sheet where supported, plus
 * direct share intents for X / Facebook / Pinterest / Email, and copy-link
 * with confirmation. Pure links + Web Share API — no SDKs, no trackers, and
 * zero contact with affiliate mechanics.
 */
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function PinterestIcon({ className }: { className?: string }) {  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z" />
    </svg>
  );
}

export default function ShareButtons({ title, path }: { title: string; path: string }) {
  const [copied, setCopied] = useState(false);
  const url = path.startsWith("http") ? path : `https://beautynestkorea.com${path}`;
  const text = `${title} — via BeautyNestKorea`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const canNativeShare = typeof navigator !== "undefined" && "share" in navigator;
  const nativeShare = () => {
    if ("share" in navigator) {
      navigator.share({ title, text, url }).catch(() => {
        // User dismissed the sheet — not an error.
      });
    }
  };

  const btn =
    "inline-flex h-10 w-10 items-center justify-center rounded-full bg-sage-50 text-sage-700 transition hover:bg-sage-100";
  return (
    <div className="flex items-center gap-2" role="group" aria-label={`Share: ${title}`}>
      <span className="mr-1 text-xs font-bold uppercase tracking-[0.18em] text-ink-soft">Share</span>
      {canNativeShare && (
        <button type="button" onClick={nativeShare} className={btn} aria-label="Share via device options">
          <Send className="h-4 w-4" />
        </button>
      )}
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={btn}
        aria-label="Share on X"
        title="Share on X"
      >
        <XIcon className="h-4 w-4" />
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={btn}
        aria-label="Share on Facebook"
        title="Share on Facebook"
      >
        <FacebookIcon className="h-4 w-4" />
      </a>
      <a
        href={`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(text)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={btn}
        aria-label="Share on Pinterest"
        title="Share on Pinterest"
      >
        <PinterestIcon className="h-4 w-4" />
      </a>
      <a href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`} className={btn} aria-label="Share by email" title="Share by email">
        <Mail className="h-4 w-4" />
      </a>
      <button type="button" onClick={copy} className={btn} aria-label={copied ? "Link copied" : "Copy link"}>
        {copied ? <Check className="h-4 w-4 text-sage-600" /> : <Link2 className="h-4 w-4" />}
      </button>
    </div>
  );
}
