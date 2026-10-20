"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/provider";
import { BackButton } from "./back-button";
import { btnPrimary, btnSecondary, card } from "./styles";

const STEP_EMOJI = ["🎯", "👍", "💬", "💡", "⭐", "🧑‍🏫"];

export function HowToPlay() {
  const { locale, dict } = useI18n();
  const t = dict.howTo;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <BackButton fallback={`/${locale}`} />
      <header className="space-y-1">
        <h1 className="text-3xl font-black">
          <span aria-hidden>❓</span> {t.title}
        </h1>
        <p className="text-lg text-muted">{t.subtitle}</p>
      </header>

      <ol className="relative space-y-4 before:absolute before:top-6 before:bottom-6 before:left-7 before:w-0.5 before:bg-border">
        {t.steps.map((step, i) => (
          <li key={step.title} className="relative flex gap-4">
            <span
              aria-hidden
              className="z-10 grid size-14 shrink-0 place-items-center rounded-2xl border-2 border-primary/30 bg-card text-3xl shadow-sm"
            >
              {STEP_EMOJI[i]}
            </span>
            <div className={`${card} flex-1 !p-4`}>
              <h2 className="text-lg font-extrabold">
                <span className="text-primary">{i + 1}. </span>
                {step.title}
              </h2>
              <p className="text-muted">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>

      <section aria-labelledby="tips" className="space-y-3 rounded-3xl border-2 border-help/40 bg-help-soft p-5">
        <h2 id="tips" className="text-xl font-extrabold text-help">
          <span aria-hidden>🌟</span> {t.tipsTitle}
        </h2>
        <ul className="space-y-2 text-lg">
          {t.tips.map((tip) => (
            <li key={tip} className="flex gap-2">
              <span aria-hidden className="text-good">
                ✓
              </span>
              {tip}
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href={`/${locale}`} className={btnPrimary}>
          {t.start} <span aria-hidden>🚀</span>
        </Link>
        <Link href={`/${locale}/learn`} className={btnSecondary}>
          <span aria-hidden>📖</span> {dict.home.whatIsDebate}
        </Link>
      </div>
    </div>
  );
}
