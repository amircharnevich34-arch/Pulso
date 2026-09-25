import { notFound } from "next/navigation";
import { getAthleteDetail } from "@/lib/data/athletes";
import { getChatMessages, getChatParticipants } from "@/lib/data/chat";
import { getAthleteGameLog } from "@/lib/data/games";
import { ChatPanel } from "@/components/chat/chat-panel";
import { ClaimForm } from "@/components/roster/claim-form";
import { createClient } from "@/lib/supabase/server";

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-black/40">{label}</div>
      <div className="font-medium">{value ?? "—"}</div>
    </div>
  );
}

export default async function FichaPage({
  params,
}: {
  params: Promise<{ athleteId: string }>;
}) {
  const { athleteId } = await params;
  const athlete = await getAthleteDetail(athleteId);

  if (!athlete) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: currentProfile } = await supabase
    .from("users")
    .select("full_name, role")
    .eq("id", user!.id)
    .single();

  const [teamMessages, athleteMessages, participants, gameLog] = await Promise.all([
    getChatMessages(athleteId, "equipo"),
    getChatMessages(athleteId, "atleta"),
    getChatParticipants(athleteId),
    getAthleteGameLog(athleteId),
  ]);

  return (
    <main className="p-8">
      <p className="text-sm text-black/50">Ficha de deportista</p>
      <h1 className="text-2xl font-semibold">{athlete.fullName}</h1>
      <p className="mt-1 text-black/60">{athlete.sport ?? "Sin deporte registrado"}</p>

      {!athlete.claimed && (
        <div className="mt-4">
          <ClaimForm athleteId={athleteId} />
        </div>
      )}

      <section className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
        <div>
          <h2 className="mb-3 font-semibold">Médico</h2>
          {athlete.medical ? (
            <div className="grid gap-3">
              <Field label="Frecuencia cardiaca en reposo" value={athlete.medical.restingHr} />
              <Field label="Presión arterial" value={athlete.medical.bloodPressure} />
              <Field label="Lesión activa" value={athlete.medical.activeInjuryText} />
              <Field label="Próxima revisión" value={athlete.medical.nextCheckupDate} />
              {athlete.medical.painZone && (
                <Field
                  label="Zona de molestia"
                  value={`${athlete.medical.painZone} · ${athlete.medical.painSeverity}/10`}
                />
              )}
            </div>
          ) : (
            <p className="text-sm text-black/50">Sin datos médicos todavía.</p>
          )}
        </div>

        <div>
          <h2 className="mb-3 font-semibold">Entrenamiento</h2>
          {athlete.training ? (
            <div className="grid gap-3">
              <Field label="VO2 máx" value={athlete.training.vo2max} />
              <Field label="Fuerza máxima" value={athlete.training.maxStrength} />
              <Field label="Velocidad" value={athlete.training.speedTestResult} />
              <Field label="Próxima sesión" value={athlete.training.nextSessionAt} />
            </div>
          ) : (
            <p className="text-sm text-black/50">Sin datos de entrenamiento todavía.</p>
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 font-semibold">Rendimiento en juegos</h2>
        {gameLog.length === 0 ? (
          <p className="text-sm text-black/50">Todavía no jugó ningún partido registrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border border-black/10 bg-black/[.02] p-2 text-left">Partido</th>
                  <th className="border border-black/10 bg-black/[.02] p-2">Min</th>
                  <th className="border border-black/10 bg-black/[.02] p-2">Pts</th>
                  <th className="border border-black/10 bg-black/[.02] p-2">Reb</th>
                  <th className="border border-black/10 bg-black/[.02] p-2">Ast</th>
                  <th className="border border-black/10 bg-black/[.02] p-2">Rob</th>
                  <th className="border border-black/10 bg-black/[.02] p-2">Blq</th>
                </tr>
              </thead>
              <tbody>
                {gameLog.map((g) => (
                  <tr key={g.gameId}>
                    <td className="border border-black/10 p-2">
                      {g.playedAt} {g.opponent ? `vs ${g.opponent}` : ""}
                    </td>
                    <td className="border border-black/10 p-2 text-center tabular-nums">{g.minutesPlayed ?? "—"}</td>
                    <td className="border border-black/10 p-2 text-center tabular-nums">{g.points ?? "—"}</td>
                    <td className="border border-black/10 p-2 text-center tabular-nums">{g.rebounds ?? "—"}</td>
                    <td className="border border-black/10 p-2 text-center tabular-nums">{g.assists ?? "—"}</td>
                    <td className="border border-black/10 p-2 text-center tabular-nums">{g.steals ?? "—"}</td>
                    <td className="border border-black/10 p-2 text-center tabular-nums">{g.blocks ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-3 font-semibold">Historial de evaluaciones</h2>
        {athlete.evaluations.length === 0 ? (
          <p className="text-sm text-black/50">Sin evaluaciones registradas.</p>
        ) : (
          <ul className="divide-y divide-black/5">
            {athlete.evaluations.map((e) => (
              <li key={e.id} className="py-3">
                <div className="flex items-center gap-3 text-sm">
                  <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs uppercase">
                    {e.type}
                  </span>
                  <span className="text-black/50">{e.occurredAt}</span>
                </div>
                <p className="mt-1">{e.notes}</p>
                <p className="text-sm text-black/50">{e.author}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-3 font-semibold">Preguntas del deportista</h2>
        <p className="mb-3 text-sm text-black/50">
          Lo que {athlete.fullName.split(" ")[0]} pregunta o comenta — cualquiera de su equipo le puede responder.
        </p>
        <ChatPanel
          athleteId={athleteId}
          channel="atleta"
          initialMessages={athleteMessages}
          participants={participants}
          currentUserId={user!.id}
          currentUserName={currentProfile?.full_name ?? "—"}
          currentUserRole={currentProfile?.role ?? "medico"}
          placeholder="Responder al deportista…"
          emptyLabel="Todavía no hizo preguntas."
        />
      </section>

      <section className="mt-10">
        <h2 className="mb-3 font-semibold">Chat del equipo</h2>
        <p className="mb-3 text-sm text-black/50">Solo visible para los expertos asignados.</p>
        <ChatPanel
          athleteId={athleteId}
          channel="equipo"
          initialMessages={teamMessages}
          participants={participants}
          currentUserId={user!.id}
          currentUserName={currentProfile?.full_name ?? "—"}
          currentUserRole={currentProfile?.role ?? "medico"}
          placeholder="Escribe un mensaje para el equipo…"
          emptyLabel="Sin mensajes todavía. Empiecen la conversación."
        />
      </section>
    </main>
  );
}
