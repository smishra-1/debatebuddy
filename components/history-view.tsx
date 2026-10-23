"use client";

import Link from "next/link";
import { useState } from "react";
import { useApiResource } from "@/lib/client/use-api-resource";
import { format } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/provider";
import { LIMITS } from "@/lib/limits";
import { OPPONENT_EMOJI } from "@/lib/opponents";
import { DEBATE_MAX_STARS, debateStars } from "@/lib/ratings";
import type { DebateStatus, DebateSummary } from "@/lib/types";
import { BackButton } from "./back-button";
import { Mascot } from "./mascot";
import { Loading, Skeleton } from "./skeleton";
import { Stars } from "./stars";
import { btnPrimary, btnSecondary, card, input } from "./styles";

type Filter = "all" | DebateStatus;
const FILTERS: Filter[] = ["all", "ended", "active"];

export function HistoryView() {
  const { locale, dict } = useI18n();
  const t = dict.history;
  const { data, error, reload } = useApiResource<{ debates: DebateSummary[] }>("/api/debates");
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

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

  const needle = query.trim().toLocaleLowerCase(locale);
  const shown = (data?.debates ?? []).filter(
    (d) => (filter === "all" || d.status === filter) && (!needle || d.topic.toLocaleLowerCase(locale).includes(needle)),
  );
  const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackButton fallback={`/${locale}`} />
      <header className="space-y-1">
        <h1 className="text-3xl font-black">
          <span aria-hidden>📜</span> {t.title}
        </h1>
        <p className="text-lg text-muted">{t.subtitle}</p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label htmlFor="history-search" className="sr-only">
          {t.search}
        </label>
        <input
          id="history-search"
          type="search"
          value={query}
          placeholder={`🔎 ${t.search}`}
          onChange={(e) => setQuery(e.target.value)}
          className={`${input} sm:flex-1`}
        />
        <div role="group" aria-label={t.filterLabel} className="flex shrink-0 rounded-2xl border-2 border-border bg-card p-1">
          {FILTERS.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
              className={`flex-1 whitespace-nowrap rounded-xl px-3 py-2 font-bold transition-colors ${
                filter === value ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground"
              }`}
            >
              {t.filters[value]}
            </button>
          ))}
        </div>
      </div>

      {!data ? (
        <Loading>
          <div className="space-y-3">
            <Skeleton className="h-20 rounded-3xl" />
            <Skeleton className="h-20 rounded-3xl" />
            <Skeleton className="h-20 rounded-3xl" />
          </div>
        </Loading>
      ) : data.debates.length === 0 ? (
        <div className={`${card} space-y-3 text-center`}>
          <Mascot className="mx-auto w-32" />
          <p className="text-muted">{dict.progress.empty}</p>
          <Link href={`/${locale}`} className={btnPrimary}>
            {dict.progress.startFirst}
          </Link>
        </div>
      ) : (
        <>
          <p aria-live="polite" className="text-sm font-bold text-muted">
            {format(t.count, { count: shown.length })}
          </p>
          {shown.length === 0 ? (
            <p className={`${card} text-center text-muted`}>{t.empty}</p>
          ) : (
            <ul className="space-y-3">
              {shown.map((debate) => (
                <li key={debate.id}>
                  <Link
                    href={`/${locale}/debate/${debate.id}`}
                    className={`${card} flex items-center gap-4 !p-4 transition-colors hover:border-primary`}
                  >
                    <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-2xl">
                      {OPPONENT_EMOJI[debate.opponent]}
                    </span>
                    <span className="min-w-0 flex-1 space-y-1">
                      <span className="block text-lg font-bold leading-snug">{debate.topic}</span>
                      <span className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted">
                        <span>{dateFormat.format(new Date(debate.created_at))}</span>
                        <span>{format(t.vs, { opponent: dict.setup.opponents[debate.opponent].name })}</span>
                        <span>{debate.student_side === "for" ? dict.common.youAgreed : dict.common.youDisagreed}</span>
                        <span>{format(t.roundsLabel, { rounds: debate.rounds ?? LIMITS.rounds })}</span>
                      </span>
                    </span>
                    {debate.review ? (
                      <Stars count={debateStars(debate.review.ratings)} max={DEBATE_MAX_STARS} className="text-lg" />
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
        </>
      )}
    </div>
  );
}
