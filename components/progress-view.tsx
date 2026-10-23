"use client";

import Link from "next/link";
import { useApiResource } from "@/lib/client/use-api-resource";
import { format } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/provider";
import { DEBATE_MAX_STARS, badgeIds, debateStars, starSeries, streakDays, totalStars, unlockedBadges } from "@/lib/ratings";
import { OPPONENT_EMOJI } from "@/lib/opponents";
import type { DebateSummary } from "@/lib/types";
import { BackButton } from "./back-button";
import { BADGE_EMOJI } from "./badges-view";
import { Loading, Skeleton } from "./skeleton";
import { Stars } from "./stars";
import { btnPrimary, btnSecondary, card } from "./styles";


export function ProgressView() {
  const { locale, dict } = useI18n();
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
  if (!data) {
    return (
      <Loading>
        <div className="mx-auto max-w-4xl space-y-6">
          <Skeleton className="h-9 w-64" />
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-32 rounded-3xl" />
            <Skeleton className="h-32 rounded-3xl" />
            <Skeleton className="h-32 rounded-3xl" />
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <Skeleton className="h-56 rounded-3xl" />
            <Skeleton className="h-56 rounded-3xl" />
          </div>
        </div>
      </Loading>
    );
  }

  const debates = data.debates;
  const series = starSeries(debates);
  const badges = unlockedBadges(debates);
  const stats = [
    { emoji: "🗣", value: debates.length, label: dict.progress.debates },
    { emoji: "⭐", value: totalStars(debates), label: dict.progress.starsEarned },
    { emoji: "🔥", value: streakDays(debates), label: dict.progress.daysInRow },
  ];
  const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  const dayLabel = (iso: string) => {
    const date = new Date(iso);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return dict.progress.today;
    today.setDate(today.getDate() - 1);
    return date.toDateString() === today.toDateString() ? dict.progress.yesterday : dateFormat.format(date);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <BackButton fallback={`/${locale}`} />
      <h1 className="text-3xl font-black">
        <span aria-hidden>🗺</span> {dict.progress.title}
      </h1>

      <ul className="grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <li key={stat.label} className={`${card} !px-2 text-center`}>
            <p aria-hidden className="text-2xl sm:text-3xl">
              {stat.emoji}
            </p>
            <p className="text-3xl font-black tabular-nums">{stat.value}</p>
            <p className="text-sm leading-tight text-muted sm:text-base">{stat.label}</p>
          </li>
        ))}
      </ul>

      <div className="grid gap-5 md:grid-cols-2">
        <section className={card} aria-labelledby="stars-over-time">
          <h2 id="stars-over-time" className="mb-3 text-xl font-extrabold">
            {dict.progress.starsOverTime}
          </h2>
          {series.length < 2 ? (
            <p className="text-muted">{dict.progress.notEnough}</p>
          ) : (
            <ul className="flex h-36 items-end gap-2">
              {series.map((stars, index) => (
                <li
                  key={index}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-1"
                  role="img"
                  aria-label={format(dict.common.starsOutOf, { count: stars, max: DEBATE_MAX_STARS })}
                >
                  <span className="text-sm font-bold">{stars}</span>
                  <span
                    className="w-full max-w-10 origin-bottom rounded-t-lg bg-help motion-safe:animate-fade-up"
                    style={{ height: `${(stars / DEBATE_MAX_STARS) * 80}%` }}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <Link
          href={`/${locale}/badges`}
          aria-labelledby="badges"
          className={`${card} group block transition-colors hover:border-primary`}
        >
          <h2 id="badges" className="mb-3 flex items-center justify-between gap-2 text-xl font-extrabold">
            {dict.progress.myBadges}
            <span className="text-base font-bold text-primary group-hover:underline">
              {dict.progress.seeAllBadges} <span aria-hidden>→</span>
            </span>
          </h2>
          <ul className="grid grid-cols-2 gap-3">
            {badgeIds.map((id) => {
              const unlocked = badges.has(id);
              return (
                <li
                  key={id}
                  className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-3 text-center font-bold ${
                    unlocked ? "border-good/40 bg-good-soft" : "border-dashed border-border text-muted"
                  }`}
                >
                  <span aria-hidden className={`text-3xl ${unlocked ? "" : "opacity-60 grayscale"}`}>
                    {unlocked ? BADGE_EMOJI[id] : "🔒"}
                  </span>
                  <span>{dict.progress.badges[id]}</span>
                  {!unlocked && <span className="sr-only">{dict.progress.locked}</span>}
                </li>
              );
            })}
          </ul>
        </Link>
      </div>

      <section className={`${card} space-y-3`} aria-labelledby="my-debates">
        <h2 id="my-debates" className="text-xl font-extrabold">
          {dict.progress.myDebates}
        </h2>
        {debates.length === 0 ? (
          <div className="space-y-3 rounded-2xl border-2 border-dashed border-border p-6 text-center">
            <p aria-hidden className="text-4xl">
              🌱
            </p>
            <p className="text-muted">{dict.progress.empty}</p>
            <Link href={`/${locale}`} className={btnPrimary}>
              {dict.progress.startFirst}
            </Link>
          </div>
        ) : (
          <ul className="divide-y-2 divide-border">
            {debates.slice(0, 5).map((debate) => (
              <li key={debate.id}>
                <Link
                  href={`/${locale}/debate/${debate.id}`}
                  className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-primary/8"
                >
                  <span aria-hidden className="text-2xl">
                    {OPPONENT_EMOJI[debate.opponent]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-lg font-bold">{debate.topic}</span>
                    <span className="text-sm text-muted">{dayLabel(debate.created_at)}</span>
                  </span>
                  {debate.review ? (
                    <Stars count={debateStars(debate.review.ratings)} max={DEBATE_MAX_STARS} className="text-xl" />
                  ) : (
                    <span className="shrink-0 rounded-full bg-timer-soft px-2.5 py-0.5 text-sm font-bold text-timer">
                      {dict.progress.inProgress}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
        {debates.length > 0 && (
          <Link href={`/${locale}/history`} className="inline-flex font-bold text-primary hover:underline">
            {dict.progress.seeAllDebates} <span aria-hidden>→</span>
          </Link>
        )}
      </section>
    </div>
  );
}
