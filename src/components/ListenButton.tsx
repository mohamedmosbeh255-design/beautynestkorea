"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, Square, Volume2 } from "lucide-react";

/**
 * Text-to-speech "Listen" control for article pages (Web Speech API, en-US).
 *
 * WHY this design:
 * - Text is extracted at click time from the article body container
 *   (`targetId`), so nav/footer/headers can never leak into narration.
 * - Only readable blocks (p, h2, h3, li, blockquote) are collected; code,
 *   buttons, and anything under [data-tts-exclude] (share rows, disclosures)
 *   is skipped. Affiliate buttons and schema markup are never touched — the
 *   extractor only READS textContent.
 * - One utterance per block gives reliable progress ("Part X of Y") and
 *   pause/resume/stop without losing position.
 * - iOS Safari's speechSynthesis.pause() is historically unreliable, so Stop
 *   (cancel + reset) is always available as the deterministic fallback.
 */

const SPEEDS = [0.8, 1, 1.5, 2] as const;

function collectBlocks(root: HTMLElement): string[] {
  const blocks: string[] = [];
  // querySelectorAll is document-ordered, so narration follows reading order.
  const nodes = root.querySelectorAll("p, h2, h3, li, blockquote");
  nodes.forEach((el) => {
    const htmlEl = el as HTMLElement;
    if (htmlEl.closest("[data-tts-exclude]")) return;
    // Skip nested list items already covered by their parent (avoid doubles).
    if (htmlEl.tagName === "LI" && htmlEl.parentElement?.closest("li")) return;
    const text = (htmlEl.textContent ?? "").replace(/\s+/g, " ").trim();
    // Drop empty nodes and UI chrome that leaked in (single-word buttons etc.).
    if (text.length > 40) blocks.push(text);
  });
  return blocks;
}

function pickEnglishVoice(): SpeechSynthesisVoice | null {
  try {
    const voices = window.speechSynthesis.getVoices();
    return (
      voices.find((v) => v.lang.toLowerCase() === "en-us") ??
      voices.find((v) => v.lang.toLowerCase().startsWith("en")) ??
      null
    );
  } catch {
    return null;
  }
}

export default function ListenButton({ targetId, title }: { targetId: string; title: string }) {
  const supported =
    typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  const [status, setStatus] = useState<"idle" | "playing" | "paused">("idle");
  const [index, setIndex] = useState(0);
  const [total, setTotal] = useState(0);
  const [rate, setRate] = useState<number>(1);
  const [noSupport, setNoSupport] = useState(false);
  const blocksRef = useRef<string[]>([]);
  const indexRef = useRef(0);
  const rateRef = useRef(1);
  const statusRef = useRef<"idle" | "playing" | "paused">("idle");

  const setStatusBoth = (s: "idle" | "playing" | "paused") => {
    statusRef.current = s;
    setStatus(s);
  };

  // Always stop narration when leaving the article (no orphaned audio).
  useEffect(() => {
    return () => {
      try {
        window.speechSynthesis?.cancel();
      } catch {
        // Non-browser / SSR safety — never throw from cleanup.
      }
    };
  }, []);

  // Warm up the voice list (browsers load voices asynchronously).
  useEffect(() => {
    if (!supported) return;
    try {
      window.speechSynthesis.getVoices();
      const onVoices = () => window.speechSynthesis.getVoices();
      window.speechSynthesis.addEventListener?.("voiceschanged", onVoices);
      return () => window.speechSynthesis.removeEventListener?.("voiceschanged", onVoices);
    } catch {
      return;
    }
  }, [supported]);

  const speakAtRef = useRef<(i: number) => void>(() => {});
  const speakAt = useCallback((i: number) => {
    const blocks = blocksRef.current;
    if (i >= blocks.length) {
      setStatusBoth("idle");
      setIndex(0);
      return;
    }
    indexRef.current = i;
    setIndex(i);
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(blocks[i]);
      utterance.lang = "en-US";
      utterance.rate = rateRef.current;
      const voice = pickEnglishVoice();
      if (voice) utterance.voice = voice;
      utterance.onend = () => {
        // onend also fires after cancel(); only advance while playing.
        if (statusRef.current === "playing") speakAtRef.current(indexRef.current + 1);
      };
      utterance.onerror = () => {
        if (statusRef.current === "playing") speakAtRef.current(indexRef.current + 1);
      };
      window.speechSynthesis.speak(utterance);
      setStatusBoth("playing");
    } catch {
      setStatusBoth("idle");
    }
  }, []);
  // Published after declaration so the utterance callbacks above always reach
  // the current speaker without a self-referencing hook dependency.
  useEffect(() => {
    speakAtRef.current = speakAt;
  }, [speakAt]);

  const start = useCallback(() => {
    if (!supported) {
      setNoSupport(true);
      return;
    }
    const root = document.getElementById(targetId);
    if (!root) return;
    const blocks = collectBlocks(root);
    if (blocks.length === 0) return;
    blocksRef.current = blocks;
    setTotal(blocks.length);
    speakAt(0);
  }, [supported, targetId, speakAt]);

  const pause = useCallback(() => {
    try {
      window.speechSynthesis.pause();
      setStatusBoth("paused");
    } catch {
      // pause() throws on some mobile browsers — Stop stays available.
    }
  }, []);

  const resume = useCallback(() => {
    try {
      if (statusRef.current === "paused") {
        // If the engine already dropped the queue (mobile), restart the block.
        if (!window.speechSynthesis.paused && !window.speechSynthesis.speaking) {
          speakAt(indexRef.current);
        } else {
          window.speechSynthesis.resume();
          setStatusBoth("playing");
        }
      }
    } catch {
      speakAt(indexRef.current);
    }
  }, [speakAt]);

  const stop = useCallback(() => {
    try {
      window.speechSynthesis.cancel();
    } finally {
      setStatusBoth("idle");
      setIndex(0);
    }
  }, []);

  const changeRate = useCallback(
    (next: number) => {
      setRate(next);
      rateRef.current = next;
      // Rate applies to new utterances only — restart the current block so
      // the change is audible immediately while playing.
      if (statusRef.current === "playing") speakAt(indexRef.current);
    },
    [speakAt]
  );

  // Graceful fallback (event-driven, so SSR and first client render match):
  // the unsupported-browser notice only appears after a click attempt sets
  // noSupport — render output never depends on feature detection itself.
  if (noSupport) {
    return (
      <p role="status" className="text-sm text-ink-soft">
        Your browser doesn&apos;t support audio. Please upgrade.
      </p>
    );
  }

  const btn =
    "inline-flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-full bg-sage-600 px-3 text-sm font-semibold text-white transition hover:bg-sage-700";

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={`Listen to: ${title}`}>
      {status === "idle" && (
        <button type="button" onClick={start} className={btn} aria-label={`Listen to ${title}`}>
          <Volume2 className="h-4 w-4" aria-hidden="true" /> Listen
        </button>
      )}
      {status === "playing" && (
        <>
          <button type="button" onClick={pause} className={btn} aria-label="Pause narration">
            <Pause className="h-4 w-4" aria-hidden="true" /> Pause
          </button>
          <button
            type="button"
            onClick={stop}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-sage-50 text-sage-700 transition hover:bg-sage-100"
            aria-label="Stop narration"
          >
            <Square className="h-4 w-4" aria-hidden="true" />
          </button>
        </>
      )}
      {status === "paused" && (
        <>
          <button type="button" onClick={resume} className={btn} aria-label="Resume narration">
            <Play className="h-4 w-4" aria-hidden="true" /> Resume
          </button>
          <button
            type="button"
            onClick={stop}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-sage-50 text-sage-700 transition hover:bg-sage-100"
            aria-label="Stop narration"
          >
            <Square className="h-4 w-4" aria-hidden="true" />
          </button>
        </>
      )}
      {status !== "idle" && (
        <span className="text-xs font-semibold text-ink-soft" role="status" aria-live="polite">
          Part {Math.min(index + 1, total)} of {total}
        </span>
      )}
      {status !== "idle" && (
        <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
          Speed
          <select
            value={rate}
            onChange={(e) => changeRate(Number(e.target.value))}
            aria-label="Narration speed"
            className="rounded-full border border-sage-200 bg-white px-2 py-1 text-xs font-semibold text-ink"
          >
            {SPEEDS.map((s) => (
              <option key={s} value={s}>
                {s}x
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
