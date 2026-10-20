"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { api } from "@/lib/client/api";
import { useApiResource } from "@/lib/client/use-api-resource";
import { useErrorMessage } from "@/lib/client/use-error-message";
import { useSpeechInput } from "@/lib/client/use-speech-input";
import { format } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/provider";
import { LIMITS } from "@/lib/limits";
import { OPPONENT_EMOJI } from "@/lib/opponents";
import type { DebateDetail, DebateMessage } from "@/lib/types";
import { BackButton } from "./back-button";
import { Countdown } from "./countdown";
import { HintPanel } from "./hint-panel";
import { MessageBubble } from "./message-bubble";
import { ResultsView } from "./results-view";
import { Loading, Skeleton, Spinner } from "./skeleton";
import { btnPrimary, btnSecondary, card, errorBox, input } from "./styles";

/** Show the letter count only once it starts to matter. */
const CHARS_WARNING = 80;

export function DebateRoom() {
  const { locale, dict } = useI18n();
  const { id } = useParams<{ id: string }>();
  const errorMessage = useErrorMessage();
  const { data, setData, error: loadError, reload } = useApiResource<{ debate: DebateDetail }>(`/api/debates/${id}`);
  const debate = data?.debate ?? null;

  const setDebate = useCallback(
    (update: (current: DebateDetail) => DebateDetail) =>
      setData((current) => (current ? { debate: update(current.debate) } : current)),
    [setData],
  );

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speechNote, setSpeechNote] = useState(false);
  const log = useRef<HTMLDivElement>(null);

  const speech = useSpeechInput(locale, (text) => setDraft((current) => `${current} ${text}`.trim().slice(0, LIMITS.messageMax)));

  const messageCount = debate?.messages.length ?? 0;
  // Scroll the chat box itself (not the whole page) so the newest message stays in view.
  useEffect(() => {
    const el = log.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messageCount, sending, finishing]);

  if (loadError) {
    return (
      <div className={`${card} mx-auto max-w-xl space-y-4 text-center`}>
        <p role="alert">{loadError}</p>
        <div className="flex justify-center gap-3">
          <button className={btnSecondary} onClick={reload}>
            {dict.common.retry}
          </button>
          <Link href={`/${locale}`} className={btnSecondary}>
            {dict.common.back}
          </Link>
        </div>
      </div>
    );
  }
  if (!debate) {
    return (
      <Loading>
        <div className="space-y-5">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-9 w-3/4" />
          <div className="grid gap-5 lg:grid-cols-[1fr_18rem]">
            <Skeleton className="h-96 rounded-3xl" />
            <Skeleton className="hidden h-64 rounded-3xl lg:block" />
          </div>
        </div>
      </Loading>
    );
  }

  if (debate.review) {
    return <ResultsView debate={debate} review={debate.review} />;
  }

  const opponentName = dict.setup.opponents[debate.opponent].name;
  const opponentEmoji = OPPONENT_EMOJI[debate.opponent];
  const messages = debate.messages.filter((m) => m.channel === "debate");
  const turnsUsed = messages.filter((m) => m.role === "user").length;
  const totalRounds = debate.rounds ?? LIMITS.rounds;
  const allRoundsDone = turnsUsed >= totalRounds;
  const round = Math.min(turnsUsed + 1, totalRounds);

  async function finish() {
    setFinishing(true);
    setError(null);
    try {
      const { debate: reviewed } = await api<{ debate: DebateDetail }>(`/api/debates/${id}/review`, {
        method: "POST",
      });
      setDebate(() => reviewed);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setFinishing(false);
    }
  }

  async function onSend(event: FormEvent) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || sending || allRoundsDone) return;
    setSending(true);
    setError(null);
    try {
      const { messages: added } = await api<{ messages: DebateMessage[] }>(`/api/debates/${id}/messages`, {
        body: { content },
      });
      setDebate((current) => ({ ...current, messages: [...current.messages, ...added] }));
      setDraft("");
      setSending(false);
      // The last round wraps up straight into the results screen.
      if (turnsUsed + 1 >= totalRounds) await finish();
    } catch (e) {
      setError(errorMessage(e));
      setSending(false);
    }
  }

  function onTalk() {
    if (!speech.supported) {
      setSpeechNote(true);
      return;
    }
    speech.toggle();
  }

  const busy = sending || finishing;
  const sideLabel = debate.student_side === "for" ? dict.common.agree : dict.common.disagree;
  const charsLeft = LIMITS.messageMax - draft.length;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <header className="space-y-2">
        <BackButton fallback={`/${locale}`} />
        <h1 className="text-2xl font-black text-balance sm:text-3xl">{debate.topic}</h1>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
            <span
              className={`rounded-full px-3 py-1 ${debate.student_side === "for" ? "bg-good-soft text-good" : "bg-next-soft text-next"}`}
            >
              <span aria-hidden>{debate.student_side === "for" ? "👍" : "👎"} </span>
              {format(dict.arena.yourSide, { side: sideLabel })}
            </span>
            <span className="rounded-full bg-help-soft px-3 py-1 text-help">
              <span aria-hidden>{opponentEmoji} </span>vs {opponentName}
            </span>
            <span className="flex items-center gap-2 rounded-full border-2 border-border px-3 py-0.5 text-muted">
              {format(dict.arena.round, { round, rounds: totalRounds })}
              <span aria-hidden className="flex gap-1">
                {Array.from({ length: totalRounds }, (_, i) => (
                  <span
                    key={i}
                    className={`size-2.5 rounded-full transition-colors ${
                      i < turnsUsed ? "bg-good" : i === turnsUsed && !allRoundsDone ? "bg-primary" : "bg-border"
                    }`}
                  />
                ))}
              </span>
            </span>
          </div>
          {!allRoundsDone && <Countdown key={round} seconds={debate.turn_seconds} paused={busy} />}
        </div>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_18rem]">
        <section aria-label={opponentName} className={`${card} space-y-4`}>
          <div
            ref={log}
            role="log"
            aria-live="polite"
            className="max-h-[min(55vh,32rem)] min-h-56 space-y-4 overflow-y-auto overscroll-contain pr-1"
          >
            {messages.length === 0 && !sending && (
              <div className="flex h-full min-h-52 flex-col items-center justify-center gap-2 text-center">
                <span aria-hidden className="text-5xl motion-safe:animate-bounce">
                  {opponentEmoji}
                </span>
                <p className="max-w-sm text-lg font-semibold text-muted text-balance">
                  {format(dict.arena.youStart, { name: opponentName })}
                </p>
              </div>
            )}
            {messages.map((m) => (
              <MessageBubble
                key={m.id}
                author={m.role === "user" ? dict.common.you : opponentName}
                avatar={m.role === "user" ? "🙂" : opponentEmoji}
                mine={m.role === "user"}
                content={m.content}
              />
            ))}
            {sending && (
              <>
                {/* Show the student's words straight away while the reply is being written. */}
                <MessageBubble author={dict.common.you} avatar="🙂" mine content={draft.trim()} />
                <MessageBubble
                  author={opponentName}
                  avatar={opponentEmoji}
                  mine={false}
                  typingLabel={format(dict.arena.thinking, { name: opponentName })}
                />
              </>
            )}
            {finishing && (
              <p className="flex items-center justify-center gap-2 rounded-2xl bg-primary/10 p-3 font-bold text-primary">
                <Spinner />
                {dict.arena.debateEnds}
              </p>
            )}
          </div>

          {allRoundsDone ? (
            <div className="space-y-3 rounded-2xl bg-good-soft p-4 text-center">
              <p className="text-lg font-bold">
                <span aria-hidden>🎉 </span>
                {dict.arena.wrapUp}
              </p>
              <button className={btnPrimary} disabled={finishing} onClick={() => void finish()}>
                {finishing ? dict.arena.ending : dict.arena.seeResults}
              </button>
            </div>
          ) : (
            <form onSubmit={onSend} className="space-y-3 border-t-2 border-border pt-4">
              <label htmlFor="idea" className="block text-xl font-extrabold">
                {dict.arena.yourTurn}
              </label>
              <textarea
                id="idea"
                value={sending ? "" : draft}
                rows={3}
                maxLength={LIMITS.messageMax}
                placeholder={dict.arena.placeholder}
                disabled={busy}
                aria-describedby="idea-hint"
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  // Enter sends, Shift+Enter adds a line; never interrupt an IME (e.g. Hindi) mid-word.
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
                className={`${input} resize-none`}
              />
              <p id="idea-hint" className={`text-sm ${charsLeft <= CHARS_WARNING ? "font-bold text-timer" : "text-muted"}`}>
                {charsLeft <= CHARS_WARNING ? format(dict.arena.charsLeft, { count: charsLeft }) : dict.arena.enterHint}
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onTalk}
                  disabled={busy}
                  aria-pressed={speech.listening}
                  className={`${btnSecondary} !px-4 ${speech.listening ? "!border-timer !bg-timer-soft !text-timer" : ""}`}
                >
                  <span aria-hidden className={speech.listening ? "motion-safe:animate-pulse" : ""}>
                    🎤
                  </span>
                  {speech.listening ? dict.arena.listening : dict.arena.talk}
                </button>
                <button type="submit" className={`${btnPrimary} flex-1`} disabled={busy || !draft.trim()}>
                  {dict.arena.send} <span aria-hidden>➤</span>
                </button>
              </div>
              {speechNote && <p className="text-sm text-muted">{dict.errors.speech_unsupported}</p>}
            </form>
          )}
          {error && (
            <p role="alert" className={errorBox}>
              {error}
            </p>
          )}
        </section>

        {!allRoundsDone && (
          <HintPanel
            debateId={id}
            round={round}
            disabled={busy}
            onUse={(text) => setDraft((current) => `${current} ${text}`.trim().slice(0, LIMITS.messageMax))}
          />
        )}
      </div>
    </div>
  );
}
