import type { DebateSummary, Ratings, Review } from "@/lib/types";

export const skillKeys = ["ideas", "facts", "thinking", "answering", "kindness"] as const;

type ReviewedDebate = DebateSummary & { review: Review };

const isReviewed = (debate: DebateSummary): debate is ReviewedDebate => debate.review !== null;

/** Stars earned in one debate: the average skill rating, rounded to 1-5. */
export function debateStars(ratings: Ratings): number {
  const total = skillKeys.reduce((sum, key) => sum + ratings[key], 0);
  return Math.min(5, Math.max(1, Math.round(total / skillKeys.length)));
}

export function totalStars(debates: DebateSummary[]): number {
  return debates.filter(isReviewed).reduce((sum, d) => sum + debateStars(d.review.ratings), 0);
}

/** Stars per reviewed debate, oldest to newest (history arrives newest first). */
export function starSeries(debates: DebateSummary[], limit = 8): number[] {
  return debates
    .filter(isReviewed)
    .slice(0, limit)
    .reverse()
    .map((d) => debateStars(d.review.ratings));
}

export const badgeIds = ["thinker", "finder", "coolhead", "champ"] as const;
export type BadgeId = (typeof badgeIds)[number];

const BADGE_RULES: Record<BadgeId, (ratings: Ratings) => boolean> = {
  thinker: (r) => r.thinking >= 4,
  finder: (r) => r.facts >= 4,
  coolhead: (r) => r.kindness === 5,
  champ: (r) => r.answering >= 4,
};

/** A badge unlocks once any reviewed debate meets its rule. */
export function unlockedBadges(debates: DebateSummary[]): Set<BadgeId> {
  const unlocked = new Set<BadgeId>();
  for (const debate of debates.filter(isReviewed)) {
    for (const id of badgeIds) {
      if (BADGE_RULES[id](debate.review.ratings)) unlocked.add(id);
    }
  }
  return unlocked;
}

/** The oldest reviewed debate that earned each badge (history arrives newest first). */
export function badgeFirstEarned(debates: DebateSummary[]): Partial<Record<BadgeId, DebateSummary>> {
  const first: Partial<Record<BadgeId, DebateSummary>> = {};
  for (const debate of debates.filter(isReviewed)) {
    for (const id of badgeIds) {
      if (BADGE_RULES[id](debate.review.ratings)) first[id] = debate;
    }
  }
  return first;
}

const dayKey = (date: Date) =>
  `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

/** Days in a row (ending today or yesterday) on which the student started a debate. */
export function streakDays(debates: DebateSummary[], now: Date = new Date()): number {
  const days = new Set(debates.map((d) => dayKey(new Date(d.created_at))));
  const cursor = new Date(now);
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
