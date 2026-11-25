import "server-only";

// Plain "provider/model" strings are routed through the Vercel AI Gateway.
export const TRANSCRIBE_MODEL_ID = process.env.AI_TRANSCRIBE_MODEL ?? "openai/gpt-4o-mini-transcribe";
export const MODEL_ID = process.env.AI_MODEL ?? "anthropic/claude-haiku-4.5";
