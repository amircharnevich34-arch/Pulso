import { createClient } from "@/lib/supabase/server";

// The athlete_profiles.id for the currently logged-in deportista, if their
// account has been linked to a profile. Null means nobody has connected
// this login to a roster entry yet.
export async function getMyAthleteProfileId(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("athlete_profiles")
    .select("id")
    .eq("claimed_user_id", userId)
    .maybeSingle();
  return data?.id ?? null;
}

export type RosterAthlete = {
  athleteId: string;
  fullName: string;
  sport: string | null;
  status: string;
  claimed: boolean;
};

export async function getCareTeamRoster(): Promise<RosterAthlete[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: careTeam, error } = await supabase
    .from("athlete_care_team")
    .select("athlete_id, athlete_profiles!inner(id, full_name, sport, status, claimed_user_id)")
    .eq("expert_id", user.id)
    .eq("is_active", true);

  if (error || !careTeam || careTeam.length === 0) return [];

  return careTeam.map((row) => {
    const profile = row.athlete_profiles as unknown as {
      id: string;
      full_name: string;
      sport: string | null;
      status: string;
      claimed_user_id: string | null;
    };
    return {
      athleteId: profile.id,
      fullName: profile.full_name,
      sport: profile.sport,
      status: profile.status,
      claimed: profile.claimed_user_id != null,
    };
  });
}

export type AthleteDetail = {
  athleteId: string;
  fullName: string;
  sport: string | null;
  birthDate: string | null;
  claimed: boolean;
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
    .select("id, full_name, sport, birth_date, claimed_user_id")
    .eq("id", athleteId)
    .maybeSingle();

  if (profileError || !profile) return null;

  const [{ data: medical }, { data: training }, { data: nutrition }, { data: evaluations }] =
    await Promise.all([
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
    athleteId: profile.id,
    fullName: profile.full_name,
    sport: profile.sport,
    birthDate: profile.birth_date,
    claimed: profile.claimed_user_id != null,
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
