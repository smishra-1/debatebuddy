import { generateOpponentReply } from "@/lib/ai/debate";
import { ApiError, apiHandler, parseId, parseJson, requireUser } from "@/lib/api/handler";
import { consumeAiBudget } from "@/lib/db/ai-usage";
import { addMessage, getDebate } from "@/lib/db/debates";
import { isLocale } from "@/lib/i18n/config";
import type { DebateMessage } from "@/lib/types";
import { LIMITS } from "@/lib/limits";
import { idSchema, sendMessageSchema } from "@/lib/validation";

export const POST = apiHandler(async (request: Request, ctx: RouteContext<"/api/debates/[id]/messages">) => {
  const id = parseId((await ctx.params).id, idSchema);
  const { supabase } = await requireUser();
  const { content } = await parseJson(request, sendMessageSchema);

  const debate = await getDebate(supabase, id);
  if (debate.status === "ended") throw new ApiError(409, "debate_ended");
  const studentTurns = debate.messages.filter((m) => m.channel === "debate" && m.role === "user").length;
  if (studentTurns >= (debate.rounds ?? LIMITS.rounds)) throw new ApiError(409, "turn_limit");

  await consumeAiBudget(supabase, "debate_reply");

  // Persist both turns only after the AI answered, so a failure leaves no dangling student turn.
  const draft: DebateMessage = {
    id: "draft",
    channel: "debate",
    role: "user",
    content,
    created_at: new Date().toISOString(),
  };
  const reply = await generateOpponentReply({
    topic: debate.topic,
    side: debate.student_side,
    opponent: debate.opponent,
    difficulty: debate.difficulty,
    rounds: debate.rounds ?? LIMITS.rounds,
    locale: isLocale(debate.locale) ? debate.locale : "en",
    history: [...debate.messages, draft],
  });
  const studentMessage = await addMessage(supabase, {
    debateId: id,
    channel: "debate",
    role: "user",
    content,
  });
  const aiMessage = await addMessage(supabase, {
    debateId: id,
    channel: "debate",
    role: "assistant",
    content: reply,
  });
  return { messages: [studentMessage, aiMessage] };
});
