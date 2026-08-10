import { createClient } from "@/lib/supabase/server";

export type RosterAthlete = {
  athleteId: string;
  fullName: string;
  sport: string | null;
  status: string;
};

export async function getCareTeamRoster(): Promise<RosterAthlete[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: careTeam, error } = await supabase
    .from("athlete_care_team")
    .select("athlete_id, athlete_profiles!inner(user_id, sport, status)")
    .eq("expert_id", user.id)
    .eq("is_active", true);

  if (error || !careTeam || careTeam.length === 0) return [];

  const athleteIds = careTeam.map((row) => row.athlete_id);
  const { data: profiles } = await supabase
    .from("public_profiles")
    .select("id, full_name")
    .in("id", athleteIds);

  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  return careTeam.map((row) => {
    const profile = row.athlete_profiles as unknown as {
      user_id: string;
      sport: string | null;
      status: string;
    };
    return {
      athleteId: profile.user_id,
      fullName: nameById.get(profile.user_id) ?? "—",
      sport: profile.sport,
      status: profile.status,
    };
  });
}

export type AthleteDetail = {
  athleteId: string;
  fullName: string;
  sport: string | null;
  birthDate: string | null;
  medical: {
    restingHr: number | null;
    bloodPressure: string | null;
    activeInjuryText: string | null;
    nextCheckupDate: string | null;
    painZone: string | null;
    painSeverity: number | null;
  } | null;
  training: {
    vo2max: number | null;
    maxStrength: string | null;
    speedTestResult: string | null;
    nextSessionAt: string | null;
  } | null;
  nutrition: {
    calorieTarget: number | null;
    proteinG: number | null;
    carbsG: number | null;
    fatG: number | null;
    nextConsultDate: string | null;
    adherencePct: number | null;
  } | null;
  evaluations: {
    id: string;
    type: string;
    occurredAt: string;
    notes: string | null;
    author: string;
  }[];
};

export async function getAthleteDetail(
  athleteId: string
): Promise<AthleteDetail | null> {
  const supabase = await createClient();

  const { data: profile, error: profileError } = await supabase
    .from("athlete_profiles")
    .select("user_id, sport, birth_date")
    .eq("user_id", athleteId)
    .maybeSingle();

  if (profileError || !profile) return null;

  const [{ data: ownProfile }, { data: medical }, { data: training }, { data: nutrition }, { data: evaluations }] =
    await Promise.all([
      supabase.from("public_profiles").select("full_name").eq("id", athleteId).maybeSingle(),
      supabase
        .from("athlete_medical_status")
        .select("*")
        .eq("athlete_id", athleteId)
        .maybeSingle(),
      supabase
        .from("athlete_training_status")
        .select("*")
        .eq("athlete_id", athleteId)
        .maybeSingle(),
      supabase
        .from("athlete_nutrition_status")
        .select("*")
        .eq("athlete_id", athleteId)
        .maybeSingle(),
      supabase
        .from("evaluations")
        .select("id, type, occurred_at, notes, author_id")
        .eq("athlete_id", athleteId)
        .order("occurred_at", { ascending: false }),
    ]);

  const authorIds = [...new Set((evaluations ?? []).map((e) => e.author_id))];
  const { data: authors } = authorIds.length
    ? await supabase.from("public_profiles").select("id, full_name").in("id", authorIds)
    : { data: [] as { id: string; full_name: string }[] };
  const authorNameById = new Map((authors ?? []).map((a) => [a.id, a.full_name]));

  return {
    athleteId: profile.user_id,
    fullName: ownProfile?.full_name ?? "—",
    sport: profile.sport,
    birthDate: profile.birth_date,
    medical: medical
      ? {
          restingHr: medical.resting_hr,
          bloodPressure: medical.blood_pressure,
          activeInjuryText: medical.active_injury_text,
          nextCheckupDate: medical.next_checkup_date,
          painZone: medical.pain_zone,
          painSeverity: medical.pain_severity,
        }
      : null,
    training: training
      ? {
          vo2max: training.vo2max,
          maxStrength: training.max_strength,
          speedTestResult: training.speed_test_result,
          nextSessionAt: training.next_session_at,
        }
      : null,
    nutrition: nutrition
      ? {
          calorieTarget: nutrition.calorie_target,
          proteinG: nutrition.protein_g,
          carbsG: nutrition.carbs_g,
          fatG: nutrition.fat_g,
          nextConsultDate: nutrition.next_consult_date,
          adherencePct: nutrition.adherence_pct,
        }
      : null,
    evaluations: (evaluations ?? []).map((e) => ({
      id: e.id,
      type: e.type,
      occurredAt: e.occurred_at,
      notes: e.notes,
      author: authorNameById.get(e.author_id) ?? "—",
    })),
  };
}
