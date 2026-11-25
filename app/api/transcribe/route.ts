import { NoTranscriptGeneratedError, transcribe } from "ai";
import { TRANSCRIBE_MODEL_ID } from "@/lib/ai/model";
import { ApiError, apiHandler, assertSafeWrite, requireUser } from "@/lib/api/handler";
import { consumeAiBudget } from "@/lib/db/ai-usage";
import { LIMITS } from "@/lib/limits";

/** Voice input: the browser records a short clip and we turn it into text. Audio is never stored. */
export const POST = apiHandler(async (request: Request) => {
  assertSafeWrite(request);
  const { supabase } = await requireUser();
  const contentType = (request.headers.get("content-type") ?? "").toLowerCase();
  if (!contentType.startsWith("audio/")) throw new ApiError(400, "invalid_request");
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > LIMITS.audioMaxBytes) throw new ApiError(413, "invalid_request");
  const audio = new Uint8Array(await request.arrayBuffer());
  if (audio.byteLength === 0 || audio.byteLength > LIMITS.audioMaxBytes) throw new ApiError(400, "invalid_request");

  await consumeAiBudget(supabase, "transcribe");
  try {
    const { text } = await transcribe({ model: TRANSCRIBE_MODEL_ID, audio });
    return { text: text.trim().slice(0, LIMITS.messageMax) };
  } catch (error) {
    // Silence or noise: not a server failure, the student just needs to try again.
    if (NoTranscriptGeneratedError.isInstance(error)) return { text: "" };
    throw error;
  }
});
