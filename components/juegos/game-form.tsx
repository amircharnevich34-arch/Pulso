"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createGame, type GameStatInput } from "@/lib/data/game-actions";
import type { RosterAthlete } from "@/lib/data/athletes";

const statFields: { key: keyof Omit<GameStatInput, "athleteId">; label: string }[] = [
  { key: "minutesPlayed", label: "Min" },
  { key: "points", label: "Pts" },
  { key: "rebounds", label: "Reb" },
  { key: "assists", label: "Ast" },
  { key: "steals", label: "Rob" },
  { key: "blocks", label: "Blq" },
  { key: "fouls", label: "Faltas" },
  { key: "turnovers", label: "Pérdidas" },
];

function emptyStats(): Omit<GameStatInput, "athleteId"> {
  return {
    minutesPlayed: null,
    points: null,
    rebounds: null,
    assists: null,
    steals: null,
    blocks: null,
    fouls: null,
    turnovers: null,
  };
}

export function GameForm({ athletes }: { athletes: RosterAthlete[] }) {
  const router = useRouter();
  const [opponent, setOpponent] = useState("");
  const [playedAt, setPlayedAt] = useState("");
  const [location, setLocation] = useState("");
  const [teamScore, setTeamScore] = useState("");
  const [opponentScore, setOpponentScore] = useState("");
  const [stats, setStats] = useState<Record<string, Omit<GameStatInput, "athleteId">>>(
    Object.fromEntries(athletes.map((a) => [a.athleteId, emptyStats()]))
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setStat(athleteId: string, key: keyof Omit<GameStatInput, "athleteId">, value: string) {
    setStats((prev) => ({
      ...prev,
      [athleteId]: { ...prev[athleteId], [key]: value === "" ? null : Number(value) },
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!playedAt) {
      setError("Poné la fecha del partido.");
      return;
    }
    setPending(true);
    try {
      await createGame({
        opponent: opponent.trim(),
        playedAt,
        location: location.trim() || null,
        teamScore: teamScore ? Number(teamScore) : null,
        opponentScore: opponentScore ? Number(opponentScore) : null,
        notes: null,
        stats: athletes.map((a) => ({ athleteId: a.athleteId, ...stats[a.athleteId] })),
      });
      setOpponent("");
      setPlayedAt("");
      setLocation("");
      setTeamScore("");
      setOpponentScore("");
      setStats(Object.fromEntries(athletes.map((a) => [a.athleteId, emptyStats()])));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el partido.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="flex flex-wrap gap-4">
        <label className="grid gap-1 text-sm">
          <span className="text-black/60">Rival</span>
          <input
            value={opponent}
            onChange={(e) => setOpponent(e.target.value)}
            className="rounded-md border border-black/15 px-3 py-2"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-black/60">Fecha</span>
          <input
            type="date"
            value={playedAt}
            onChange={(e) => setPlayedAt(e.target.value)}
            className="rounded-md border border-black/15 px-3 py-2"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-black/60">Sede</span>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="rounded-md border border-black/15 px-3 py-2"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-black/60">Marcador (nosotros)</span>
          <input
            type="number"
            value={teamScore}
            onChange={(e) => setTeamScore(e.target.value)}
            className="w-20 rounded-md border border-black/15 px-3 py-2"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-black/60">Marcador (rival)</span>
          <input
            type="number"
            value={opponentScore}
            onChange={(e) => setOpponentScore(e.target.value)}
            className="w-20 rounded-md border border-black/15 px-3 py-2"
          />
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border border-black/10 bg-black/[.02] p-2 text-left">Deportista</th>
              {statFields.map((f) => (
                <th key={f.key} className="border border-black/10 bg-black/[.02] p-2 font-medium">
                  {f.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {athletes.map((a) => (
              <tr key={a.athleteId}>
                <td className="border border-black/10 p-2 font-medium">{a.fullName}</td>
                {statFields.map((f) => (
                  <td key={f.key} className="border border-black/10 p-1">
                    <input
                      type="number"
                      value={stats[a.athleteId]?.[f.key] ?? ""}
                      onChange={(e) => setStat(a.athleteId, f.key, e.target.value)}
                      className="w-16 rounded-md border border-transparent px-2 py-1 text-center hover:border-black/15 focus:border-black/30"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Guardar partido"}
      </button>
    </form>
  );
}
