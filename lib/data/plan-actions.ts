"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CreateTrainingPlanInput = {
  athleteId: string;
  name: string;
  expiresAt: string | null;
  items: string[];
};

export async function createTrainingPlan(input: CreateTrainingPlanInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No hay sesión activa.");

  const { data: plan, error } = await supabase
    .from("plans")
    .insert({
      type: "entrenamiento",
      name: input.name,
      athlete_id: input.athleteId,
      expires_at: input.expiresAt,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !plan) throw new Error(error?.message ?? "No se pudo crear el plan.");

  const rows = input.items
    .map((d) => d.trim())
    .filter(Boolean)
    .map((description, i) => ({ plan_id: plan.id, position: i, description }));

  if (rows.length) {
    const { error: itemsError } = await supabase.from("plan_items").insert(rows);
    if (itemsError) throw new Error(itemsError.message);
  }

  await supabase
    .from("athlete_training_status")
    .upsert(
      { athlete_id: input.athleteId, current_plan_id: plan.id, updated_at: new Date().toISOString() },
      { onConflict: "athlete_id" }
    );

  revalidatePath("/planes");
  revalidatePath(`/deportistas/${input.athleteId}`);
  revalidatePath("/hoy");
  return { id: plan.id as string };
}

export type CreateNutritionPlanInput = {
  athleteId: string;
  name: string;
  expiresAt: string | null;
  waterTargetMl: number | null;
  targets: { mealSlotId: string; categoryId: string; portions: number }[];
};

export async function createNutritionPlan(input: CreateNutritionPlanInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No hay sesión activa.");

  const { data: plan, error } = await supabase
    .from("plans")
    .insert({
      type: "nutricion",
      name: input.name,
      athlete_id: input.athleteId,
      expires_at: input.expiresAt,
      water_target_ml: input.waterTargetMl,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !plan) throw new Error(error?.message ?? "No se pudo crear el plan.");

  const rows = input.targets
    .filter((t) => t.portions > 0)
    .map((t) => ({
      plan_id: plan.id,
      meal_slot_id: t.mealSlotId,
      food_category_id: t.categoryId,
      target_portions: t.portions,
    }));

  if (rows.length) {
    const { error: targetsError } = await supabase.from("diet_plan_targets").insert(rows);
    if (targetsError) throw new Error(targetsError.message);
  }

  await supabase
    .from("athlete_nutrition_status")
    .upsert(
      { athlete_id: input.athleteId, current_plan_id: plan.id, updated_at: new Date().toISOString() },
      { onConflict: "athlete_id" }
    );

  revalidatePath("/planes");
  revalidatePath(`/deportistas/${input.athleteId}`);
  revalidatePath("/hoy");
  return { id: plan.id as string };
}

export type PlanSummary = {
  id: string;
  type: string;
  name: string;
  athleteId: string;
  athleteName: string;
  expiresAt: string | null;
  createdAt: string;
};

export async function getPlansForCareTeam(): Promise<PlanSummary[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: careTeam } = await supabase
    .from("athlete_care_team")
    .select("athlete_id")
    .eq("expert_id", user.id)
    .eq("is_active", true);

  const athleteIds = [...new Set((careTeam ?? []).map((c) => c.athlete_id))];
  if (athleteIds.length === 0) return [];

  const [{ data: plans }, { data: profiles }] = await Promise.all([
    supabase
      .from("plans")
      .select("id, type, name, athlete_id, expires_at, created_at")
      .in("athlete_id", athleteIds)
      .order("created_at", { ascending: false }),
    supabase.from("public_profiles").select("id, full_name").in("id", athleteIds),
  ]);

  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  return (plans ?? []).map((p) => ({
    id: p.id,
    type: p.type,
    name: p.name,
    athleteId: p.athlete_id,
    athleteName: nameById.get(p.athlete_id) ?? "—",
    expiresAt: p.expires_at,
    createdAt: p.created_at,
  }));
}
