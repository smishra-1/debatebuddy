import { generateReview } from "@/lib/ai/debate";
import { ApiError, apiHandler, assertSafeWrite, parseId, requireUser } from "@/lib/api/handler";
import { consumeAiBudget } from "@/lib/db/ai-usage";
import { getDebate, saveReview } from "@/lib/db/debates";
import { isLocale } from "@/lib/i18n/config";
import { LIMITS } from "@/lib/limits";
import { idSchema } from "@/lib/validation";

export const POST = apiHandler(async (request: Request, ctx: RouteContext<"/api/debates/[id]/review">) => {
  assertSafeWrite(request);
  const id = parseId((await ctx.params).id, idSchema);
  const { supabase } = await requireUser();

  const debate = await getDebate(supabase, id);
  if (debate.review) return { debate }; // already reviewed: idempotent

  const studentTurns = debate.messages.filter((m) => m.channel === "debate" && m.role === "user").length;
  if (studentTurns < (debate.rounds ?? LIMITS.rounds)) throw new ApiError(409, "not_enough_turns");

  await consumeAiBudget(supabase, "review");
  const review = await generateReview({
    topic: debate.topic,
    side: debate.student_side,
    locale: isLocale(debate.locale) ? debate.locale : "en",
    history: debate.messages,
  });
  await saveReview(supabase, id, review);
  return { debate: await getDebate(supabase, id) };
});
