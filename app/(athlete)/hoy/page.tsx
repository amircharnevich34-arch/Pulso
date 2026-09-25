import { createClient } from "@/lib/supabase/server";
import { getMyAthleteProfileId } from "@/lib/data/athletes";
import { getChatMessages, getChatParticipants } from "@/lib/data/chat";
import { getActiveTrainingPlan } from "@/lib/data/plans";
import { getTodayCompletions } from "@/lib/data/routine";
import { todayInMexicoCity } from "@/lib/date";
import { ChatPanel } from "@/components/chat/chat-panel";
import { RoutineChecklist } from "@/components/rutina/routine-checklist";

export default async function HoyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;
  const logDate = todayInMexicoCity();

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, role")
    .eq("id", userId)
    .single();

  const athleteId = await getMyAthleteProfileId(userId);

  if (!athleteId) {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-semibold">Hoy</h1>
        <p className="mt-2 text-black/60">
          Hola, {profile?.full_name?.split(" ")[0] ?? "—"} — tu cuenta todavía no está
          conectada con tu ficha de deportista. Pedile a tu equipo que la vincule.
        </p>
      </main>
    );
  }

  const [trainingPlan, messages, participants] = await Promise.all([
    getActiveTrainingPlan(athleteId),
    getChatMessages(athleteId, "atleta"),
    getChatParticipants(athleteId),
  ]);

  const completedIds = await getTodayCompletions(
    trainingPlan?.items.map((i) => i.id) ?? [],
    logDate
  );

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Hoy</h1>
      <p className="mt-2 text-black/60">
        Hola, {profile?.full_name?.split(" ")[0] ?? "—"} — esto es lo que te toca hoy.
      </p>

      <section className="mt-8">
        <h2 className="mb-2 font-semibold">Tu rutina de hoy</h2>
        {trainingPlan && trainingPlan.items.length > 0 ? (
          <RoutineChecklist
            logDate={logDate}
            items={trainingPlan.items}
            initialCompleted={[...completedIds]}
          />
        ) : (
          <p className="text-sm text-black/50">Todavía no tenés una rutina asignada.</p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-1 font-semibold">Preguntas para tu equipo</h2>
        <p className="mb-3 text-sm text-black/50">
          Escribile a tu médico o entrenador — cualquiera de ellos te puede responder acá.
        </p>
        <ChatPanel
          athleteId={athleteId}
          channel="atleta"
          initialMessages={messages}
          participants={participants}
          currentUserId={userId}
          currentUserName={profile?.full_name ?? "—"}
          currentUserRole={profile?.role ?? "deportista"}
          placeholder="Escribile a tu equipo…"
          emptyLabel="Todavía no escribiste nada. Animate a preguntar algo."
        />
      </section>
    </main>
  );
}
