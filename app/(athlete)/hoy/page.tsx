import { createClient } from "@/lib/supabase/server";
import { getChatMessages, getChatParticipants } from "@/lib/data/chat";
import { getActiveTrainingPlan, getActiveNutritionPlan } from "@/lib/data/plans";
import { getFoodBankByCategory } from "@/lib/data/foodbank";
import { getTodayCompletions } from "@/lib/data/routine";
import { getTodayDietLogs, getTodayWaterMl } from "@/lib/data/diet";
import { todayInMexicoCity } from "@/lib/date";
import { ChatPanel } from "@/components/chat/chat-panel";
import { RoutineChecklist } from "@/components/dieta/routine-checklist";
import { WaterTracker } from "@/components/dieta/water-tracker";
import { DietChecklist, type DietMealGroup } from "@/components/dieta/diet-checklist";

export default async function HoyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const athleteId = user!.id;
  const logDate = todayInMexicoCity();

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, role")
    .eq("id", athleteId)
    .single();

  const [trainingPlan, nutritionPlan, foodBank, messages, participants] = await Promise.all([
    getActiveTrainingPlan(athleteId),
    getActiveNutritionPlan(athleteId),
    getFoodBankByCategory(),
    getChatMessages(athleteId, "atleta"),
    getChatParticipants(athleteId),
  ]);

  const [completedIds, dietLogs, waterMl] = await Promise.all([
    getTodayCompletions((trainingPlan?.items ?? []).map((i) => i.id), logDate),
    getTodayDietLogs(athleteId, logDate),
    getTodayWaterMl(athleteId, logDate),
  ]);

  const mealGroups: DietMealGroup[] = [];
  if (nutritionPlan) {
    const byMeal = new Map<string, DietMealGroup>();
    for (const t of nutritionPlan.targets) {
      if (!byMeal.has(t.mealSlotId)) {
        byMeal.set(t.mealSlotId, { mealSlotId: t.mealSlotId, mealLabel: t.mealLabel, categories: [] });
      }
      byMeal.get(t.mealSlotId)!.categories.push({
        categoryId: t.categoryId,
        categoryLabel: t.categoryLabel,
        targetPortions: t.targetPortions,
        items: foodBank.get(t.categoryId) ?? [],
      });
    }
    mealGroups.push(...byMeal.values());
  }

  const initialCounts: Record<string, number> = {};
  dietLogs.forEach((count, key) => {
    initialCounts[key] = count;
  });

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
        <h2 className="mb-2 font-semibold">Agua de hoy</h2>
        <WaterTracker
          athleteId={athleteId}
          logDate={logDate}
          initialMl={waterMl}
          targetMl={nutritionPlan?.waterTargetMl ?? null}
        />
      </section>

      <section className="mt-8">
        <h2 className="mb-2 font-semibold">Tu dieta de hoy</h2>
        <DietChecklist
          athleteId={athleteId}
          logDate={logDate}
          meals={mealGroups}
          initialCounts={initialCounts}
        />
      </section>

      <section className="mt-8">
        <h2 className="mb-1 font-semibold">Preguntas para tu equipo</h2>
        <p className="mb-3 text-sm text-black/50">
          Escribile a tu médico, entrenador o nutriólogo — cualquiera de ellos te puede responder acá.
        </p>
        <ChatPanel
          athleteId={athleteId}
          channel="atleta"
          initialMessages={messages}
          participants={participants}
          currentUserId={athleteId}
          currentUserName={profile?.full_name ?? "—"}
          currentUserRole={profile?.role ?? "deportista"}
          placeholder="Escribile a tu equipo…"
          emptyLabel="Todavía no escribiste nada. Animate a preguntar algo."
        />
      </section>
    </main>
  );
}
