import Link from "next/link";
import { getCareTeamRoster } from "@/lib/data/athletes";

export default async function DeportistasPage() {
  const roster = await getCareTeamRoster();

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Deportistas</h1>
      <p className="mt-1 text-black/60">
        Los deportistas que tenés asignados como parte de su equipo de expertos.
      </p>

      {roster.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-black/15 p-8 text-center">
          <p className="font-medium">Todavía no tenés deportistas asignados.</p>
          <p className="mt-1 text-sm text-black/60">
            Cuando se te asigne un deportista como parte de su equipo, va a aparecer acá.
          </p>
        </div>
      ) : (
        <table className="mt-6 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 text-black/50">
              <th className="py-2 font-medium">Nombre</th>
              <th className="py-2 font-medium">Deporte</th>
              <th className="py-2 font-medium">Estado</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {roster.map((a) => (
              <tr key={a.athleteId} className="border-b border-black/5">
                <td className="py-3">{a.fullName}</td>
                <td className="py-3 text-black/60">{a.sport ?? "—"}</td>
                <td className="py-3 text-black/60">{a.status}</td>
                <td className="py-3 text-right">
                  <Link
                    href={`/deportistas/${a.athleteId}`}
                    className="text-sm underline underline-offset-2"
                  >
                    Ver ficha
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
