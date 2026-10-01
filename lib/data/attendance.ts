import { createClient } from "@/lib/supabase/server";
import { getCareTeamRoster } from "@/lib/data/athletes";

export type PracticeSummary = {
  id: string;
  practiceDate: string;
  startTime: string;
  endTime: string;
  presentCount: number;
  rosterSize: number;
};

export async function getPractices(): Promise<PracticeSummary[]> {
  const supabase = await createClient();
  const roster = await getCareTeamRoster();

  const { data: practices } = await supabase
    .from("practices")
    .select("id, practice_date, start_time, end_time")
    .order("practice_date", { ascending: true });

  if (!practices || practices.length === 0) return [];

  const { data: attendance } = await supabase
    .from("attendance")
    .select("practice_id, status")
    .eq("status", "presente");

  const presentByPractice = new Map<string, number>();
  for (const row of attendance ?? []) {
    presentByPractice.set(row.practice_id, (presentByPractice.get(row.practice_id) ?? 0) + 1);
  }

  return practices.map((p) => ({
    id: p.id,
    practiceDate: p.practice_date,
    startTime: p.start_time,
    endTime: p.end_time,
    presentCount: presentByPractice.get(p.id) ?? 0,
    rosterSize: roster.length,
  }));
}

export type PracticeDetail = {
  id: string;
  practiceDate: string;
  startTime: string;
  endTime: string;
};

export async function getPracticeDetail(practiceId: string): Promise<PracticeDetail | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("practices")
    .select("id, practice_date, start_time, end_time")
    .eq("id", practiceId)
    .maybeSingle();

  if (!data) return null;
  return { id: data.id, practiceDate: data.practice_date, startTime: data.start_time, endTime: data.end_time };
}

export type PracticeAttendee = {
  athleteId: string;
  fullName: string;
  status: "presente" | "ausente" | null;
};

export async function getPracticeAttendance(practiceId: string): Promise<PracticeAttendee[]> {
  const supabase = await createClient();
  const roster = await getCareTeamRoster();

  const { data: attendance } = await supabase
    .from("attendance")
    .select("athlete_id, status")
    .eq("practice_id", practiceId);

  const statusById = new Map((attendance ?? []).map((a) => [a.athlete_id, a.status as "presente" | "ausente"]));

  return roster
    .map((a) => ({ athleteId: a.athleteId, fullName: a.fullName, status: statusById.get(a.athleteId) ?? null }))
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
}
