import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDashboardSummary } from "@/lib/data/dashboard";

function StatTile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border border-black/10 p-4">
      <div className="text-xs uppercase tracking-wide text-black/40">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, role")
    .eq("id", user!.id)
    .single();

  const summary = await getDashboardSummary();

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Panel principal</h1>
      <p className="mt-1 text-black/60">
        Hola, {profile?.full_name?.split(" ")[0] ?? "—"} — así está tu equipo hoy.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Jugadores" value={summary.totalAthletes} />
        <StatTile label="Sin rutina" value={summary.withoutPlan} />
        <StatTile label="Alertas médicas" value={summary.medicalAlerts.length} />
        <StatTile label="Partidos registrados" value={summary.gamesLogged} />
      </div>

      {summary.totalAthletes === 0 ? (
        <p className="mt-8 text-black/60">
          Todavía no tenés jugadores cargados —{" "}
          <Link href="/deportistas" className="underline underline-offset-2">
            agregalos acá
          </Link>
          .
        </p>
      ) : (
        <>
          <section className="mt-10">
            <h2 className="mb-3 font-semibold">Necesitan atención</h2>
            {summary.medicalAlerts.length === 0 && summary.noPlanAthletes.length === 0 ? (
              <p className="text-sm text-black/50">Nada pendiente por ahora.</p>
            ) : (
              <ul className="divide-y divide-black/5">
                {summary.medicalAlerts.map((a) => (
                  <li key={`med-${a.athleteId}`} className="flex items-center justify-between py-2 text-sm">
                    <Link href={`/deportistas/${a.athleteId}`} className="font-medium underline underline-offset-2">
                      {a.athleteName}
                    </Link>
                    <span className="text-black/60">Médico · {a.reason}</span>
                  </li>
                ))}
                {summary.noPlanAthletes.map((a) => (
                  <li key={`plan-${a.athleteId}`} className="flex items-center justify-between py-2 text-sm">
                    <Link href={`/deportistas/${a.athleteId}`} className="font-medium underline underline-offset-2">
                      {a.athleteName}
                    </Link>
                    <span className="text-black/60">{a.reason}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-10">
            <h2 className="mb-3 font-semibold">Último partido</h2>
            {summary.lastGame ? (
              <p className="text-sm">
                {summary.lastGame.playedAt}
                {summary.lastGame.opponent ? ` vs ${summary.lastGame.opponent}` : ""} —{" "}
                <Link href="/juegos" className="underline underline-offset-2">
                  ver partidos
                </Link>
              </p>
            ) : (
              <p className="text-sm text-black/50">
                Todavía no cargaste ningún partido —{" "}
                <Link href="/juegos" className="underline underline-offset-2">
                  registrá el primero
                </Link>
                .
              </p>
            )}
          </section>

          <section className="mt-10">
            <h2 className="mb-3 font-semibold">Evaluaciones recientes</h2>
            {summary.recentEvaluations.length === 0 ? (
              <p className="text-sm text-black/50">Sin evaluaciones registradas todavía.</p>
            ) : (
              <ul className="divide-y divide-black/5">
                {summary.recentEvaluations.map((e) => (
                  <li key={e.id} className="py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs uppercase">{e.type}</span>
                      <span className="font-medium">{e.athleteName}</span>
                      <span className="text-black/50">{e.occurredAt}</span>
                    </div>
                    {e.notes && <p className="mt-1 text-black/70">{e.notes}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}
