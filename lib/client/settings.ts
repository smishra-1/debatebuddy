"use client";

import { useCallback, useSyncExternalStore } from "react";
import { LIMITS, ROUND_OPTIONS, TURN_SECONDS, type RoundCount } from "@/lib/limits";
import { DIFFICULTIES, type Difficulty } from "@/lib/types";

/** Debate defaults the student picks on the settings page; kept on this device only. */
export interface Settings {
  rounds: RoundCount;
  turnSeconds: (typeof TURN_SECONDS)[number];
  difficulty: Difficulty;
}

const KEY = "debate-buddy:settings";
const EVENT = "debate-buddy:settings-change";
export const DEFAULT_SETTINGS: Settings = { rounds: LIMITS.rounds, turnSeconds: TURN_SECONDS[0], difficulty: "easy" };

let cachedRaw: string | null | undefined;
let cached: Settings = DEFAULT_SETTINGS;

function read(): Settings {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    // storage blocked: defaults
  }
  if (raw === cachedRaw) return cached; // keep the same object so React doesn't re-render forever
  cachedRaw = raw;
  let saved: Partial<Record<keyof Settings, unknown>> = {};
  try {
    saved = raw ? JSON.parse(raw) : {};
  } catch {
    // corrupted value: defaults
  }
  cached = {
    rounds: ROUND_OPTIONS.find((n) => n === saved.rounds) ?? DEFAULT_SETTINGS.rounds,
    turnSeconds: TURN_SECONDS.find((n) => n === saved.turnSeconds) ?? DEFAULT_SETTINGS.turnSeconds,
    difficulty: DIFFICULTIES.find((d) => d === saved.difficulty) ?? DEFAULT_SETTINGS.difficulty,
  };
  return cached;
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useSettings(): [Settings, (patch: Partial<Settings>) => void] {
  const settings = useSyncExternalStore(subscribe, read, () => DEFAULT_SETTINGS);
  const update = useCallback((patch: Partial<Settings>) => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...read(), ...patch }));
    } catch {
      // storage unavailable: nothing to save
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return [settings, update];
}
