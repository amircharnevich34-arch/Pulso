import { createClient } from "@/lib/supabase/server";

export type ChatMessage = {
  id: string;
  authorId: string;
  authorName: string;
  roleAtTime: string;
  body: string;
  createdAt: string;
};

export type ChatChannel = "equipo" | "atleta";

export async function getChatMessages(
  athleteId: string,
  channel: ChatChannel
): Promise<ChatMessage[]> {
  const supabase = await createClient();

  const { data: messages } = await supabase
    .from("chat_messages")
    .select("id, author_id, role_at_time, body, created_at")
    .eq("athlete_id", athleteId)
    .eq("channel", channel)
    .order("created_at", { ascending: true });

  if (!messages || messages.length === 0) return [];

  const authorIds = [...new Set(messages.map((m) => m.author_id))];
  const { data: authors } = await supabase
    .from("public_profiles")
    .select("id, full_name")
    .in("id", authorIds);
  const nameById = new Map((authors ?? []).map((a) => [a.id, a.full_name]));

  return messages.map((m) => ({
    id: m.id,
    authorId: m.author_id,
    authorName: nameById.get(m.author_id) ?? "—",
    roleAtTime: m.role_at_time,
    body: m.body,
    createdAt: m.created_at,
  }));
}

export type ChatParticipant = { id: string; fullName: string };

// Everyone who could plausibly post in this athlete's chat: the athlete
// themselves plus their active care team, so realtime messages can always
// resolve an author name without an extra round trip.
export async function getChatParticipants(athleteId: string): Promise<ChatParticipant[]> {
  const supabase = await createClient();

  const { data: careTeam } = await supabase
    .from("athlete_care_team")
    .select("expert_id")
    .eq("athlete_id", athleteId)
    .eq("is_active", true);

  const ids = [...new Set([athleteId, ...(careTeam ?? []).map((c) => c.expert_id)])];
  const { data: profiles } = await supabase
    .from("public_profiles")
    .select("id, full_name")
    .in("id", ids);

  return (profiles ?? []).map((p) => ({ id: p.id, fullName: p.full_name }));
}
