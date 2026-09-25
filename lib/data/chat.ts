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
// themselves (if they've claimed an account) plus their active care team,
// so realtime messages can always resolve an author name without an extra
// round trip. Keyed by auth user id, since that's what chat_messages.author_id
// stores — an unclaimed athlete has no account and so can't post at all.
export async function getChatParticipants(athleteId: string): Promise<ChatParticipant[]> {
  const supabase = await createClient();

  const [{ data: profile }, { data: careTeam }] = await Promise.all([
    supabase.from("athlete_profiles").select("full_name, claimed_user_id").eq("id", athleteId).maybeSingle(),
    supabase.from("athlete_care_team").select("expert_id").eq("athlete_id", athleteId).eq("is_active", true),
  ]);

  const expertIds = [...new Set((careTeam ?? []).map((c) => c.expert_id))];
  const { data: expertProfiles } = expertIds.length
    ? await supabase.from("public_profiles").select("id, full_name").in("id", expertIds)
    : { data: [] as { id: string; full_name: string }[] };

  const participants: ChatParticipant[] = (expertProfiles ?? []).map((p) => ({
    id: p.id,
    fullName: p.full_name,
  }));
  if (profile?.claimed_user_id) {
    participants.push({ id: profile.claimed_user_id, fullName: profile.full_name });
  }
  return participants;
}
