import { ROUND_OPTIONS, TURN_SECONDS } from "@/lib/limits";
import { OPPONENTS, type DebateSummary, type Ratings, type Review } from "@/lib/types";

export const skillKeys = ["ideas", "facts", "thinking", "answering", "kindness"] as const;

type ReviewedDebate = DebateSummary & { review: Review };

const isReviewed = (debate: DebateSummary): debate is ReviewedDebate => debate.review !== null;

/** Each skill is rated 1-5; a whole debate earns 1-20 stars. */
export const SKILL_MAX_STARS = 5;
export const DEBATE_MIN_STARS = 1;
export const DEBATE_MAX_STARS = 20;

/** Stars earned in one debate: the average skill rating (1-5) stretched evenly onto 1-20. */
export function debateStars(ratings: Ratings): number {
  const average = skillKeys.reduce((sum, key) => sum + ratings[key], 0) / skillKeys.length;
  const stars = DEBATE_MIN_STARS + ((average - 1) / (SKILL_MAX_STARS - 1)) * (DEBATE_MAX_STARS - DEBATE_MIN_STARS);
  return Math.min(DEBATE_MAX_STARS, Math.max(DEBATE_MIN_STARS, Math.round(stars)));
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

/** Oldest first: the order badges are shown in. */
export const badgeIds = [
  "thinker", "finder", "coolhead", "champ", "sparkle", "allrounder", "perfect",
  "highflyer", "topscorer",
  "firststep", "warmup", "regular", "dedicated", "veteran", "legend",
  "stars50", "stars100", "stars250",
  "streak3", "streak7",
  "bothsides", "crew", "brave", "longhaul", "explorer",
  "comeback", "quick", "hardhero", "weekend", "earlybird",
] as const;
export type BadgeId = (typeof badgeIds)[number];

/** Finds the debate (oldest first) that completed a badge, or nothing if it isn't earned yet. */
type BadgeRule = (chronological: ReviewedDebate[]) => ReviewedDebate | undefined;

/** Earned by one debate on its own. */
const inOneDebate =
  (test: (debate: ReviewedDebate) => boolean): BadgeRule =>
  (debates) =>
    debates.find(test);

const skillAtLeast = (key: (typeof skillKeys)[number], min: number) =>
  inOneDebate((d) => d.review.ratings[key] >= min);

/** Earned on the Nth finished debate. */
const finished =
  (count: number): BadgeRule =>
  (debates) =>
    debates[count - 1];

/** Earned once the running total of stars reaches a target. */
const totalStarsReach =
  (target: number): BadgeRule =>
  (debates) => {
    let sum = 0;
    return debates.find((d) => (sum += debateStars(d.review.ratings)) >= target);
  };

/** Earned once debates have covered `count` different values of something (topic, opponent, side…). */
const variety =
  (count: number, valueOf: (debate: ReviewedDebate) => string): BadgeRule =>
  (debates) => {
    const seen = new Set<string>();
    return debates.find((d) => seen.add(valueOf(d)).size >= count);
  };

const DAY_MS = 24 * 60 * 60 * 1000;
const dayNumber = (iso: string) => {
  const date = new Date(iso);
  return Math.round(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS);
};

/** Earned by finishing a debate on `days` calendar days in a row. */
const daysInARow =
  (days: number): BadgeRule =>
  (debates) => {
    let run = 0;
    let previous: number | null = null;
    for (const debate of debates) {
      const day = dayNumber(debate.created_at);
      if (day === previous) continue;
      run = previous !== null && day === previous + 1 ? run + 1 : 1;
      previous = day;
      if (run >= days) return debate;
    }
  };

/** Earned on the Nth debate that passes a test. */
const nthWhere =
  (count: number, test: (debate: ReviewedDebate) => boolean): BadgeRule =>
  (debates) =>
    debates.filter(test)[count - 1];

/** Earned by beating the debate before it by at least `gain` stars. */
const improvedBy =
  (gain: number): BadgeRule =>
  (debates) =>
    debates.find((d, i) => i > 0 && debateStars(d.review.ratings) - debateStars(debates[i - 1].review.ratings) >= gain);

const BADGE_RULES: Record<BadgeId, BadgeRule> = {
  thinker: skillAtLeast("thinking", 4),
  finder: skillAtLeast("facts", 4),
  coolhead: skillAtLeast("kindness", 5),
  champ: skillAtLeast("answering", 4),
  sparkle: skillAtLeast("ideas", 4),
  allrounder: inOneDebate((d) => skillKeys.every((key) => d.review.ratings[key] >= 4)),
  perfect: inOneDebate((d) => skillKeys.every((key) => d.review.ratings[key] === 5)),
  highflyer: inOneDebate((d) => debateStars(d.review.ratings) >= 15),
  topscorer: inOneDebate((d) => debateStars(d.review.ratings) >= 18),
  firststep: finished(1),
  warmup: finished(3),
  regular: finished(5),
  dedicated: finished(10),
  veteran: finished(25),
  legend: finished(50),
  stars50: totalStarsReach(50),
  stars100: totalStarsReach(100),
  stars250: totalStarsReach(250),
  streak3: daysInARow(3),
  streak7: daysInARow(7),
  bothsides: variety(2, (d) => d.student_side),
  crew: variety(OPPONENTS.length, (d) => d.opponent),
  brave: inOneDebate((d) => d.difficulty === "hard"),
  longhaul: inOneDebate((d) => d.rounds >= Math.max(...ROUND_OPTIONS)),
  explorer: variety(10, (d) => d.topic.trim().toLowerCase()),
  comeback: improvedBy(5),
  quick: inOneDebate((d) => d.turn_seconds === Math.min(...TURN_SECONDS)),
  hardhero: nthWhere(3, (d) => d.difficulty === "hard"),
  weekend: (debates) => {
    const days = new Set<number>();
    return debates.find((d) => {
      const day = new Date(d.created_at).getDay();
      if (day === 0 || day === 6) days.add(day);
      return days.size === 2;
    });
  },
  earlybird: inOneDebate((d) => new Date(d.created_at).getHours() < 8),
};

/** The oldest reviewed debate that earned each badge (history arrives newest first). */
export function badgeFirstEarned(debates: DebateSummary[]): Partial<Record<BadgeId, DebateSummary>> {
  const chronological = debates.filter(isReviewed).reverse();
  const first: Partial<Record<BadgeId, DebateSummary>> = {};
  for (const id of badgeIds) {
    const debate = BADGE_RULES[id](chronological);
    if (debate) first[id] = debate;
  }
  return first;
}

/** A badge unlocks once the finished debates meet its rule. */
export function unlockedBadges(debates: DebateSummary[]): Set<BadgeId> {
  return new Set(Object.keys(badgeFirstEarned(debates)) as BadgeId[]);
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
