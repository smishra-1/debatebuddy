"use client";

import { useSyncExternalStore } from "react";
import { setTheme, shownTheme, subscribeTheme, type Theme } from "@/lib/client/theme";
import { useI18n } from "@/lib/i18n/provider";

export function ThemeToggle() {
  const { dict } = useI18n();
  const theme = useSyncExternalStore(subscribeTheme, shownTheme, () => null);
  const next: Theme = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={next === "light" ? dict.common.lightMode : dict.common.darkMode}
      title={next === "light" ? dict.common.lightMode : dict.common.darkMode}
      className="grid size-10 place-items-center rounded-xl border-2 border-border text-xl hover:border-primary"
    >
      <span aria-hidden>{theme === null ? "" : theme === "dark" ? "☀️" : "🌙"}</span>
    </button>
  );
}
