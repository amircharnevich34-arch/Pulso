"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type GameStatInput = {
  athleteId: string;
  minutesPlayed: number | null;
  points: number | null;
  rebounds: number | null;
  assists: number | null;
  steals: number | null;
  blocks: number | null;
  fouls: number | null;
  turnovers: number | null;
};

export async function createGame(input: {
  opponent: string;
  playedAt: string;
  location: string | null;
  teamScore: number | null;
  opponentScore: number | null;
  notes: string | null;
  stats: GameStatInput[];
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No hay sesión activa.");

  const { data: game, error } = await supabase
    .from("games")
    .insert({
      opponent: input.opponent || null,
      played_at: input.playedAt,
      location: input.location,
      team_score: input.teamScore,
      opponent_score: input.opponentScore,
      notes: input.notes,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !game) throw new Error(error?.message ?? "No se pudo crear el partido.");

  const rows = input.stats
    .filter((s) => s.athleteId)
    .map((s) => ({
      game_id: game.id,
      athlete_id: s.athleteId,
      minutes_played: s.minutesPlayed,
      points: s.points,
      rebounds: s.rebounds,
      assists: s.assists,
      steals: s.steals,
      blocks: s.blocks,
      fouls: s.fouls,
      turnovers: s.turnovers,
    }));

  if (rows.length) {
    const { error: statsError } = await supabase.from("game_stats").insert(rows);
    if (statsError) throw new Error(statsError.message);
  }

  revalidatePath("/juegos");
  for (const s of input.stats) {
    revalidatePath(`/deportistas/${s.athleteId}`);
  }
  return { id: game.id as string };
}
