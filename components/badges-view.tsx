"use client";

import Link from "next/link";
import { useApiResource } from "@/lib/client/use-api-resource";
import { format } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/provider";
import { badgeFirstEarned, badgeIds, type BadgeId } from "@/lib/ratings";
import type { DebateSummary } from "@/lib/types";
import { BackButton } from "./back-button";
import { Loading, Skeleton } from "./skeleton";
import { btnPrimary, btnSecondary, card } from "./styles";

export const BADGE_EMOJI: Record<BadgeId, string> = {
  thinker: "🧠",
  finder: "📚",
  coolhead: "😎",
  champ: "🏆",
  sparkle: "💡",
  allrounder: "🌈",
  perfect: "🌟",
  highflyer: "🚀",
  topscorer: "🥇",
  firststep: "👣",
  warmup: "🔥",
  regular: "🎯",
  dedicated: "💪",
  veteran: "🛡️",
  legend: "👑",
  stars50: "⭐",
  stars100: "✨",
  stars250: "🌠",
  streak3: "📅",
  streak7: "🗓️",
  bothsides: "⚖️",
  crew: "🤝",
  brave: "🦁",
  longhaul: "🏃",
  explorer: "🧭",
  comeback: "💫",
  quick: "⏱️",
  hardhero: "🐉",
  weekend: "🎉",
  earlybird: "🐦",
};

export function BadgesView() {
  const { locale, dict } = useI18n();
  const t = dict.badgesPage;
  const { data, error, reload } = useApiResource<{ debates: DebateSummary[] }>("/api/debates");

  if (error) {
    return (
      <div className={`${card} mx-auto max-w-xl space-y-3 text-center`}>
        <p role="alert">{error}</p>
        <button className={btnSecondary} onClick={reload}>
          {dict.common.retry}
        </button>
      </div>
    );
  }

  const earned = data ? badgeFirstEarned(data.debates) : {};
  const count = Object.keys(earned).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackButton fallback={`/${locale}/progress`} />
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-3xl font-black">
            <span aria-hidden>🏅</span> {t.title}
          </h1>
          <p className="text-lg text-muted">{t.subtitle}</p>
        </div>
        {data && (
          <p className="rounded-full bg-help-soft px-4 py-1.5 font-extrabold text-help">
            {format(t.count, { count, total: badgeIds.length })}
          </p>
        )}
      </header>

      {!data ? (
        <Loading>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {badgeIds.map((id) => (
              <Skeleton key={id} className="h-44 rounded-3xl" />
            ))}
          </div>
        </Loading>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {badgeIds.map((id) => {
            const debate = earned[id];
            return (
              <li
                key={id}
                className={`flex animate-pop-in flex-col items-center gap-2 rounded-3xl border-2 p-4 text-center sm:p-5 ${
                  debate ? "border-good/40 bg-good-soft" : "border-dashed border-border bg-card"
                }`}
              >
                <span
                  aria-hidden
                  className={`grid size-16 place-items-center rounded-full text-4xl sm:size-20 sm:text-5xl ${debate ? "bg-card shadow-sm" : "bg-border/40 grayscale"}`}
                >
                  {debate ? BADGE_EMOJI[id] : "🔒"}
                </span>
                <h2 className="text-lg font-extrabold text-balance sm:text-xl">{dict.progress.badges[id]}</h2>
                <p className={`rounded-full px-3 py-0.5 text-sm font-bold ${debate ? "bg-good text-card" : "bg-border/60 text-muted"}`}>
                  {debate ? t.earned : t.locked}
                </p>
                <p className="text-sm text-muted text-pretty sm:text-base">{t.how[id]}</p>
                {debate && (
                  <Link href={`/${locale}/debate/${debate.id}`} className="text-sm font-bold text-primary hover:underline">
                    {format(t.earnedIn, { topic: debate.topic })}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {data && count < badgeIds.length && (
        <Link href={`/${locale}`} className={btnPrimary}>
          {t.start} <span aria-hidden>🚀</span>
        </Link>
      )}
    </div>
  );
}
