"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { api } from "@/lib/client/api";
import { useErrorMessage } from "@/lib/client/use-error-message";
import { useI18n } from "@/lib/i18n/provider";
import { LIMITS } from "@/lib/limits";
import { Mascot } from "./mascot";
import { MessageBubble } from "./message-bubble";
import { btnChip, btnPrimary, errorBox, input } from "./styles";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** Floating "Ask Buddy" chat on the home screen for doubts about debating. The chat lives only in this tab. */
export function AskBuddy() {
  const { locale, dict } = useI18n();
  const t = dict.ask;
  const errorMessage = useErrorMessage();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const log = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) field.current?.focus();
  }, [open]);

  useEffect(() => {
    const el = log.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, asking]);

  function close() {
    setOpen(false);
    // The launcher is hidden while the chat is open; focus it once it shows again.
    requestAnimationFrame(() => launcher.current?.focus());
  }

  async function ask(text: string) {
    const content = text.trim().slice(0, LIMITS.messageMax);
    if (!content || asking) return;
    const next: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(next);
    setDraft("");
    setAsking(true);
    setError(null);
    try {
      const { answer } = await api<{ answer: string }>("/api/ask", {
        body: { locale, messages: next.slice(-LIMITS.askHistoryMax) },
      });
      setMessages((current) => [...current, { role: "assistant", content: answer }]);
    } catch (e) {
      setError(errorMessage(e));
      // Put the question back so the student doesn't have to type it again.
      setMessages(messages);
      setDraft(content);
    } finally {
      setAsking(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void ask(draft);
  }

  return (
    <>
      <button
          ref={launcher}
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="ask-buddy"
          className={`fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 ${open ? "hidden" : "flex"} animate-pop-in items-center gap-2 rounded-full bg-primary py-3 pr-5 pl-3 text-lg font-extrabold text-primary-foreground shadow-[0_5px_0_var(--primary-depth),0_10px_30px_-10px_rgba(0,0,0,0.4)] transition-transform hover:-translate-y-0.5 active:translate-y-0.5`}
        >
          <span aria-hidden className="grid size-9 place-items-center overflow-hidden rounded-full bg-card">
            <Mascot variant="face" className="size-full object-contain p-0.5" />
          </span>
          {t.open}
        </button>

      {open && (
        <section
          id="ask-buddy"
          role="dialog"
          aria-labelledby="ask-buddy-title"
          onKeyDown={(e) => e.key === "Escape" && close()}
          className="fixed inset-x-2 bottom-2 z-50 flex max-h-[min(36rem,calc(100dvh-5rem))] animate-pop-in flex-col overflow-hidden rounded-3xl border-2 border-border bg-card shadow-2xl sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-[24rem]"
        >
          <header className="flex items-center gap-3 border-b-2 border-border bg-primary/8 px-4 py-3">
            <span aria-hidden className="grid size-10 place-items-center overflow-hidden rounded-full bg-card">
              <Mascot variant="face" className="size-full object-contain p-0.5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="ask-buddy-title" className="font-extrabold">
                {t.title}
              </h2>
              <p className="truncate text-sm text-muted">{t.subtitle}</p>
            </div>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setMessages([]);
                  setError(null);
                }}
                disabled={asking}
                className="rounded-lg px-2 py-1 text-sm font-bold text-muted hover:bg-primary/10 hover:text-foreground"
              >
                {t.clear}
              </button>
            )}
            <button
              type="button"
              onClick={close}
              aria-label={t.close}
              className="grid size-9 place-items-center rounded-xl text-xl text-muted hover:bg-against/10 hover:text-against"
            >
              <span aria-hidden>✕</span>
            </button>
          </header>

          <div ref={log} role="log" aria-live="polite" className="flex-1 space-y-4 overflow-y-auto overscroll-contain p-4">
            <MessageBubble author={t.title} avatar="mascot" mine={false} content={t.greeting} />
            {messages.map((m, i) => (
              <MessageBubble
                key={i}
                author={m.role === "user" ? dict.common.you : t.title}
                avatar={m.role === "user" ? "🙂" : "mascot"}
                mine={m.role === "user"}
                content={m.content}
              />
            ))}
            {asking && <MessageBubble author={t.title} avatar="mascot" mine={false} typingLabel={t.thinking} />}
            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2">
                {t.suggestions.map((s) => (
                  <button key={s} type="button" className={`${btnChip} !text-sm`} onClick={() => void ask(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}
            {error && (
              <p role="alert" className={errorBox}>
                {error}
              </p>
            )}
          </div>

          <form onSubmit={onSubmit} className="flex gap-2 border-t-2 border-border p-3">
            <label htmlFor="ask-buddy-input" className="sr-only">
              {t.placeholder}
            </label>
            <input
              ref={field}
              id="ask-buddy-input"
              value={draft}
              maxLength={LIMITS.messageMax}
              placeholder={t.placeholder}
              disabled={asking}
              onChange={(e) => setDraft(e.target.value)}
              className={`${input} !py-2.5 !text-base`}
            />
            <button type="submit" disabled={asking || !draft.trim()} className={`${btnPrimary} !px-4 !py-2.5 !text-base`}>
              {t.send}
            </button>
          </form>
        </section>
      )}
    </>
  );
}
