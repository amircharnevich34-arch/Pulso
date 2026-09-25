"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CreateTrainingPlanInput = {
  athleteId: string;
  name: string;
  expiresAt: string | null;
  items: { categoryId: string; description: string }[];
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
    .map((it) => ({ ...it, description: it.description.trim() }))
    .filter((it) => it.description)
    .map((it, i) => ({
      plan_id: plan.id,
      position: i,
      description: it.description,
      routine_category_id: it.categoryId,
    }));

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

export type PlanSummary = {
  id: string;
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
      .select("id, name, athlete_id, expires_at, created_at")
      .in("athlete_id", athleteIds)
      .order("created_at", { ascending: false }),
    supabase.from("athlete_profiles").select("id, full_name").in("id", athleteIds),
  ]);

  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  return (plans ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    athleteId: p.athlete_id,
    athleteName: nameById.get(p.athlete_id) ?? "—",
    expiresAt: p.expires_at,
    createdAt: p.created_at,
  }));
}
