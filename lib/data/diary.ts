import { createClient } from "@/lib/supabase/server";

export type PainEntry = {
  id: string;
  entryDate: string;
  painZone: string | null;
  painSeverity: number | null;
  energyLevel: string | null;
  notes: string | null;
};

export async function getPainDiary(athleteId: string): Promise<PainEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("diary_pain_entries")
    .select("id, entry_date, pain_zone, pain_severity, energy_level, notes")
    .eq("athlete_id", athleteId)
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false });

  return (data ?? []).map((d) => ({
    id: d.id,
    entryDate: d.entry_date,
    painZone: d.pain_zone,
    painSeverity: d.pain_severity,
    energyLevel: d.energy_level,
    notes: d.notes,
  }));
}
