import { createClient } from "@/lib/supabase/server";

export async function getTodayCompletions(planItemIds: string[], logDate: string): Promise<Set<string>> {
  if (planItemIds.length === 0) return new Set();
  const supabase = await createClient();
  const { data } = await supabase
    .from("routine_completions")
    .select("plan_item_id")
    .in("plan_item_id", planItemIds)
    .eq("log_date", logDate)
    .eq("completed", true);

  return new Set((data ?? []).map((r) => r.plan_item_id));
}
