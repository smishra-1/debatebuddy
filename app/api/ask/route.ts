import { answerDoubt } from "@/lib/ai/debate";
import { apiHandler, parseJson, requireUser } from "@/lib/api/handler";
import { consumeAiBudget } from "@/lib/db/ai-usage";
import { askSchema } from "@/lib/validation";

export const POST = apiHandler(async (request: Request) => {
  const { supabase } = await requireUser();
  const { locale, messages } = await parseJson(request, askSchema);
  await consumeAiBudget(supabase, "ask");
  return { answer: await answerDoubt(locale, messages) };
});
