import { createClient } from "@/lib/supabase/server";
import { todayInMexicoCity } from "@/lib/date";

export type TrainingPlanItem = {
  id: string;
  description: string;
  position: number;
  categoryId: string;
  categoryKey: string;
  categoryLabel: string;
};

export type TrainingPlan = {
  id: string;
  name: string;
  items: TrainingPlanItem[];
};

export async function getActiveTrainingPlan(athleteId: string): Promise<TrainingPlan | null> {
  const supabase = await createClient();
  const today = todayInMexicoCity();

  const { data: plan } = await supabase
    .from("plans")
    .select("id, name")
    .eq("athlete_id", athleteId)
    .eq("type", "entrenamiento")
    .or(`expires_at.is.null,expires_at.gte.${today}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!plan) return null;

  const { data: items } = await supabase
    .from("plan_items")
    .select("id, description, position, routine_categories(id, key, label)")
    .eq("plan_id", plan.id)
    .order("position", { ascending: true });

  return {
    id: plan.id,
    name: plan.name,
    items: (items ?? []).map((i) => {
      const cat = i.routine_categories as unknown as { id: string; key: string; label: string } | null;
      return {
        id: i.id,
        description: i.description,
        position: i.position,
        categoryId: cat?.id ?? "",
        categoryKey: cat?.key ?? "otro",
        categoryLabel: cat?.label ?? "Otro",
      };
    }),
  };
}
