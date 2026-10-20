import "server-only";
import { generateText, Output } from "ai";
import { ApiError } from "@/lib/api/handler";
import type { Locale } from "@/lib/i18n/config";
import type { DebateMessage, Difficulty, Hint, Opponent, Review, Side } from "@/lib/types";
import { hintSchema, reviewSchema, topicCheckSchema, topicSuggestionsSchema } from "@/lib/validation";
import { MODEL_ID } from "./model";
import {
  askBuddySystemPrompt,
  coachSystemPrompt,
  hintSystemPrompt,
  opponentSystemPrompt,
  reviewSystemPrompt,
  topicCheckSystemPrompt,
  topicSuggestionPrompt,
  transcriptText,
} from "./prompts";

const TIMEOUT_MS = 45_000;

/** Runs a model call, hiding provider details from the client. */
async function run<T>(call: (signal: AbortSignal) => Promise<T>): Promise<T> {
  try {
    return await call(AbortSignal.timeout(TIMEOUT_MS));
  } catch (error) {
    console.error("AI call failed", error);
    throw new ApiError(502, "ai_unavailable");
  }
}

function toModelMessages(messages: DebateMessage[], channel: DebateMessage["channel"]) {
  return messages
    .filter((m) => m.channel === channel)
    .map((m) => ({ role: m.role, content: m.content }));
}

export async function generateOpponentReply(input: {
  topic: string;
  side: Side;
  opponent: Opponent;
  difficulty: Difficulty;
  rounds: number;
  locale: Locale;
  history: DebateMessage[];
}): Promise<string> {
  const { text } = await run((abortSignal) =>
    generateText({
      model: MODEL_ID,
      system: opponentSystemPrompt(input.topic, input.side, input.locale, input.opponent, input.difficulty, input.rounds),
      messages: toModelMessages(input.history, "debate"),
      maxOutputTokens: 300,
      abortSignal,
    }),
  );
  const reply = text.trim();
  if (!reply) throw new ApiError(502, "ai_unavailable");
  return reply;
}

export async function generateReview(input: {
  topic: string;
  side: Side;
  locale: Locale;
  history: DebateMessage[];
}): Promise<Review> {
  const { output } = await run((abortSignal) =>
    generateText({
      model: MODEL_ID,
      system: reviewSystemPrompt(input.topic, input.side, input.locale),
      prompt: `<transcript>\n${transcriptText(input.history, input.side)}\n</transcript>`,
      output: Output.object({ schema: reviewSchema }),
      maxOutputTokens: 1500,
      abortSignal,
    }),
  );
  const parsed = reviewSchema.safeParse(output);
  if (!parsed.success) throw new ApiError(502, "ai_unavailable");
  return parsed.data;
}

export async function generateCoachAnswer(input: {
  topic: string;
  side: Side;
  locale: Locale;
  review: Review;
  history: DebateMessage[];
}): Promise<string> {
  const { text } = await run((abortSignal) =>
    generateText({
      model: MODEL_ID,
      system:
        coachSystemPrompt(input.topic, input.side, input.locale, input.review) +
        `\n\n<transcript>\n${transcriptText(input.history, input.side)}\n</transcript>`,
      messages: toModelMessages(input.history, "coach"),
      maxOutputTokens: 500,
      abortSignal,
    }),
  );
  const answer = text.trim();
  if (!answer) throw new ApiError(502, "ai_unavailable");
  return answer;
}

/** General "how does debating work?" help for the home-screen chat; nothing is stored. */
export async function answerDoubt(
  locale: Locale,
  messages: { role: "user" | "assistant"; content: string }[],
): Promise<string> {
  const { text } = await run((abortSignal) =>
    generateText({
      model: MODEL_ID,
      system: askBuddySystemPrompt(locale),
      messages,
      maxOutputTokens: 400,
      abortSignal,
    }),
  );
  const answer = text.trim();
  if (!answer) throw new ApiError(502, "ai_unavailable");
  return answer;
}

export async function isTopicAppropriate(topic: string): Promise<boolean> {
  const { output } = await run((abortSignal) =>
    generateText({
      model: MODEL_ID,
      system: topicCheckSystemPrompt(),
      prompt: `<topic>${topic}</topic>`,
      output: Output.object({ schema: topicCheckSchema }),
      maxOutputTokens: 100,
      abortSignal,
    }),
  );
  return topicCheckSchema.safeParse(output).data?.appropriate === true;
}

export async function suggestTopics(locale: Locale, interest?: string): Promise<string[]> {
  const { output } = await run((abortSignal) =>
    generateText({
      model: MODEL_ID,
      prompt: topicSuggestionPrompt(locale, interest),
      output: Output.object({ schema: topicSuggestionsSchema }),
      maxOutputTokens: 600,
      abortSignal,
    }),
  );
  const parsed = topicSuggestionsSchema.safeParse(output);
  if (!parsed.success) throw new ApiError(502, "ai_unavailable");
  return parsed.data.topics.map((t) => t.replace(/\s+/g, " ").trim());
}

export async function generateHint(input: {
  topic: string;
  side: Side;
  locale: Locale;
  history: DebateMessage[];
}): Promise<Hint> {
  const { output } = await run((abortSignal) =>
    generateText({
      model: MODEL_ID,
      system: hintSystemPrompt(input.topic, input.side, input.locale),
      prompt: `<transcript>\n${transcriptText(input.history, input.side)}\n</transcript>`,
      output: Output.object({ schema: hintSchema }),
      maxOutputTokens: 500,
      abortSignal,
    }),
  );
  const parsed = hintSchema.safeParse(output);
  if (!parsed.success) throw new ApiError(502, "ai_unavailable");
  return parsed.data;
}
