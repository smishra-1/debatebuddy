"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client/api";
import { useErrorMessage } from "@/lib/client/use-error-message";
import { format } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/provider";
import { useSettings } from "@/lib/client/settings";
import { LIMITS, ROUND_OPTIONS, TURN_SECONDS, type RoundCount } from "@/lib/limits";
import { OPPONENT_EMOJI } from "@/lib/opponents";
import { getSampleTopic } from "@/lib/topics";
import { DIFFICULTIES, OPPONENTS, type DebateSummary, type Difficulty, type Opponent, type Side } from "@/lib/types";
import { BackButton } from "./back-button";
import { btnPrimary, card, choiceTick, choiceTile as choice, errorBox } from "./styles";

const ROUND_FEEL = ["short", "medium", "long"] as const;
import { Spinner } from "./skeleton";

const Tick = () => (
  <span aria-hidden className={choiceTick}>
    ✓
  </span>
);

export function SetupForm() {
  const { locale, dict } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const errorMessage = useErrorMessage();

  const sample = getSampleTopic(params.get("topic") ?? "");
  const custom = (params.get("custom") ?? "").replace(/\s+/g, " ").trim().slice(0, LIMITS.topicMax);
  const topic = sample?.question[locale] ?? custom;
  const levelParam = params.get("level");
  // Until the student picks something here, the defaults from Settings apply (a ?level= link wins over them).
  const [settings] = useSettings();
  const [pickedLevel, setDifficulty] = useState<Difficulty | null>(DIFFICULTIES.find((d) => d === levelParam) ?? null);
  const [pickedRounds, setRounds] = useState<RoundCount | null>(null);
  const [pickedSeconds, setTurnSeconds] = useState<(typeof TURN_SECONDS)[number] | null>(null);
  const difficulty = pickedLevel ?? settings.difficulty;
  const rounds = pickedRounds ?? settings.rounds;
  const turnSeconds = pickedSeconds ?? settings.turnSeconds;

  const [side, setSide] = useState<Side>("for");
  const [opponent, setOpponent] = useState<Opponent>("fiona");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (topic.length < LIMITS.topicMin) {
    return (
      <div className={`${card} mx-auto max-w-xl space-y-4 text-center`}>
        <p>{dict.setup.needTopic}</p>
        <Link href={`/${locale}`} className={btnPrimary}>
          {dict.common.back}
        </Link>
      </div>
    );
  }

  async function start() {
    setPending(true);
    setError(null);
    try {
      const { debate } = await api<{ debate: DebateSummary }>("/api/debates", {
        body: { topic, side, opponent, difficulty, turnSeconds, rounds, locale },
      });
      router.push(`/${locale}/debate/${debate.id}`);
    } catch (e) {
      setError(errorMessage(e));
      setPending(false);
    }
  }

  const sides: { value: Side; emoji: string; label: string; text?: string }[] = [
    { value: "for", emoji: "👍", label: dict.common.agree, text: sample?.agree[locale] },
    { value: "against", emoji: "👎", label: dict.common.disagree, text: sample?.disagree[locale] },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <BackButton fallback={`/${locale}`} />
      <h1 className="text-3xl font-black">{dict.setup.title}</h1>

      <div className={`${card} flex items-center gap-4 border-primary/30 bg-primary/5`}>
        {sample?.emoji && (
          <span aria-hidden className="grid size-14 shrink-0 place-items-center rounded-2xl bg-card text-4xl">
            {sample.emoji}
          </span>
        )}
        <div>
          <p className="text-sm font-bold text-primary">{dict.setup.yourTopic}</p>
          <p className="text-2xl font-extrabold text-balance">{topic}</p>
        </div>
      </div>

      <fieldset className="space-y-3" disabled={pending}>
        <legend className="mb-2 text-xl font-bold">{dict.setup.pickSide}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {sides.map((item) => (
            <label key={item.value} className={`${choice} items-center gap-3`}>
              <input
                type="radio"
                name="side"
                value={item.value}
                checked={side === item.value}
                onChange={() => setSide(item.value)}
                className="sr-only"
              />
              <Tick />
              <span aria-hidden className="text-3xl">
                {item.emoji}
              </span>
              <span>
                <span className="block text-lg font-extrabold uppercase">{item.label}</span>
                {item.text && <span className="block">{item.text}</span>}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-3" disabled={pending}>
        <legend className="mb-2 text-xl font-bold">{dict.setup.pickOpponent}</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {OPPONENTS.map((value) => (
            <label key={value} className={`${choice} flex-col items-center gap-1 text-center`}>
              <input
                type="radio"
                name="opponent"
                value={value}
                checked={opponent === value}
                onChange={() => setOpponent(value)}
                className="sr-only"
              />
              <Tick />
              <span aria-hidden className="text-4xl">
                {OPPONENT_EMOJI[value]}
              </span>
              <span className="text-lg font-bold">{dict.setup.opponents[value].name}</span>
              <span className="text-sm text-muted">{dict.setup.opponents[value].about}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-3" disabled={pending}>
        <legend className="mb-2 text-xl font-bold">{dict.setup.pickLevel}</legend>
        <div className="grid grid-cols-3 gap-3">
          {DIFFICULTIES.map((value, index) => (
            <label key={value} className={`${choice} flex-col items-center gap-0.5 !p-3 text-center`}>
              <input
                type="radio"
                name="level"
                value={value}
                checked={difficulty === value}
                onChange={() => setDifficulty(value)}
                className="sr-only"
              />
              <Tick />
              <span aria-hidden className="text-lg tracking-wider text-help">
                {"★".repeat(index + 1)}
              </span>
              <span className="text-lg font-bold">{dict.setup.levels[value].name}</span>
              <span className="text-sm text-muted">{dict.setup.levels[value].about}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-3" disabled={pending}>
        <legend className="mb-2 text-xl font-bold">{dict.setup.pickRounds}</legend>
        <div className="grid grid-cols-3 gap-3">
          {ROUND_OPTIONS.map((value, index) => (
            <label key={value} className={`${choice} flex-col items-center gap-0.5 !p-3 text-center`}>
              <input
                type="radio"
                name="rounds"
                value={value}
                checked={rounds === value}
                onChange={() => setRounds(value)}
                className="sr-only"
              />
              <Tick />
              <span className="text-3xl font-black tabular-nums">{value}</span>
              <span className="text-sm font-bold">{dict.setup.roundsWord}</span>
              <span className="text-sm text-muted">{dict.setup.roundsAbout[ROUND_FEEL[index]]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-3" disabled={pending}>
        <legend className="mb-2 text-xl font-bold">{dict.setup.pickTime}</legend>
        <div className="grid grid-cols-2 gap-3">
          {TURN_SECONDS.map((value) => (
            <label key={value} className={`${choice} items-center justify-center gap-2 text-lg font-bold`}>
              <input
                type="radio"
                name="time"
                value={value}
                checked={turnSeconds === value}
                onChange={() => setTurnSeconds(value)}
                className="sr-only"
              />
              <Tick />
              <span aria-hidden>⏱</span> {value === 60 ? dict.setup.minute : dict.setup.twoMinutes}
            </label>
          ))}
        </div>
      </fieldset>

      {error && (
        <p role="alert" className={errorBox}>
          {error}
        </p>
      )}

      {/* Sticks to the bottom on small screens so the start button is always one tap away. */}
      <div className="sticky bottom-0 -mx-4 space-y-2 border-t-2 border-border bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-center backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <button
          type="button"
          onClick={() => void start()}
          disabled={pending}
          aria-busy={pending}
          className={`${btnPrimary} w-full !text-xl`}
        >
          {pending && <Spinner />}
          {pending ? dict.setup.starting : dict.setup.start}
        </button>
        <p className="text-sm text-muted">{format(dict.setup.format, { rounds, minutes: Math.round((rounds * turnSeconds * 1.5) / 60) })}</p>
      </div>
    </div>
  );
}
