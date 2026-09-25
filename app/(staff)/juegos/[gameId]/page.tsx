import { notFound } from "next/navigation";
import { getGameDetail } from "@/lib/data/games";

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await params;
  const game = await getGameDetail(gameId);
  if (!game) notFound();

  return (
    <main className="p-8">
      <p className="text-sm text-black/50">Partido</p>
      <h1 className="text-2xl font-semibold">
        {game.playedAt} {game.opponent ? `vs ${game.opponent}` : ""}
      </h1>
      {game.location && <p className="mt-1 text-black/60">{game.location}</p>}
      {game.teamScore != null && game.opponentScore != null && (
        <p className="mt-1 text-lg font-semibold tabular-nums">
          {game.teamScore} - {game.opponentScore}
        </p>
      )}

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border border-black/10 bg-black/[.02] p-2 text-left">Deportista</th>
              <th className="border border-black/10 bg-black/[.02] p-2">Min</th>
              <th className="border border-black/10 bg-black/[.02] p-2">Pts</th>
              <th className="border border-black/10 bg-black/[.02] p-2">Reb</th>
              <th className="border border-black/10 bg-black/[.02] p-2">Ast</th>
              <th className="border border-black/10 bg-black/[.02] p-2">Rob</th>
              <th className="border border-black/10 bg-black/[.02] p-2">Blq</th>
              <th className="border border-black/10 bg-black/[.02] p-2">Faltas</th>
              <th className="border border-black/10 bg-black/[.02] p-2">Pérdidas</th>
            </tr>
          </thead>
          <tbody>
            {game.stats.map((s) => (
              <tr key={s.athleteId}>
                <td className="border border-black/10 p-2 font-medium">{s.athleteName}</td>
                <td className="border border-black/10 p-2 text-center tabular-nums">{s.minutesPlayed ?? "—"}</td>
                <td className="border border-black/10 p-2 text-center tabular-nums">{s.points ?? "—"}</td>
                <td className="border border-black/10 p-2 text-center tabular-nums">{s.rebounds ?? "—"}</td>
                <td className="border border-black/10 p-2 text-center tabular-nums">{s.assists ?? "—"}</td>
                <td className="border border-black/10 p-2 text-center tabular-nums">{s.steals ?? "—"}</td>
                <td className="border border-black/10 p-2 text-center tabular-nums">{s.blocks ?? "—"}</td>
                <td className="border border-black/10 p-2 text-center tabular-nums">{s.fouls ?? "—"}</td>
                <td className="border border-black/10 p-2 text-center tabular-nums">{s.turnovers ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
