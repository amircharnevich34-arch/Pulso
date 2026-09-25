"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type EvaluationFormState = { error?: string; success?: boolean };

export async function createEvaluation(
  _prev: EvaluationFormState,
  formData: FormData
): Promise<EvaluationFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No hay sesión activa." };

  const athleteId = String(formData.get("athleteId") ?? "");
  const type = String(formData.get("type") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!athleteId || !type) {
    return { error: "Faltan datos obligatorios." };
  }

  let painZone: string | null = null;
  let painSeverity: number | null = null;
  const data: Record<string, unknown> = {};

  if (type === "medica") {
    const restingHr = formData.get("restingHr");
    const bloodPressure = formData.get("bloodPressure");
    const nextCheckupDate = formData.get("nextCheckupDate");
    painZone = (formData.get("painZone") as string) || null;
    const severityRaw = formData.get("painSeverity");
    painSeverity = severityRaw ? Number(severityRaw) : null;

    await supabase.from("athlete_medical_status").upsert({
      athlete_id: athleteId,
      resting_hr: restingHr ? Number(restingHr) : null,
      blood_pressure: bloodPressure ? String(bloodPressure) : null,
      active_injury_text: notes,
      next_checkup_date: nextCheckupDate ? String(nextCheckupDate) : null,
      pain_zone: painZone,
      pain_severity: painSeverity,
      updated_at: new Date().toISOString(),
    });
  } else if (type === "entrenamiento") {
    data.testRealizado = formData.get("testRealizado") || null;
    data.resultado = formData.get("resultado") || null;
    data.rpe = formData.get("rpe") ? Number(formData.get("rpe")) : null;

    await supabase.from("athlete_training_status").upsert({
      athlete_id: athleteId,
      speed_test_result: data.resultado as string | null,
      updated_at: new Date().toISOString(),
    });
  }

  const { error } = await supabase.from("evaluations").insert({
    athlete_id: athleteId,
    author_id: user.id,
    type,
    notes,
    pain_zone: painZone,
    pain_severity: painSeverity,
    data,
  });

  if (error) {
    return { error: "No se pudo guardar la evaluación: " + error.message };
  }

  revalidatePath(`/deportistas/${athleteId}`);
  return { success: true };
}
