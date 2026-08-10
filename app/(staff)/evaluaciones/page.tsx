import { getCareTeamRoster } from "@/lib/data/athletes";
import { EvaluationForm } from "@/components/ficha/evaluation-form";

export default async function EvaluacionesPage() {
  const athletes = await getCareTeamRoster();

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Registro de evaluaciones</h1>
      {athletes.length === 0 ? (
        <p className="mt-4 text-black/60">
          Todavía no tenés deportistas asignados para registrar una evaluación.
        </p>
      ) : (
        <EvaluationForm athletes={athletes} />
      )}
    </main>
  );
}
