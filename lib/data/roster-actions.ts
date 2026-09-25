"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function createOne(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  role: string,
  fullName: string,
  sport: string | null
) {
  const { data: profile, error } = await supabase
    .from("athlete_profiles")
    .insert({ full_name: fullName, sport })
    .select("id")
    .single();
  if (error || !profile) throw new Error(error?.message ?? "No se pudo crear el perfil.");

  const { error: careTeamError } = await supabase.from("athlete_care_team").insert({
    athlete_id: profile.id,
    expert_id: userId,
    role,
  });
  if (careTeamError) throw new Error(careTeamError.message);

  return profile.id as string;
}

export async function createAthleteProfile(input: { fullName: string; sport: string | null }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No hay sesión activa.");

  const { data: me } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (!me) throw new Error("No se pudo leer tu perfil.");

  const id = await createOne(supabase, user.id, me.role, input.fullName.trim(), input.sport);

  revalidatePath("/deportistas");
  return { id };
}

export async function claimAthleteProfile(input: { athleteId: string; email: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No hay sesión activa.");

  const { data: matchedUserId, error: lookupError } = await supabase.rpc("find_user_id_by_email", {
    lookup_email: input.email.trim(),
  });
  if (lookupError) throw new Error(lookupError.message);
  if (!matchedUserId) throw new Error("No existe ninguna cuenta con ese correo todavía.");

  const { error } = await supabase
    .from("athlete_profiles")
    .update({ claimed_user_id: matchedUserId })
    .eq("id", input.athleteId);
  if (error) throw new Error(error.message);

  revalidatePath(`/deportistas/${input.athleteId}`);
  revalidatePath("/deportistas");
  return { userId: matchedUserId as string };
}

export async function createAthleteProfilesBulk(input: { names: string[]; sport: string | null }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No hay sesión activa.");

  const { data: me } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (!me) throw new Error("No se pudo leer tu perfil.");

  const created: string[] = [];
  for (const name of input.names) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    created.push(await createOne(supabase, user.id, me.role, trimmed, input.sport));
  }

  revalidatePath("/deportistas");
  return { count: created.length };
}
