import { getCareTeamRoster } from "@/lib/data/athletes";
import { getPlansForCareTeam } from "@/lib/data/plan-actions";
import { getMealSlots, getFoodCategories } from "@/lib/data/reference";
import { PlanBuilder } from "@/components/planes/plan-builder";

const typeLabel: Record<string, string> = { entrenamiento: "Entrenamiento", nutricion: "Nutrición" };

export default async function PlanesPage() {
  const [athletes, plans, mealSlots, categories] = await Promise.all([
    getCareTeamRoster(),
    getPlansForCareTeam(),
    getMealSlots(),
    getFoodCategories(),
  ]);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Planes y prescripciones</h1>

      {athletes.length === 0 ? (
        <p className="mt-4 text-black/60">
          Todavía no tenés deportistas asignados para armarles un plan.
        </p>
      ) : (
        <div className="mt-6">
          <PlanBuilder athletes={athletes} mealSlots={mealSlots} categories={categories} />
        </div>
      )}

      <section className="mt-10">
        <h2 className="mb-3 font-semibold">Planes existentes</h2>
        {plans.length === 0 ? (
          <p className="text-sm text-black/50">Todavía no hay ningún plan cargado.</p>
        ) : (
          <ul className="divide-y divide-black/5">
            {plans.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs uppercase">
                    {typeLabel[p.type] ?? p.type}
                  </span>
                  <span className="ml-2 font-medium">{p.name}</span>
                  <span className="ml-2 text-black/50">— {p.athleteName}</span>
                </div>
                {p.expiresAt && <span className="text-black/50">vence {p.expiresAt}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
