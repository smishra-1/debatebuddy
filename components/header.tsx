"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApiResource } from "@/lib/client/use-api-resource";
import { useUser } from "@/lib/client/use-user";
import { format, localeNames, locales, type Locale } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/provider";
import { useTrackNavigation } from "./back-button";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { totalStars } from "@/lib/ratings";
import type { DebateSummary } from "@/lib/types";

const iconButton =
  "grid size-10 place-items-center rounded-xl border-2 border-border text-xl transition-colors hover:border-primary aria-[current=page]:border-primary aria-[current=page]:bg-primary/10";

export function Header() {
  const { locale, dict } = useI18n();
  const pathname = usePathname();
  const user = useUser();
  useTrackNavigation();
  const name = user?.name ?? "";
  // Only fetched when signed in; re-fetched on navigation so the star count is fresh after each debate.
  const { data } = useApiResource<{ debates: DebateSummary[] }>(user ? "/api/debates" : null, pathname);

  const stars = data ? totalStars(data.debates) : null;
  const section = pathname.split("/")[2] ?? "";

  const switchHref = (target: Locale) => {
    const rest = pathname.split("/").slice(2).join("/");
    return `/${target}${rest ? `/${rest}` : ""}`;
  };

  // Setup and the debate room belong to the "Debate" tab.
  const nav = [
    { href: `/${locale}`, label: dict.header.home, emoji: "💬", active: ["", "setup", "debate"].includes(section) },
    { href: `/${locale}/topics`, label: dict.header.topics, emoji: "📚", active: section === "topics" },
    { href: `/${locale}/progress`, label: dict.header.progress, emoji: "🗺", active: ["progress", "badges"].includes(section) },
    { href: `/${locale}/history`, label: dict.header.history, emoji: "📜", active: section === "history" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b-2 border-border bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6">
        <Link href={`/${locale}`} aria-label={dict.meta.title} className="shrink-0 rounded-xl">
          <Logo title={dict.meta.title} compact />
        </Link>

        {user && (
          <nav
            aria-label={dict.header.mainNav}
            className="order-last -mx-1 flex w-full gap-1 md:order-none md:mx-0 md:w-auto md:flex-1 md:justify-center"
          >
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={item.active ? "page" : undefined}
                className={`flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1.5 text-xs font-bold transition-colors min-[420px]:flex-row min-[420px]:gap-1.5 min-[420px]:text-sm md:flex-none md:px-3 md:py-2 md:text-base ${
                  item.active ? "bg-primary/12 text-primary" : "text-muted hover:bg-primary/8 hover:text-foreground"
                }`}
              >
                <span aria-hidden>{item.emoji}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-2 text-base font-bold">
          {user && stars !== null && (
            <Link
              href={`/${locale}/progress`}
              className="flex items-center gap-1.5 rounded-full bg-help-soft px-3 py-1.5 text-help"
              title={name ? format(dict.header.hi, { name }) : dict.header.hiAnon}
            >
              <span aria-hidden>★</span>
              <span>{format(dict.common.stars, { count: stars })}</span>
            </Link>
          )}
          {user ? (
            <>
              <Link
                href={`/${locale}/settings`}
                aria-label={dict.header.settings}
                title={dict.header.settings}
                aria-current={section === "settings" ? "page" : undefined}
                className={iconButton}
              >
                <span aria-hidden>⚙️</span>
              </Link>
              <Link
                href={`/${locale}/profile`}
                aria-label={dict.header.profile}
                title={dict.header.profile}
                aria-current={section === "profile" ? "page" : undefined}
                className={`${iconButton} !border-primary/40 bg-primary text-base font-black text-primary-foreground uppercase`}
              >
                {name ? name.slice(0, 1) : <span aria-hidden>👤</span>}
              </Link>
            </>
          ) : (
            <>
              <div role="group" aria-label={dict.common.language} className="flex rounded-xl border-2 border-border p-0.5 text-sm">
                {locales.map((target) => (
                  <Link
                    key={target}
                    href={switchHref(target)}
                    lang={target}
                    hrefLang={target}
                    aria-current={target === locale ? "true" : undefined}
                    className={`rounded-lg px-2.5 py-1 ${target === locale ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground"}`}
                  >
                    {localeNames[target]}
                  </Link>
                ))}
              </div>
              <ThemeToggle />
              {user === null && section !== "login" && (
                <Link
                  href={`/${locale}/login`}
                  className="rounded-xl bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary-hover"
                >
                  {dict.auth.loginLink}
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
