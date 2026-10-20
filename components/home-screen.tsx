"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/client/api";
import { useApiResource } from "@/lib/client/use-api-resource";
import { useErrorMessage } from "@/lib/client/use-error-message";
import { useI18n } from "@/lib/i18n/provider";
import { LIMITS } from "@/lib/limits";
import { OPPONENT_EMOJI } from "@/lib/opponents";
import { debateStars } from "@/lib/ratings";
import { sampleTopics } from "@/lib/topics";
import type { DebateSummary } from "@/lib/types";
import { AskBuddy } from "./ask-buddy";
import { Skeleton, Spinner } from "./skeleton";
import { Stars } from "./stars";
import { btnChip, btnPrimary, btnSecondary, card, errorBox, input, textLink } from "./styles";

// Themes for "Surprise me": a random one is sent to the AI so every surprise topic is new.
const SURPRISE_THEMES = [
  "space", "dinosaurs", "oceans", "robots", "sports", "music", "art", "cooking", "holidays", "weather",
  "insects", "books", "festivals", "trains", "jungles", "superheroes", "farms", "friendship", "inventions",
  "the future", "playgrounds", "rainy days", "museums", "birds", "magic tricks", "mountains", "recycling",
];
const pick = <T,>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];

export function HomeScreen() {
  const { locale, dict } = useI18n();
  const router = useRouter();
  const errorMessage = useErrorMessage();
  const [own, setOwn] = useState("");
  const [fresh, setFresh] = useState<string[] | null>(null);
  const [busy, setBusy] = useState<"refresh" | "surprise" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { data } = useApiResource<{ debates: DebateSummary[] }>("/api/debates");
  const recent = data?.debates.slice(0, 4) ?? [];
  const unfinished = data?.debates.find((d) => d.status === "active");

  // Difficulty, side and opponent are all picked on the setup screen.
  const start = (query: string) => router.push(`/${locale}/setup?${query}`);

  function onOwn(event: FormEvent) {
    event.preventDefault();
    const topic = own.trim();
    if (topic.length >= LIMITS.topicMin) start(`custom=${encodeURIComponent(topic)}`);
  }

  const aiTopics = (interest?: string) =>
    api<{ topics: string[] }>("/api/topics", { body: { locale, ...(interest ? { interest } : {}) } }).then((r) => r.topics);

  async function refresh() {
    setBusy("refresh");
    setError(null);
    try {
      setFresh(await aiTopics(pick(SURPRISE_THEMES)));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  /** Invents a brand-new topic on the fly; if the AI is busy, falls back to a starter topic. */
  async function surprise() {
    setBusy("surprise");
    setError(null);
    try {
      start(`custom=${encodeURIComponent(pick(await aiTopics(pick(SURPRISE_THEMES))))}`);
    } catch {
      start(`topic=${pick(sampleTopics).id}`);
    }
  }

  return (
    <div className="space-y-8">
      {unfinished && (
        <Link
          href={`/${locale}/debate/${unfinished.id}`}
          className="group flex animate-fade-up items-center gap-4 rounded-3xl border-2 border-timer/40 bg-timer-soft p-4 transition-colors hover:border-timer sm:p-5"
        >
          <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-2xl bg-card text-3xl">
            {OPPONENT_EMOJI[unfinished.opponent]}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold text-timer">{dict.home.continueTitle}</span>
            <span className="block truncate text-lg font-extrabold">{unfinished.topic}</span>
          </span>
          <span className="hidden shrink-0 items-center gap-1 rounded-2xl bg-timer px-4 py-2 font-extrabold text-card sm:flex">
            {dict.home.continueButton}
            <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </span>
        </Link>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_19rem]">
        <section aria-labelledby="home-title" className="space-y-6">
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-1">
              <h1 id="home-title" className="text-3xl font-black text-balance sm:text-4xl">
                {dict.home.title}
              </h1>
              <p className="text-lg text-muted">{dict.home.tapTopic}</p>
            </div>
            <button
              type="button"
              onClick={() => void surprise()}
              disabled={busy !== null}
              aria-busy={busy === "surprise"}
              className={`${btnSecondary} !px-5 !py-2.5`}
            >
              {busy === "surprise" ? <Spinner /> : <span aria-hidden>🎲</span>}
              {busy === "surprise" ? dict.home.surpriseLoading : dict.home.surprise}
            </button>
          </header>

          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/${locale}/learn`} className={btnChip}>
              <span aria-hidden>📖</span> {dict.home.whatIsDebate}
            </Link>
            <Link href={`/${locale}/how-to-play`} className={btnChip}>
              <span aria-hidden>❓</span> {dict.home.howToPlay}
            </Link>
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={busy !== null}
              aria-busy={busy === "refresh"}
              className={`${btnChip} sm:ml-auto`}
            >
              {busy === "refresh" ? <Spinner /> : <span aria-hidden>🔄</span>}
              {busy === "refresh" ? dict.home.refreshing : dict.home.refreshTopics}
            </button>
          </div>

          {error && (
            <p role="alert" className={errorBox}>
              {error}
            </p>
          )}

          {fresh && (
            <div className="flex flex-wrap items-center justify-between gap-2" aria-live="polite">
              <h2 className="text-lg font-extrabold">
                <span aria-hidden>✨</span> {dict.home.freshTopics}
              </h2>
              <button type="button" onClick={() => setFresh(null)} className={textLink}>
                <span aria-hidden>↩</span> {dict.home.starterTopics}
              </button>
            </div>
          )}

          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {fresh?.map((topic, i) => (
              <li key={topic}>
                <button
                  type="button"
                  onClick={() => start(`custom=${encodeURIComponent(topic)}`)}
                  style={{ animationDelay: `${i * 50}ms` }}
                  className="flex h-full w-full animate-pop-in flex-col items-start gap-2 rounded-3xl border-2 border-next/30 bg-card p-4 text-left shadow-[0_3px_0_var(--border)] transition-[border-color,transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:border-next hover:shadow-[0_5px_0_var(--next)] active:translate-y-0.5 active:shadow-none"
                >
                  <span aria-hidden className="text-4xl">
                    ✨
                  </span>
                  <span className="text-lg font-bold leading-snug">{topic}</span>
                </button>
              </li>
            ))}
            {!fresh && sampleTopics.map((topic) => (
              <li key={topic.id}>
                <button
                  type="button"
                  onClick={() => start(`topic=${topic.id}`)}
                  className="group flex h-full w-full flex-col items-start gap-2 rounded-3xl border-2 border-border bg-card p-4 text-left shadow-[0_3px_0_var(--border)] transition-[border-color,transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_5px_0_var(--primary)] active:translate-y-0.5 active:shadow-none"
                >
                  <span
                    aria-hidden
                    className="text-4xl transition-transform duration-200 group-hover:-rotate-6 group-hover:scale-110"
                  >
                    {topic.emoji}
                  </span>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-bold text-primary">
                    {dict.home.categories[topic.category]}
                  </span>
                  <span className="text-lg font-bold leading-snug">{topic.question[locale]}</span>
                </button>
              </li>
            ))}
          </ul>

          <form onSubmit={onOwn} className={`${card} space-y-3`}>
            <label htmlFor="own-topic" className="block text-lg font-bold">
              <span aria-hidden>✏️</span> {dict.home.ownTopic}
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="own-topic"
                value={own}
                maxLength={LIMITS.topicMax}
                placeholder={dict.home.ownPlaceholder}
                onChange={(e) => setOwn(e.target.value)}
                className={input}
              />
              <button type="submit" className={btnPrimary} disabled={own.trim().length < LIMITS.topicMin}>
                {dict.home.ownGo}
              </button>
            </div>
          </form>

          <Link href={`/${locale}/topics`} className={textLink}>
            {dict.home.moreTopics} <span aria-hidden>→</span>
          </Link>
        </section>

        <aside>
          <section className={`${card} space-y-3 lg:sticky lg:top-24`} aria-labelledby="last-debates">
            <h2 id="last-debates" className="text-lg font-extrabold">
              {dict.home.myLast}
            </h2>
            {!data ? (
              <div className="space-y-2" aria-hidden>
                <Skeleton className="h-11" />
                <Skeleton className="h-11" />
                <Skeleton className="h-11" />
              </div>
            ) : recent.length === 0 ? (
              <p className="rounded-2xl border-2 border-dashed border-border p-4 text-center text-muted">
                <span aria-hidden className="mb-1 block text-3xl">
                  🌱
                </span>
                {dict.home.noDebates}
              </p>
            ) : (
              <ul className="-mx-2 space-y-1">
                {recent.map((debate) => (
                  <li key={debate.id}>
                    <Link
                      href={`/${locale}/debate/${debate.id}`}
                      className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-primary/8"
                    >
                      <span aria-hidden className="text-2xl">
                        {OPPONENT_EMOJI[debate.opponent]}
                      </span>
                      <span className="line-clamp-2 min-w-0 flex-1 font-semibold leading-snug">{debate.topic}</span>
                      {debate.review ? (
                        <Stars count={debateStars(debate.review.ratings)} />
                      ) : (
                        <span className="shrink-0 rounded-full bg-timer-soft px-2 py-0.5 text-xs font-bold text-timer">
                          {dict.progress.inProgress}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link href={`/${locale}/progress`} className={textLink}>
              {dict.home.seeProgress} <span aria-hidden>→</span>
            </Link>
          </section>
        </aside>
      </div>
      <AskBuddy />
    </div>
  );
}
