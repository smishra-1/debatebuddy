"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type MouseEvent } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { textLink } from "./styles";

// Pages seen in this tab; once there is more than one, "Back" can safely use the browser history.
let visited = 0;

/** Mounted once (in the header) so every back button knows if there is an in-app page to return to. */
export function useTrackNavigation() {
  const pathname = usePathname();
  useEffect(() => {
    visited += 1;
  }, [pathname]);
}

/**
 * Goes back to the previous page in the app. Opened from a bookmark or a fresh tab, it goes to `fallback`
 * instead of leaving the site; it is a real link, so it also works before the page is interactive.
 */
export function BackButton({ fallback, label }: { fallback: string; label?: string }) {
  const { dict } = useI18n();
  const router = useRouter();

  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    if (visited > 1 && !event.metaKey && !event.ctrlKey && !event.shiftKey) {
      event.preventDefault();
      router.back();
    }
  }

  return (
    <Link href={fallback} onClick={onClick} className={`${textLink} -ml-1 rounded-lg px-1 py-0.5`}>
      <span aria-hidden>←</span> {label ?? dict.common.back}
    </Link>
  );
}
