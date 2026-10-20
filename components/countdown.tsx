"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/provider";

interface Props {
  seconds: number;
  paused: boolean;
}

/** Per-turn timer. Mount it with a new `key` per round to restart it. Running out never blocks sending. */
export function Countdown({ seconds, paused }: Props) {
  const { dict } = useI18n();
  const [left, setLeft] = useState(seconds);
  const latest = useRef(seconds);

  useEffect(() => {
    if (paused) return;
    const end = Date.now() + latest.current * 1000;
    const id = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      latest.current = remaining;
      setLeft(remaining);
    }, 250);
    return () => clearInterval(id);
  }, [paused]);

  const time = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
  const urgent = left <= 10;
  const done = left === 0;
  return (
    <div className="flex flex-col items-end gap-1">
      <p
        role="timer"
        aria-label={format(dict.arena.timeLeft, { time })}
        className={`flex items-center gap-2 rounded-full px-4 py-2 text-lg font-extrabold tabular-nums transition-colors ${
          urgent ? "bg-against/15 text-against" : "bg-timer-soft text-timer"
        } ${urgent && !done ? "motion-safe:animate-pulse" : ""}`}
      >
        <span aria-hidden>⏱</span> {time}
      </p>
      <span aria-hidden className="h-1.5 w-full overflow-hidden rounded-full bg-border/60">
        <span
          className={`block h-full rounded-full transition-[width] duration-300 ease-linear ${urgent ? "bg-against" : "bg-timer"}`}
          style={{ width: `${(left / seconds) * 100}%` }}
        />
      </span>
      {/* Announced once when it appears; sending is still allowed. */}
      {done && (
        <p role="status" className="animate-fade-up text-sm font-bold text-against">
          {dict.arena.timeUp}
        </p>
      )}
    </div>
  );
}
