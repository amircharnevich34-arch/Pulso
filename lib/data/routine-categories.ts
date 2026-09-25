import { createClient } from "@/lib/supabase/server";

export type RoutineCategory = { id: string; key: string; label: string; sortOrder: number };

export async function getRoutineCategories(): Promise<RoutineCategory[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("routine_categories")
    .select("id, key, label, sort_order")
    .order("sort_order", { ascending: true });
  return (data ?? []).map((c) => ({ id: c.id, key: c.key, label: c.label, sortOrder: c.sort_order }));
}
