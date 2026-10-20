export type Theme = "light" | "dark";

export const THEME_KEY = "debate-buddy:theme";

/** Runs before first paint (inline in <head>) so a saved theme never flashes. */
export const themeInitScript = `try{var t=localStorage.getItem(${JSON.stringify(THEME_KEY)});if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

const EVENT = "debate-buddy:theme-change";

export function subscribeTheme(onChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  window.addEventListener(EVENT, onChange);
  media.addEventListener("change", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    media.removeEventListener("change", onChange);
  };
}

/** The theme the student picked, or "system" when following the device. */
export function chosenTheme(): Theme | "system" {
  const chosen = document.documentElement.dataset.theme;
  return chosen === "light" || chosen === "dark" ? chosen : "system";
}

/** The theme actually showing right now. */
export function shownTheme(): Theme {
  const chosen = chosenTheme();
  if (chosen !== "system") return chosen;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function setTheme(theme: Theme | "system") {
  const root = document.documentElement;
  try {
    if (theme === "system") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, theme);
  } catch {
    // storage unavailable: the choice lasts for this page only
  }
  if (theme === "system") delete root.dataset.theme;
  else root.dataset.theme = theme;
  window.dispatchEvent(new Event(EVENT));
}
