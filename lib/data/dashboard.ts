import { createClient } from "@/lib/supabase/server";

export type DashboardAlert = {
  athleteId: string;
  athleteName: string;
  reason: string;
};

export type DashboardSummary = {
  totalAthletes: number;
  withoutPlan: number;
  unclaimed: number;
  gamesLogged: number;
  lastGame: { playedAt: string; opponent: string | null } | null;
  medicalAlerts: DashboardAlert[];
  noPlanAthletes: DashboardAlert[];
  recentEvaluations: {
    id: string;
    athleteName: string;
    type: string;
    occurredAt: string;
    notes: string | null;
  }[];
};

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const empty: DashboardSummary = {
    totalAthletes: 0,
    withoutPlan: 0,
    unclaimed: 0,
    gamesLogged: 0,
    lastGame: null,
    medicalAlerts: [],
    noPlanAthletes: [],
    recentEvaluations: [],
  };
  if (!user) return empty;

  const { data: careTeam } = await supabase
    .from("athlete_care_team")
    .select("athlete_id")
    .eq("expert_id", user.id)
    .eq("is_active", true);

  const athleteIds = [...new Set((careTeam ?? []).map((c) => c.athlete_id))];
  if (athleteIds.length === 0) return empty;

  const [{ data: profiles }, { data: medical }, { data: plans }, { data: statsGames }, { data: recentEvals }] =
    await Promise.all([
      supabase.from("athlete_profiles").select("id, full_name, claimed_user_id").in("id", athleteIds),
      supabase
        .from("athlete_medical_status")
        .select("athlete_id, active_injury_text, pain_zone, pain_severity")
        .in("athlete_id", athleteIds),
      supabase.from("plans").select("athlete_id").eq("type", "entrenamiento").in("athlete_id", athleteIds),
      supabase.from("game_stats").select("game_id").in("athlete_id", athleteIds),
      supabase
        .from("evaluations")
        .select("id, athlete_id, type, occurred_at, notes")
        .in("athlete_id", athleteIds)
        .order("occurred_at", { ascending: false })
        .limit(5),
    ]);

  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
  const unclaimed = (profiles ?? []).filter((p) => !p.claimed_user_id).length;

  const withPlanIds = new Set((plans ?? []).map((p) => p.athlete_id));
  const noPlanAthletes: DashboardAlert[] = athleteIds
    .filter((id) => !withPlanIds.has(id))
    .map((id) => ({ athleteId: id, athleteName: nameById.get(id) ?? "—", reason: "Sin rutina asignada" }));

  const medicalAlerts: DashboardAlert[] = (medical ?? [])
    .filter((m) => m.active_injury_text || m.pain_zone)
    .map((m) => ({
      athleteId: m.athlete_id,
      athleteName: nameById.get(m.athlete_id) ?? "—",
      reason: m.pain_zone
        ? `${m.pain_zone} · ${m.pain_severity ?? "—"}/10`
        : m.active_injury_text ?? "Lesión activa",
    }));

  const gameIds = [...new Set((statsGames ?? []).map((s) => s.game_id))];
  let lastGame: DashboardSummary["lastGame"] = null;
  if (gameIds.length) {
    const { data: games } = await supabase
      .from("games")
      .select("played_at, opponent")
      .in("id", gameIds)
      .order("played_at", { ascending: false })
      .limit(1);
    if (games?.[0]) lastGame = { playedAt: games[0].played_at, opponent: games[0].opponent };
  }

  return {
    totalAthletes: athleteIds.length,
    withoutPlan: noPlanAthletes.length,
    unclaimed,
    gamesLogged: gameIds.length,
    lastGame,
    medicalAlerts,
    noPlanAthletes,
    recentEvaluations: (recentEvals ?? []).map((e) => ({
      id: e.id,
      athleteName: nameById.get(e.athlete_id) ?? "—",
      type: e.type,
      occurredAt: e.occurred_at,
      notes: e.notes,
    })),
  };
}
