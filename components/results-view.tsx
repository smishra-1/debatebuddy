"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/client/api";
import { useErrorMessage } from "@/lib/client/use-error-message";
import { useUser } from "@/lib/client/use-user";
import { format } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/provider";
import { LIMITS } from "@/lib/limits";
import { OPPONENT_EMOJI } from "@/lib/opponents";
import { DEBATE_MAX_STARS, debateStars, skillKeys } from "@/lib/ratings";
import { sampleTopics } from "@/lib/topics";
import type { DebateDetail, DebateMessage, Review } from "@/lib/types";
import { BackButton } from "./back-button";
import { Mascot } from "./mascot";
import { MessageBubble } from "./message-bubble";
import { Stars } from "./stars";
import { btnChip, btnPrimary, btnSecondary, card, errorBox, input } from "./styles";

export function ResultsView({ debate, review }: { debate: DebateDetail; review: Review }) {
  const { locale, dict } = useI18n();
  const router = useRouter();
  const name = useUser()?.name ?? "";
  const errorMessage = useErrorMessage();
  const [coachMessages, setCoachMessages] = useState(() => debate.messages.filter((m) => m.channel === "coach"));
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);

  const opponentName = dict.setup.opponents[debate.opponent].name;
  const transcript = debate.messages.filter((m) => m.channel === "debate");
  const score = debateStars(review.ratings);
  const sample = sampleByQuestion(debate.topic);
  const sideText = debate.student_side === "for" ? dict.common.youAgreed : dict.common.youDisagreed;
  const setupHref = sample ? `/${locale}/setup?topic=${sample}` : `/${locale}/setup?custom=${encodeURIComponent(debate.topic)}`;

  async function ask(text: string) {
    const content = text.trim();
    if (!content || asking) return;
    setAsking(true);
    setPendingQuestion(content);
    setError(null);
    try {
      const { messages } = await api<{ messages: DebateMessage[] }>(`/api/debates/${debate.id}/coach`, {
        body: { question: content },
      });
      setCoachMessages((current) => [...current, ...messages]);
      setQuestion("");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setAsking(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void ask(question);
  }

  async function onDelete() {
    if (!window.confirm(dict.arena.deleteConfirm)) return;
    try {
      await api(`/api/debates/${debate.id}`, { method: "DELETE" });
      router.push(`/${locale}`);
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackButton fallback={`/${locale}/history`} />
      <header className={`${card} flex animate-pop-in flex-col items-center gap-3 border-help/40 text-center sm:flex-row sm:text-left`}>
        <div className="flex shrink-0 flex-col items-center rounded-3xl bg-help-soft px-6 py-4">
          <span className="text-sm font-bold text-help">{dict.results.yourScore}</span>
          <span className="text-5xl font-black text-help tabular-nums">{score}/{DEBATE_MAX_STARS}</span>
          <span aria-hidden className="text-2xl text-help">★</span>
        </div>
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-balance sm:text-4xl">
            {name ? format(dict.results.great, { name }) : dict.results.greatAnon} <span aria-hidden>🎉</span>
          </h1>
          <p className="font-semibold text-muted">
            {format(dict.results.summaryLine, { topic: debate.topic, side: sideText, opponent: opponentName })}
          </p>
          <p className="text-lg">{review.summary}</p>
        </div>
        <Mascot className="hidden w-24 shrink-0 md:block" />
      </header>

      <div className="grid gap-5 md:grid-cols-2">
        <section className={card} aria-labelledby="skills">
          <h2 id="skills" className="mb-3 text-xl font-extrabold">
            {dict.results.yourSkills}
          </h2>
          <ul className="space-y-3">
            {skillKeys.map((key) => (
              <li key={key} className="flex items-center justify-between gap-3 text-lg font-semibold">
                <span>{dict.results.skills[key]}</span>
                <Stars count={review.ratings[key]} showEmpty className="text-xl" />
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-2 rounded-3xl border-2 border-help/40 bg-help-soft p-5" aria-labelledby="best">
          <h2 id="best" className="text-xl font-extrabold text-help">
            🏆 {dict.results.bestIdea}
          </h2>
          <blockquote className="text-xl font-semibold">&ldquo;{review.bestIdea.quote}&rdquo;</blockquote>
          <p>{format(dict.results.whyGreat, { why: review.bestIdea.why })}</p>
        </section>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <section className="rounded-3xl border-2 border-good/40 bg-good-soft p-5" aria-labelledby="good">
          <h2 id="good" className="mb-2 text-xl font-extrabold text-good">
            <span aria-hidden>👍</span> {dict.results.goodAt}
          </h2>
          <ul className="list-disc space-y-1 pl-5 text-lg">
            {review.wentWell.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>
        <section className="rounded-3xl border-2 border-next/40 bg-next-soft p-5" aria-labelledby="next">
          <h2 id="next" className="mb-2 text-xl font-extrabold text-next">
            <span aria-hidden>🌱</span> {dict.results.tryNext}
          </h2>
          <ul className="list-disc space-y-1 pl-5 text-lg">
            {review.tryNextTime.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href={setupHref} className={btnPrimary}>
          <span aria-hidden>🔁</span> {dict.results.playAgain}
        </Link>
        <Link href={`/${locale}`} className={btnSecondary}>
          <span aria-hidden>🎲</span> {dict.results.newTopic}
        </Link>
        <Link href={`/${locale}/progress`} className={btnSecondary}>
          {dict.results.myProgress} <span aria-hidden>→</span>
        </Link>
      </div>

      {transcript.length > 0 && (
        <details className={`${card} group !p-0`}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-3xl p-5 text-lg font-extrabold hover:text-primary sm:p-6 [&::-webkit-details-marker]:hidden">
            <span>
              <span aria-hidden>📜</span> {dict.results.transcript}
            </span>
            <span aria-hidden className="transition-transform group-open:rotate-180">
              ▾
            </span>
          </summary>
          <div className="space-y-4 border-t-2 border-border p-5 sm:p-6">
            {transcript.map((m) => (
              <MessageBubble
                key={m.id}
                author={m.role === "user" ? dict.common.you : opponentName}
                avatar={m.role === "user" ? "🙂" : OPPONENT_EMOJI[debate.opponent]}
                mine={m.role === "user"}
                content={m.content}
              />
            ))}
          </div>
        </details>
      )}

      <section className={`${card} space-y-4`} aria-labelledby="coach-title">
        <div>
          <h2 id="coach-title" className="text-xl font-extrabold">
            <span aria-hidden>🧑‍🏫</span> {dict.results.askTitle}
          </h2>
          <p className="text-muted">{dict.results.askSubtitle}</p>
        </div>
        {coachMessages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {dict.results.suggestions.map((s) => (
              <button
                key={s}
                type="button"
                className={btnChip}
                disabled={asking}
                onClick={() => void ask(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <div role="log" aria-live="polite" className="space-y-4">
          {coachMessages.map((m) => (
            <MessageBubble
              key={m.id}
              author={m.role === "user" ? dict.common.you : dict.common.coach}
              avatar={m.role === "user" ? "🙂" : "🧑‍🏫"}
              mine={m.role === "user"}
              content={m.content}
            />
          ))}
          {asking && (
            <>
              <MessageBubble author={dict.common.you} avatar="🙂" mine content={pendingQuestion} />
              <MessageBubble author={dict.common.coach} avatar="🧑‍🏫" mine={false} typingLabel={dict.results.asking} />
            </>
          )}
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
          <label htmlFor="coach-question" className="sr-only">
            {dict.results.askPlaceholder}
          </label>
          <input
            id="coach-question"
            value={asking ? "" : question}
            maxLength={LIMITS.questionMax}
            placeholder={dict.results.askPlaceholder}
            disabled={asking}
            onChange={(e) => setQuestion(e.target.value)}
            className={input}
          />
          <button type="submit" className={btnPrimary} disabled={asking || !question.trim()}>
            {dict.results.ask}
          </button>
        </form>
        {error && (
          <p role="alert" className={errorBox}>
            {error}
          </p>
        )}
      </section>

      <div className="flex justify-end border-t-2 border-border pt-4">
        <button
          type="button"
          className="rounded-xl px-3 py-2 text-sm font-bold text-muted transition-colors hover:bg-against/10 hover:text-against"
          onClick={() => void onDelete()}
        >
          <span aria-hidden>🗑</span> {dict.common.delete}
        </button>
      </div>
    </div>
  );
}

function sampleByQuestion(topic: string): string | undefined {
  return sampleTopics.find((t) => Object.values(t.question).includes(topic))?.id;
}
