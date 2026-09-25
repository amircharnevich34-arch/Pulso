import Link from "next/link";
import { getCareTeamRoster } from "@/lib/data/athletes";
import { getGamesForCareTeam } from "@/lib/data/games";
import { GameForm } from "@/components/juegos/game-form";

export default async function JuegosPage() {
  const [athletes, games] = await Promise.all([getCareTeamRoster(), getGamesForCareTeam()]);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Partidos</h1>

      {athletes.length === 0 ? (
        <p className="mt-4 text-black/60">
          Todavía no tenés deportistas asignados para cargar un partido.
        </p>
      ) : (
        <div className="mt-6 rounded-md border border-black/10 p-5">
          <GameForm athletes={athletes} />
        </div>
      )}

      <section className="mt-10">
        <h2 className="mb-3 font-semibold">Partidos jugados</h2>
        {games.length === 0 ? (
          <p className="text-sm text-black/50">Todavía no hay partidos cargados.</p>
        ) : (
          <ul className="divide-y divide-black/5">
            {games.map((g) => (
              <li key={g.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <span className="font-medium">
                    {g.playedAt} {g.opponent ? `vs ${g.opponent}` : ""}
                  </span>
                  {g.location && <span className="ml-2 text-black/50">— {g.location}</span>}
                </div>
                <div className="flex items-center gap-3">
                  {g.teamScore != null && g.opponentScore != null && (
                    <span className="tabular-nums text-black/60">
                      {g.teamScore} - {g.opponentScore}
                    </span>
                  )}
                  <Link href={`/juegos/${g.id}`} className="underline underline-offset-2">
                    Ver stats
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
