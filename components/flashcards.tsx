"use client";

import Link from "next/link";
import { useState, type KeyboardEvent } from "react";
import { format } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/provider";
import { BackButton } from "./back-button";
import { btnPrimary, btnSecondary } from "./styles";

const CARD_EMOJI = ["🗣", "⚖️", "💡", "📚", "↩️", "💛"];

/** "What is a debate?" deck: tap a card to flip it, then move through the deck. */
export function Flashcards() {
  const { locale, dict } = useI18n();
  const t = dict.learn;
  const total = t.cards.length;
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const done = index === total;

  const go = (next: number) => {
    setFlipped(false);
    setIndex(Math.max(0, Math.min(total, next)));
  };

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === "ArrowRight") go(index + 1);
    if (event.key === "ArrowLeft") go(index - 1);
  }

  const cardItem = t.cards[index];

  return (
    <div className="mx-auto max-w-xl space-y-6" onKeyDown={onKeyDown}>
      <BackButton fallback={`/${locale}`} />
      <header className="space-y-1 text-center">
        <h1 className="text-3xl font-black">
          <span aria-hidden>📖</span> {t.title}
        </h1>
        <p className="text-lg text-muted">{format(t.subtitle, { total })}</p>
      </header>

      <div aria-hidden className="flex justify-center gap-1.5">
        {t.cards.map((_, i) => (
          <span
            key={i}
            className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-primary" : i < index ? "w-2 bg-good" : "w-2 bg-border"}`}
          />
        ))}
      </div>

      {done ? (
        <div className="animate-pop-in space-y-4 rounded-3xl border-2 border-good/40 bg-good-soft p-8 text-center">
          <p aria-hidden className="text-6xl">
            🎉
          </p>
          <h2 className="text-2xl font-black text-good">{t.done}</h2>
          <p className="text-lg">{t.doneText}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href={`/${locale}`} className={btnPrimary}>
              {t.practice} <span aria-hidden>🚀</span>
            </Link>
            <button type="button" onClick={() => go(0)} className={btnSecondary}>
              <span aria-hidden>🔁</span> {t.restart}
            </button>
          </div>
        </div>
      ) : (
        <>
          <button
            key={index}
            type="button"
            onClick={() => setFlipped((f) => !f)}
            aria-pressed={flipped}
            aria-label={`${format(t.cardOf, { n: index + 1, total })}. ${cardItem.front} ${flipped ? cardItem.back : t.flip}`}
            className="block h-80 w-full animate-pop-in rounded-3xl [perspective:1200px]"
          >
            <span
              className={`relative block size-full transition-transform duration-500 [transform-style:preserve-3d] ${
                flipped ? "[transform:rotateY(180deg)]" : ""
              }`}
            >
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-primary/30 bg-card p-8 shadow-[0_6px_0_var(--border)] [backface-visibility:hidden]">
                <span className="text-sm font-bold text-muted">{format(t.cardOf, { n: index + 1, total })}</span>
                <span aria-hidden className="text-6xl">
                  {CARD_EMOJI[index]}
                </span>
                <span className="text-center text-2xl font-black text-balance">{cardItem.front}</span>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
                  <span aria-hidden>👆 </span>
                  {t.flip}
                </span>
              </span>
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-help/40 bg-help-soft p-8 shadow-[0_6px_0_var(--border)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <span aria-hidden className="text-4xl">
                  {CARD_EMOJI[index]}
                </span>
                <span className="text-center text-xl font-bold leading-relaxed text-balance">{cardItem.back}</span>
              </span>
            </span>
          </button>

          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={() => go(index - 1)} disabled={index === 0} className={btnSecondary}>
              <span aria-hidden>←</span> {t.prev}
            </button>
            <button type="button" onClick={() => go(index + 1)} className={btnPrimary}>
              {t.next} <span aria-hidden>→</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
