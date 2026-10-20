"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useUser } from "@/lib/client/use-user";
import { mapAuthError, type AuthErrorCode } from "@/lib/auth/errors";
import { safeNextPath } from "@/lib/auth/routes";
import { format } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/provider";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { SupabaseNotConfiguredError } from "@/lib/supabase/env";
import { logInSchema, NAME_MAX, PASSWORD_MIN, signUpSchema } from "@/lib/validation";
import { BackButton } from "./back-button";
import { btnPrimary, card, errorBox, input } from "./styles";
import { Spinner } from "./skeleton";

type Mode = "login" | "signup";

export function AuthForm({ mode }: { mode: Mode }) {
  const { locale, dict } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNextPath(params.get("next"), locale);
  const nextQuery = params.get("next") ? `?next=${encodeURIComponent(next)}` : "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<AuthErrorCode | "invalid" | null>(
    params.get("error") === "confirm_failed" ? "generic" : null,
  );
  const [checkEmail, setCheckEmail] = useState(false);

  // useUser verifies the session with Supabase, so a stale cookie never triggers this.
  const user = useUser();
  useEffect(() => {
    if (user) router.replace(next);
  }, [user, next, router]);

  const t = dict.auth;
  const isLogin = mode === "login";

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const parsed = isLogin
      ? logInSchema.safeParse({ email, password })
      : signUpSchema.safeParse({ name, email, password });
    if (!parsed.success) {
      setError("invalid");
      return;
    }

    setPending(true);
    try {
      const supabase = getBrowserSupabase();
      if (isLogin) {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (authError) throw authError;
      } else {
        const data = parsed.data as { name: string; email: string; password: string };
        const { data: result, error: authError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: { name: data.name },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          },
        });
        if (authError) throw authError;
        // With email confirmation on, Supabase returns no session until the link is clicked.
        if (!result.session) {
          setCheckEmail(true);
          setPending(false);
          return;
        }
      }
      router.replace(next);
      router.refresh();
    } catch (e) {
      if (e instanceof SupabaseNotConfiguredError) {
        console.error(`[Debate Buddy setup] ${e.message}`);
        setError("not_configured");
      } else {
        setError(mapAuthError(e as { code?: string; status?: number; name?: string }));
      }
      setPending(false);
    }
  }

  if (checkEmail) {
    return (
      <div className={`${card} mx-auto max-w-md space-y-3 text-center`}>
        <p aria-hidden className="text-5xl">
          📬
        </p>
        <h1 className="text-2xl font-extrabold">{t.checkEmailTitle}</h1>
        <p className="text-lg">{format(t.checkEmailText, { email })}</p>
      </div>
    );
  }

  const message =
    error === "invalid"
      ? isLogin
        ? t.errors.invalid_credentials
        : format(t.signupRules, { min: PASSWORD_MIN })
      : error && t.errors[error];

  return (
    <div className="mx-auto max-w-md space-y-6">
      <BackButton fallback={`/${locale}/welcome`} />
      <header className="space-y-2 text-center">
        <p aria-hidden className="mx-auto grid size-20 place-items-center rounded-3xl bg-primary/10 text-5xl">
          {isLogin ? "👋" : "🎉"}
        </p>
        <h1 className="text-3xl font-black">{isLogin ? t.loginTitle : t.signupTitle}</h1>
        <p className="text-lg text-muted">{isLogin ? t.loginSubtitle : t.signupSubtitle}</p>
      </header>

      <form onSubmit={onSubmit} className={`${card} space-y-4`} noValidate>
        {!isLogin && (
          <div className="space-y-1">
            <label htmlFor="name" className="block font-bold">
              {t.name}
            </label>
            <input
              id="name"
              value={name}
              maxLength={NAME_MAX}
              autoComplete="given-name"
              required
              onChange={(e) => setName(e.target.value)}
              className={input}
            />
          </div>
        )}
        <div className="space-y-1">
          <label htmlFor="email" className="block font-bold">
            {t.email}
          </label>
          <input
            id="email"
            type="email"
            value={email}
            maxLength={254}
            autoComplete="email"
            required
            onChange={(e) => setEmail(e.target.value)}
            className={input}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="password" className="block font-bold">
            {t.password}
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              maxLength={72}
              autoComplete={isLogin ? "current-password" : "new-password"}
              aria-describedby={isLogin ? undefined : "password-hint"}
              required
              onChange={(e) => setPassword(e.target.value)}
              className={`${input} pr-24`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-controls="password"
              aria-pressed={showPassword}
              className="absolute inset-y-1.5 right-1.5 flex items-center gap-1 rounded-xl px-3 text-sm font-bold text-primary hover:bg-primary/10"
            >
              <span aria-hidden>{showPassword ? "🙈" : "👁"}</span>
              {showPassword ? t.hidePassword : t.showPassword}
            </button>
          </div>
          {!isLogin && (
            <p id="password-hint" className="text-sm text-muted">
              {format(t.passwordHint, { min: PASSWORD_MIN })}
            </p>
          )}
        </div>

        {message && (
          <p role="alert" className={errorBox}>
            {message}
          </p>
        )}

        <button type="submit" disabled={pending} aria-busy={pending} className={`${btnPrimary} w-full`}>
          {pending && <Spinner />}
          {pending ? t.pending : isLogin ? t.loginButton : t.signupButton}
        </button>
        {!isLogin && <p className="text-sm text-muted">{t.grownUp}</p>}
      </form>

      <p className="text-center text-lg">
        {isLogin ? t.noAccount : t.haveAccount}{" "}
        <Link href={`/${locale}/${isLogin ? "signup" : "login"}${nextQuery}`} className="font-bold text-primary hover:underline">
          {isLogin ? t.signupLink : t.loginLink}
        </Link>
      </p>
    </div>
  );
}
