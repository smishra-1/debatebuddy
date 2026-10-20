"use client";

import { format } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/provider";

interface Props {
  count: number;
  /** Also draw the unearned stars (dimmed) so the score reads as "n out of 5". */
  outOf5?: boolean;
  className?: string;
}

export function Stars({ count, outOf5 = false, className = "" }: Props) {
  const { dict } = useI18n();
  return (
    <span
      role="img"
      aria-label={format(dict.common.starsOutOf, { count })}
      className={`shrink-0 tracking-wider whitespace-nowrap text-help ${className}`}
    >
      {"★".repeat(count)}
      {outOf5 && <span className="text-border">{"★".repeat(Math.max(0, 5 - count))}</span>}
    </span>
  );
}
