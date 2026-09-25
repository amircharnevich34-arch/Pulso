import { createClient } from "@/lib/supabase/server";

export type GameSummary = {
  id: string;
  opponent: string | null;
  playedAt: string;
  location: string | null;
  teamScore: number | null;
  opponentScore: number | null;
};

export async function getGamesForCareTeam(): Promise<GameSummary[]> {
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

  const { data: stats } = await supabase
    .from("game_stats")
    .select("game_id")
    .in("athlete_id", athleteIds);

  const gameIds = [...new Set((stats ?? []).map((s) => s.game_id))];
  if (gameIds.length === 0) return [];

  const { data: games } = await supabase
    .from("games")
    .select("id, opponent, played_at, location, team_score, opponent_score")
    .in("id", gameIds)
    .order("played_at", { ascending: false });

  return (games ?? []).map((g) => ({
    id: g.id,
    opponent: g.opponent,
    playedAt: g.played_at,
    location: g.location,
    teamScore: g.team_score,
    opponentScore: g.opponent_score,
  }));
}

export type GameStatRow = {
  athleteId: string;
  athleteName: string;
  minutesPlayed: number | null;
  points: number | null;
  rebounds: number | null;
  assists: number | null;
  steals: number | null;
  blocks: number | null;
  fouls: number | null;
  turnovers: number | null;
};

export type GameDetail = GameSummary & { stats: GameStatRow[] };

export async function getGameDetail(gameId: string): Promise<GameDetail | null> {
  const supabase = await createClient();

  const { data: game } = await supabase
    .from("games")
    .select("id, opponent, played_at, location, team_score, opponent_score")
    .eq("id", gameId)
    .maybeSingle();
  if (!game) return null;

  const { data: stats } = await supabase
    .from("game_stats")
    .select(
      "athlete_id, minutes_played, points, rebounds, assists, steals, blocks, fouls, turnovers, athlete_profiles(full_name)"
    )
    .eq("game_id", gameId);

  return {
    id: game.id,
    opponent: game.opponent,
    playedAt: game.played_at,
    location: game.location,
    teamScore: game.team_score,
    opponentScore: game.opponent_score,
    stats: (stats ?? []).map((s) => ({
      athleteId: s.athlete_id,
      athleteName: (s.athlete_profiles as unknown as { full_name: string } | null)?.full_name ?? "—",
      minutesPlayed: s.minutes_played,
      points: s.points,
      rebounds: s.rebounds,
      assists: s.assists,
      steals: s.steals,
      blocks: s.blocks,
      fouls: s.fouls,
      turnovers: s.turnovers,
    })),
  };
}

export type AthleteGameLog = {
  gameId: string;
  playedAt: string;
  opponent: string | null;
  minutesPlayed: number | null;
  points: number | null;
  rebounds: number | null;
  assists: number | null;
  steals: number | null;
  blocks: number | null;
  fouls: number | null;
  turnovers: number | null;
};

export async function getAthleteGameLog(athleteId: string): Promise<AthleteGameLog[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("game_stats")
    .select(
      "minutes_played, points, rebounds, assists, steals, blocks, fouls, turnovers, games!inner(id, opponent, played_at)"
    )
    .eq("athlete_id", athleteId)
    .order("games(played_at)", { ascending: false });

  return (data ?? []).map((s) => {
    const game = s.games as unknown as { id: string; opponent: string | null; played_at: string };
    return {
      gameId: game.id,
      playedAt: game.played_at,
      opponent: game.opponent,
      minutesPlayed: s.minutes_played,
      points: s.points,
      rebounds: s.rebounds,
      assists: s.assists,
      steals: s.steals,
      blocks: s.blocks,
      fouls: s.fouls,
      turnovers: s.turnovers,
    };
  });
}
