import { createClient } from "@/lib/supabase/server";
import { todayInMexicoCity } from "@/lib/date";

export type TrainingPlan = {
  id: string;
  name: string;
  items: { id: string; description: string; position: number }[];
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
    .select("id, description, position")
    .eq("plan_id", plan.id)
    .order("position", { ascending: true });

  return { id: plan.id, name: plan.name, items: items ?? [] };
}

export type NutritionPlanTarget = {
  mealSlotId: string;
  mealKey: string;
  mealLabel: string;
  mealSortOrder: number;
  categoryId: string;
  categoryKey: string;
  categoryLabel: string;
  categorySortOrder: number;
  targetPortions: number;
};

export type NutritionPlan = {
  id: string;
  name: string;
  waterTargetMl: number | null;
  targets: NutritionPlanTarget[];
};

export async function getActiveNutritionPlan(athleteId: string): Promise<NutritionPlan | null> {
  const supabase = await createClient();
  const today = todayInMexicoCity();

  const { data: plan } = await supabase
    .from("plans")
    .select("id, name, water_target_ml")
    .eq("athlete_id", athleteId)
    .eq("type", "nutricion")
    .or(`expires_at.is.null,expires_at.gte.${today}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!plan) return null;

  const { data: targets } = await supabase
    .from("diet_plan_targets")
    .select(
      "target_portions, meal_slots!inner(id, key, label, sort_order), food_categories!inner(id, key, label, sort_order)"
    )
    .eq("plan_id", plan.id);

  const mapped = (targets ?? []).map((t) => {
    const meal = t.meal_slots as unknown as { id: string; key: string; label: string; sort_order: number };
    const cat = t.food_categories as unknown as { id: string; key: string; label: string; sort_order: number };
    return {
      mealSlotId: meal.id,
      mealKey: meal.key,
      mealLabel: meal.label,
      mealSortOrder: meal.sort_order,
      categoryId: cat.id,
      categoryKey: cat.key,
      categoryLabel: cat.label,
      categorySortOrder: cat.sort_order,
      targetPortions: t.target_portions,
    };
  });

  mapped.sort((a, b) => a.mealSortOrder - b.mealSortOrder || a.categorySortOrder - b.categorySortOrder);

  return { id: plan.id, name: plan.name, waterTargetMl: plan.water_target_ml, targets: mapped };
}
