import { z } from "zod";
import { locales } from "@/lib/i18n/config";
import { LIMITS, ROUND_OPTIONS, TURN_SECONDS } from "@/lib/limits";
import { DIFFICULTIES, OPPONENTS } from "@/lib/types";

// Strips control characters (keeps \n and \t) so stored text can't smuggle odd bytes.
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

const cleanText = (min: number, max: number) =>
  z
    .string()
    .transform((value) => value.replace(CONTROL_CHARS, "").trim())
    .pipe(z.string().min(min).max(max));

const locale = z.enum(locales);

// Topics end up inside prompts, so they are kept to a single line.
const topicText = z
  .string()
  .transform((value) => value.replace(CONTROL_CHARS, "").replace(/\s+/g, " ").trim())
  .pipe(z.string().min(LIMITS.topicMin).max(LIMITS.topicMax));

export const createDebateSchema = z.object({
  topic: topicText,
  side: z.enum(["for", "against"]),
  opponent: z.enum(OPPONENTS),
  difficulty: z.enum(DIFFICULTIES),
  turnSeconds: z.union([z.literal(TURN_SECONDS[0]), z.literal(TURN_SECONDS[1])]),
  rounds: z.union(ROUND_OPTIONS.map((n) => z.literal(n))).default(LIMITS.rounds),
  locale,
});

export const sendMessageSchema = z.object({
  content: cleanText(1, LIMITS.messageMax),
});

export const coachQuestionSchema = z.object({
  question: cleanText(1, LIMITS.questionMax),
});

/** Home-screen doubts chat: the client keeps the conversation and sends the recent part. */
export const askSchema = z.object({
  locale,
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: cleanText(1, LIMITS.messageMax) }))
    .min(1)
    .max(LIMITS.askHistoryMax)
    .refine((messages) => messages.at(-1)?.role === "user", "last message must be the question"),
});

export const suggestTopicsSchema = z.object({
  locale,
  interest: cleanText(0, LIMITS.interestMax).optional(),
});

export const idSchema = z.uuid();

const rating = z.number().int().min(1).max(5);
const line = z.string().min(1).max(300);

export const reviewSchema = z.object({
  summary: z.string().min(1).max(400),
  bestIdea: z.object({ quote: z.string().min(1).max(400), why: z.string().min(1).max(300) }),
  wentWell: z.array(line).min(1).max(4),
  tryNextTime: z.array(line).min(1).max(4),
  ratings: z.object({
    ideas: rating,
    facts: rating,
    thinking: rating,
    answering: rating,
    kindness: rating,
  }),
});

export const hintSchema = z.object({
  starter: z.string().min(1).max(200),
  fact: z.string().min(1).max(250),
  answerBack: z.string().max(250),
});

export const topicSuggestionsSchema = z.object({
  topics: z.array(z.string().min(8).max(LIMITS.topicMax)).min(1).max(6),
});

export const topicCheckSchema = z.object({
  appropriate: z.boolean(),
});

export const NAME_MAX = 20;
export const PASSWORD_MIN = 8;

export const logInSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(72),
});

export const signUpSchema = z.object({
  name: cleanText(1, NAME_MAX),
  email: z.email().max(254),
  // bcrypt (used by Supabase Auth) only reads the first 72 bytes.
  password: z.string().min(PASSWORD_MIN).max(72),
});
