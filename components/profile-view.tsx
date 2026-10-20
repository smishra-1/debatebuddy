"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useApiResource } from "@/lib/client/use-api-resource";
import { useUser } from "@/lib/client/use-user";
import { format } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/provider";
import { streakDays, totalStars, unlockedBadges } from "@/lib/ratings";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import type { DebateSummary } from "@/lib/types";
import { NAME_MAX, signUpSchema } from "@/lib/validation";
import { BackButton } from "./back-button";
import { Loading, Skeleton, Spinner } from "./skeleton";
import { btnPrimary, btnSecondary, card, errorBox, input } from "./styles";

export function ProfileView() {
  const { locale, dict } = useI18n();
  const router = useRouter();
  const user = useUser();
  const t = dict.profile;
  const { data } = useApiResource<{ debates: DebateSummary[] }>("/api/debates");
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  if (!user) {
    return (
      <Loading>
        <div className="mx-auto max-w-2xl space-y-6">
          <Skeleton className="h-40 rounded-3xl" />
          <Skeleton className="h-28 rounded-3xl" />
        </div>
      </Loading>
    );
  }

  async function saveName(event: FormEvent) {
    event.preventDefault();
    const parsed = signUpSchema.shape.name.safeParse(name);
    if (!parsed.success) {
      setMessage({ ok: false, text: dict.errors.invalid_request });
      return;
    }
    setPending(true);
    setMessage(null);
    const { error } = await getBrowserSupabase().auth.updateUser({ data: { name: parsed.data } });
    setPending(false);
    if (error) {
      setMessage({ ok: false, text: dict.auth.errors.generic });
      return;
    }
    setEditing(false);
    setMessage({ ok: true, text: t.saved });
  }

  async function logOut() {
    try {
      await getBrowserSupabase().auth.signOut();
    } finally {
      router.replace(`/${locale}/welcome`);
      router.refresh();
    }
  }

  const debates = data?.debates ?? [];
  const stats = [
    { emoji: "🗣", value: debates.length, label: dict.progress.debates },
    { emoji: "⭐", value: totalStars(debates), label: dict.progress.starsEarned },
    { emoji: "🔥", value: streakDays(debates), label: dict.progress.daysInRow },
    { emoji: "🏅", value: unlockedBadges(debates).size, label: dict.badgesPage.title },
  ];
  const links = [
    { href: "history", emoji: "📜", label: t.links.history },
    { href: "badges", emoji: "🏅", label: t.links.badges },
    { href: "progress", emoji: "🗺", label: t.links.progress },
    { href: "settings", emoji: "⚙️", label: t.links.settings },
  ];
  const since = new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(user.createdAt));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <BackButton fallback={`/${locale}`} />

      <section className={`${card} flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left`}>
        <span
          aria-hidden
          className="grid size-24 shrink-0 place-items-center rounded-full bg-primary text-5xl font-black text-primary-foreground uppercase shadow-[0_5px_0_var(--primary-depth)]"
        >
          {user.name ? user.name.slice(0, 1) : "🙂"}
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <h1 className="text-sm font-bold text-muted">{t.title}</h1>
          {editing ? (
            <form onSubmit={saveName} className="flex flex-col gap-2 sm:flex-row">
              <label htmlFor="profile-name" className="sr-only">
                {t.name}
              </label>
              <input
                id="profile-name"
                value={name}
                maxLength={NAME_MAX}
                autoComplete="given-name"
                autoFocus
                onChange={(e) => setName(e.target.value)}
                className={`${input} !py-2`}
              />
              <div className="flex gap-2">
                <button type="submit" disabled={pending} className={`${btnPrimary} !px-4 !py-2 !text-base`}>
                  {pending && <Spinner />}
                  {t.save}
                </button>
                <button type="button" onClick={() => setEditing(false)} className={`${btnSecondary} !px-4 !py-2 !text-base`}>
                  {t.cancel}
                </button>
              </div>
            </form>
          ) : (
            <p className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span className="text-3xl font-black">{user.name || dict.header.hiAnon}</span>
              <button
                type="button"
                onClick={() => {
                  setName(user.name);
                  setEditing(true);
                  setMessage(null);
                }}
                className="rounded-lg px-2 py-1 text-sm font-bold text-primary hover:bg-primary/10"
              >
                <span aria-hidden>✏️</span> {t.editName}
              </button>
            </p>
          )}
          <p className="break-all text-muted">
            <span className="sr-only">{t.email}: </span>
            {user.email}
          </p>
          <p className="text-sm text-muted">{format(t.since, { date: since })}</p>
        </div>
      </section>

      {message && (
        <p role={message.ok ? "status" : "alert"} className={message.ok ? "rounded-2xl bg-good-soft p-3 font-bold text-good" : errorBox}>
          {message.text}
        </p>
      )}

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <li key={stat.label} className={`${card} !p-3 text-center`}>
            <p aria-hidden className="text-2xl">
              {stat.emoji}
            </p>
            <p className="text-2xl font-black tabular-nums">{data ? stat.value : "–"}</p>
            <p className="text-sm text-muted">{stat.label}</p>
          </li>
        ))}
      </ul>

      <nav aria-label={t.title} className="grid grid-cols-2 gap-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={`/${locale}/${link.href}`}
            className={`${card} flex items-center gap-3 !p-4 font-bold transition-colors hover:border-primary`}
          >
            <span aria-hidden className="text-2xl">
              {link.emoji}
            </span>
            {link.label}
          </Link>
        ))}
      </nav>

      <button type="button" onClick={() => void logOut()} className={`${btnSecondary} w-full !text-against`}>
        <span aria-hidden>👋</span> {dict.auth.logout}
      </button>
    </div>
  );
}
