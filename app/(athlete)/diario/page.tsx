import { createClient } from "@/lib/supabase/server";
import { getMyAthleteProfileId } from "@/lib/data/athletes";
import { getPainDiary } from "@/lib/data/diary";
import { PainDiaryForm } from "@/components/diario/pain-diary-form";

const painZoneLabel: Record<string, string> = {
  cuello: "Cuello",
  hombro_izquierdo: "Hombro izquierdo",
  hombro_derecho: "Hombro derecho",
  zona_lumbar_cadera: "Zona lumbar / cadera",
  rodilla_izquierda: "Rodilla izquierda",
  rodilla_derecha: "Rodilla derecha",
  tobillo_izquierdo: "Tobillo izquierdo",
  tobillo_derecho: "Tobillo derecho",
};

const energyLabel: Record<string, string> = { alta: "Alta", media: "Media", baja: "Baja" };

export default async function DiarioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const athleteId = await getMyAthleteProfileId(user!.id);

  if (!athleteId) {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-semibold">Mi diario</h1>
        <p className="mt-2 text-black/60">
          Tu cuenta todavía no está conectada con tu ficha de deportista.
        </p>
      </main>
    );
  }

  const painEntries = await getPainDiary(athleteId);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Mi diario</h1>

      <section className="mt-6">
        <h2 className="mb-2 font-semibold">¿Cómo sientes tu cuerpo hoy?</h2>
        <PainDiaryForm />
        <ul className="mt-4 divide-y divide-black/5">
          {painEntries.length === 0 && (
            <p className="text-sm text-black/50">Sin entradas todavía.</p>
          )}
          {painEntries.map((e) => (
            <li key={e.id} className="py-3 text-sm">
              <div className="flex items-center gap-2 text-black/50">
                <span>{e.entryDate}</span>
                {e.energyLevel && <span>· Energía {energyLabel[e.energyLevel] ?? e.energyLevel}</span>}
                {e.painZone && (
                  <span>
                    · {painZoneLabel[e.painZone] ?? e.painZone} ({e.painSeverity}/10)
                  </span>
                )}
              </div>
              {e.notes && <p className="mt-1">{e.notes}</p>}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
