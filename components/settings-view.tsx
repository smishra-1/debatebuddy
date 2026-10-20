"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useSettings, type Settings } from "@/lib/client/settings";
import { chosenTheme, setTheme, subscribeTheme } from "@/lib/client/theme";
import { format, localeNames, locales } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/provider";
import { ROUND_OPTIONS, TURN_SECONDS } from "@/lib/limits";
import { DIFFICULTIES } from "@/lib/types";
import { BackButton } from "./back-button";
import { card, choiceTick, choiceTile, textLink } from "./styles";

const THEMES = [
  { value: "light", emoji: "☀️" },
  { value: "dark", emoji: "🌙" },
  { value: "system", emoji: "💻" },
] as const;

const Tick = () => (
  <span aria-hidden className={choiceTick}>
    ✓
  </span>
);

interface Option<T> {
  value: T;
  label: string;
}

/** A row of radio tiles; every change is saved straight away. */
function Choices<T extends string | number>({
  name,
  legend,
  options,
  value,
  onChange,
}: {
  name: string;
  legend: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 font-bold">{legend}</legend>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map((option) => (
          <label key={option.value} className={`${choiceTile} items-center justify-center !p-3 text-center font-bold`}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            <Tick />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function SettingsView() {
  const { locale, dict } = useI18n();
  const pathname = usePathname();
  const t = dict.settings;
  const [settings, update] = useSettings();
  const theme = useSyncExternalStore(subscribeTheme, chosenTheme, () => "system" as const);
  const [savedAt, setSavedAt] = useState(0);

  useEffect(() => {
    if (!savedAt) return;
    const id = setTimeout(() => setSavedAt(0), 1800);
    return () => clearTimeout(id);
  }, [savedAt]);

  const save = (patch: Partial<Settings>) => {
    update(patch);
    setSavedAt(Date.now());
  };
  const rest = pathname.split("/").slice(2).join("/");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <BackButton fallback={`/${locale}`} />
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-3xl font-black">
            <span aria-hidden>⚙️</span> {t.title}
          </h1>
          <p className="text-lg text-muted">{t.subtitle}</p>
        </div>
        <p role="status" className={`rounded-full bg-good-soft px-3 py-1 font-bold text-good transition-opacity ${savedAt ? "opacity-100" : "opacity-0"}`}>
          {savedAt ? `✓ ${t.saved}` : ""}
        </p>
      </header>

      <section aria-labelledby="look" className={`${card} space-y-5`}>
        <h2 id="look" className="text-xl font-extrabold">
          {t.look}
        </h2>
        <fieldset className="space-y-2">
          <legend className="mb-2 font-bold">{t.theme}</legend>
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map((option) => (
              <label key={option.value} className={`${choiceTile} flex-col items-center gap-1 !p-3 text-center font-bold`}>
                <input
                  type="radio"
                  name="theme"
                  value={option.value}
                  checked={theme === option.value}
                  onChange={() => {
                    setTheme(option.value);
                    setSavedAt(Date.now());
                  }}
                  className="sr-only"
                />
                <Tick />
                <span aria-hidden className="text-2xl">
                  {option.emoji}
                </span>
                <span className="text-sm sm:text-base">{t.themes[option.value]}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="space-y-2">
          <p className="font-bold" id="language-label">
            {t.language}
          </p>
          <div role="group" aria-labelledby="language-label" className="grid grid-cols-2 gap-2">
            {locales.map((target) => (
              <Link
                key={target}
                href={`/${target}/${rest}`}
                lang={target}
                hrefLang={target}
                aria-current={target === locale ? "true" : undefined}
                className={`${choiceTile} items-center justify-center !p-3 font-bold aria-[current=true]:border-good aria-[current=true]:bg-good-soft`}
              >
                {localeNames[target]}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="defaults" className={`${card} space-y-5`}>
        <div>
          <h2 id="defaults" className="text-xl font-extrabold">
            {t.defaults}
          </h2>
          <p className="text-muted">{t.defaultsHint}</p>
        </div>
        <Choices
          name="rounds"
          legend={t.rounds}
          value={settings.rounds}
          onChange={(rounds) => save({ rounds })}
          options={ROUND_OPTIONS.map((n) => ({ value: n, label: format(dict.setup.roundsCount, { count: n }) }))}
        />
        <Choices
          name="time"
          legend={t.time}
          value={settings.turnSeconds}
          onChange={(turnSeconds) => save({ turnSeconds })}
          options={TURN_SECONDS.map((n) => ({ value: n, label: n === 60 ? dict.setup.minute : dict.setup.twoMinutes }))}
        />
        <Choices
          name="level"
          legend={t.level}
          value={settings.difficulty}
          onChange={(difficulty) => save({ difficulty })}
          options={DIFFICULTIES.map((d) => ({ value: d, label: dict.setup.levels[d].name }))}
        />
      </section>

      <section aria-labelledby="account" className={`${card} space-y-2`}>
        <h2 id="account" className="text-xl font-extrabold">
          {t.account}
        </h2>
        <Link href={`/${locale}/profile`} className={textLink}>
          <span aria-hidden>👤</span> {t.openProfile} <span aria-hidden>→</span>
        </Link>
      </section>
    </div>
  );
}
