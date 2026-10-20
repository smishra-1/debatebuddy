"use client";

import { useI18n } from "@/lib/i18n/provider";

/** Grey placeholder block; pulses unless the student prefers reduced motion. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`rounded-2xl bg-border/60 motion-safe:animate-pulse ${className}`} />;
}

/** Announces loading to screen readers while the visible skeleton shows the page shape. */
export function Loading({ children }: { children: React.ReactNode }) {
  const { dict } = useI18n();
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">{dict.common.loading}</span>
      {children}
    </div>
  );
}

/** Small spinning ring for buttons and inline "working…" notes; inherits the text colour. */
export function Spinner() {
  return <span aria-hidden className="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" />;
}
