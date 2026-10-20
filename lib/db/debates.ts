import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ApiError } from "@/lib/api/handler";
import { LIMITS } from "@/lib/limits";
import type {
  Channel,
  DebateDetail,
  DebateMessage,
  DebateSummary,
  Difficulty,
  MessageRole,
  Opponent,
  Review,
  Side,
} from "@/lib/types";

const SUMMARY_COLUMNS = "id, topic, student_side, opponent, difficulty, turn_seconds, rounds, status, created_at, ended_at, review";
const MESSAGE_COLUMNS = "id, channel, role, content, created_at";

export async function listDebates(supabase: SupabaseClient): Promise<DebateSummary[]> {
  const { data, error } = await supabase
    .from("debates")
    .select(SUMMARY_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(LIMITS.historyPageSize);
  if (error) throw error;
  return data as DebateSummary[];
}

export async function createDebate(
  supabase: SupabaseClient,
  input: {
    topic: string;
    side: Side;
    opponent: Opponent;
    difficulty: Difficulty;
    turnSeconds: number;
    rounds: number;
    locale: string;
  },
): Promise<DebateSummary> {
  const { data, error } = await supabase
    .from("debates")
    .insert({
      topic: input.topic,
      student_side: input.side,
      opponent: input.opponent,
      difficulty: input.difficulty,
      turn_seconds: input.turnSeconds,
      rounds: input.rounds,
      locale: input.locale,
    })
    .select(SUMMARY_COLUMNS)
    .single();
  if (error) throw error;
  return data as DebateSummary;
}

export async function getDebate(supabase: SupabaseClient, id: string): Promise<DebateDetail> {
  const { data, error } = await supabase
    .from("debates")
    .select(`${SUMMARY_COLUMNS}, locale`)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError(404, "not_found");
  const messages = await getMessages(supabase, id);
  return { ...(data as Omit<DebateDetail, "messages">), messages };
}

export async function getMessages(supabase: SupabaseClient, debateId: string): Promise<DebateMessage[]> {
  const { data, error } = await supabase
    .from("debate_messages")
    .select(MESSAGE_COLUMNS)
    .eq("debate_id", debateId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as DebateMessage[];
}

export async function addMessage(
  supabase: SupabaseClient,
  input: { debateId: string; channel: Channel; role: MessageRole; content: string },
): Promise<DebateMessage> {
  const { data, error } = await supabase
    .from("debate_messages")
    .insert({
      debate_id: input.debateId,
      channel: input.channel,
      role: input.role,
      content: input.content,
    })
    .select(MESSAGE_COLUMNS)
    .single();
  if (error) throw error;
  return data as DebateMessage;
}

export async function saveReview(supabase: SupabaseClient, id: string, review: Review): Promise<void> {
  const { error } = await supabase
    .from("debates")
    .update({ status: "ended", review, ended_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteDebate(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("debates").delete().eq("id", id);
  if (error) throw error;
}
