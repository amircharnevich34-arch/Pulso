"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { todayInMexicoCity } from "@/lib/date";

export type DiaryFormState = { error?: string; success?: boolean };

export async function createPainEntry(
  _prev: DiaryFormState,
  formData: FormData
): Promise<DiaryFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No hay sesión activa." };

  const painZone = (formData.get("painZone") as string) || null;
  const severityRaw = formData.get("painSeverity");
  const energyLevel = (formData.get("energyLevel") as string) || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const { error } = await supabase.from("diary_pain_entries").insert({
    athlete_id: user.id,
    entry_date: todayInMexicoCity(),
    pain_zone: painZone,
    pain_severity: severityRaw ? Number(severityRaw) : null,
    energy_level: energyLevel,
    notes,
  });

  if (error) return { error: "No se pudo guardar: " + error.message };

  revalidatePath("/hoy");
  revalidatePath("/diario");
  return { success: true };
}

export async function createDietDiaryEntry(
  _prev: DiaryFormState,
  formData: FormData
): Promise<DiaryFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No hay sesión activa." };

  const notes = String(formData.get("notes") ?? "").trim();
  if (!notes) return { error: "Escribí algo antes de guardar." };

  const { error } = await supabase.from("diary_diet_entries").insert({
    athlete_id: user.id,
    entry_date: todayInMexicoCity(),
    notes,
  });

  if (error) return { error: "No se pudo guardar: " + error.message };

  revalidatePath("/hoy");
  return { success: true };
}
