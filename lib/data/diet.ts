import { createClient } from "@/lib/supabase/server";

// Map keyed by `${mealSlotId}:${foodBankItemId}` -> portion_count logged today.
export async function getTodayDietLogs(
  athleteId: string,
  logDate: string
): Promise<Map<string, number>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("diet_logs")
    .select("meal_slot_id, food_bank_item_id, portion_count")
    .eq("athlete_id", athleteId)
    .eq("log_date", logDate);

  const map = new Map<string, number>();
  for (const row of data ?? []) {
    map.set(`${row.meal_slot_id}:${row.food_bank_item_id}`, row.portion_count);
  }
  return map;
}

export async function getTodayWaterMl(athleteId: string, logDate: string): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("water_logs")
    .select("total_ml")
    .eq("athlete_id", athleteId)
    .eq("log_date", logDate)
    .maybeSingle();

  return data?.total_ml ?? 0;
}
