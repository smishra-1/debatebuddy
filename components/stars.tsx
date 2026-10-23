"use client";

import { format } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/provider";
import { SKILL_MAX_STARS } from "@/lib/ratings";

interface Props {
  count: number;
  /** The most that can be earned. Up to 5 draws the stars; more shows a compact "★ 14" score. */
  max?: number;
  /** Also draw the unearned stars (dimmed) so a small score reads as "n out of 5". */
  showEmpty?: boolean;
  className?: string;
}

export function Stars({ count, max = SKILL_MAX_STARS, showEmpty = false, className = "" }: Props) {
  const { dict } = useI18n();
  const label = format(dict.common.starsOutOf, { count, max });
  if (max > SKILL_MAX_STARS) {
    return (
      <span role="img" aria-label={label} className={`shrink-0 font-black whitespace-nowrap text-help tabular-nums ${className}`}>
        ★ {count}
      </span>
    );
  }
  return (
    <span role="img" aria-label={label} className={`shrink-0 tracking-wider whitespace-nowrap text-help ${className}`}>
      {"★".repeat(count)}
      {showEmpty && <span className="text-border">{"★".repeat(Math.max(0, max - count))}</span>}
    </span>
  );
}
