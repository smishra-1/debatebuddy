"use client";

import Link from "next/link";
import { useUser } from "@/lib/client/use-user";
import { useI18n } from "@/lib/i18n/provider";
import { Logo } from "./logo";
import { MessageBubble } from "./message-bubble";
import { btnPrimary, btnSecondary, card, textLink } from "./styles";

const FEATURE_EMOJI = ["😊", "💡", "🏆"];

export function Landing() {
  const { locale, dict } = useI18n();
  const user = useUser();
  const t = dict.landing;

  return (
    <div className="space-y-14">
      <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
        <div className="animate-fade-up space-y-5">
          <Logo title={dict.meta.title} size="lg" />
          <p className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">{t.eyebrow}</p>
          <h1 className="text-4xl font-black leading-tight text-balance sm:text-5xl">{t.title}</h1>
          <p className="max-w-xl text-lg text-muted text-pretty">{t.subtitle}</p>
          <div className="flex flex-wrap gap-3">
            {user ? (
              <Link href={`/${locale}`} className={btnPrimary}>
                {dict.howTo.start} <span aria-hidden>🚀</span>
              </Link>
            ) : (
              <>
                <Link href={`/${locale}/signup`} className={btnPrimary}>
                  {t.start} <span aria-hidden>🚀</span>
                </Link>
                <Link href={`/${locale}/login`} className={btnSecondary}>
                  {t.login}
                </Link>
              </>
            )}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href={`/${locale}/learn`} className={textLink}>
              <span aria-hidden>📖</span> {t.learn}
            </Link>
            <Link href={`/${locale}/how-to-play`} className={textLink}>
              <span aria-hidden>❓</span> {t.howTo}
            </Link>
          </div>
        </div>

        {/* A tiny pretend debate so newcomers can see what it looks like. */}
        <div aria-hidden className={`${card} relative space-y-4 rotate-1 motion-safe:animate-pop-in`}>
          <span className="absolute -top-5 -left-4 grid size-14 -rotate-12 place-items-center rounded-2xl bg-help-soft text-3xl shadow-sm">
            ⭐
          </span>
          <p className="text-center text-sm font-bold text-muted">{t.preview.topic}</p>
          <MessageBubble author={dict.common.you} avatar="🙂" mine content={t.preview.student} />
          <MessageBubble author={dict.setup.opponents.fiona.name} avatar="😊" mine={false} content={t.preview.fiona} />
          <div className="flex justify-center gap-1 text-2xl text-help">★★★★★</div>
        </div>
      </section>

      <section aria-labelledby="features" className="space-y-5">
        <h2 id="features" className="text-center text-2xl font-black">
          {t.featuresTitle}
        </h2>
        <ul className="grid gap-4 sm:grid-cols-3">
          {t.features.map((feature, i) => (
            <li key={feature.title} className={`${card} space-y-2 text-center`}>
              <span aria-hidden className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-3xl">
                {FEATURE_EMOJI[i]}
              </span>
              <h3 className="text-lg font-extrabold">{feature.title}</h3>
              <p className="text-muted">{feature.text}</p>
            </li>
          ))}
        </ul>
        <p className="text-center font-bold text-muted">
          <span aria-hidden>🌏 </span>
          {t.languages}
        </p>
      </section>
    </div>
  );
}
