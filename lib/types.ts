export type Side = "for" | "against";
export type DebateStatus = "active" | "ended";
export type Channel = "debate" | "coach";
export type MessageRole = "user" | "assistant";

export const OPPONENTS = ["fiona", "tom", "sam"] as const;
export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type Opponent = (typeof OPPONENTS)[number];
export type Difficulty = (typeof DIFFICULTIES)[number];

/** Star ratings (1 to 5) for the five skills shown on the results screen. */
export interface Ratings {
  ideas: number;
  facts: number;
  thinking: number;
  answering: number;
  kindness: number;
}

export interface Review {
  summary: string;
  bestIdea: { quote: string; why: string };
  wentWell: string[];
  tryNextTime: string[];
  ratings: Ratings;
}

export interface Hint {
  starter: string;
  fact: string;
  /** Empty in round 1, when there is nothing to answer back to yet. */
  answerBack: string;
}

export interface DebateSummary {
  id: string;
  topic: string;
  student_side: Side;
  opponent: Opponent;
  difficulty: Difficulty;
  turn_seconds: number;
  rounds: number;
  status: DebateStatus;
  created_at: string;
  ended_at: string | null;
  review: Review | null;
}

export interface DebateMessage {
  id: string;
  channel: Channel;
  role: MessageRole;
  content: string;
  created_at: string;
}

export interface DebateDetail extends DebateSummary {
  locale: string;
  messages: DebateMessage[];
}

export const API_ERROR_CODES = [
  "unauthorized",
  "invalid_request",
  "forbidden_origin",
  "not_found",
  "rate_limited",
  "debate_ended",
  "debate_active",
  "turn_limit",
  "not_enough_turns",
  "coach_limit",
  "topic_rejected",
  "ai_unavailable",
  "not_configured",
  "server_error",
] as const;
export type ApiErrorCode = (typeof API_ERROR_CODES)[number];
