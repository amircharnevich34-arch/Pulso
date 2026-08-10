import { createClient } from "@/lib/supabase/server";
import { getPainDiary } from "@/lib/data/diary";
import { PainDiaryForm } from "@/components/dieta/pain-diary-form";
import { DietDiaryForm } from "@/components/dieta/diet-diary-form";

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

  const { data: dietEntries } = await supabase
    .from("diary_diet_entries")
    .select("id, entry_date, notes")
    .eq("athlete_id", user!.id)
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false });

  const painEntries = await getPainDiary(user!.id);

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

      <section className="mt-10">
        <h2 className="mb-2 font-semibold">Diario de tu dieta</h2>
        <p className="mb-2 text-sm text-black/50">
          Cuéntale a tu nutriólogo cómo te sentiste — lo va a leer antes de tu próxima cita.
        </p>
        <DietDiaryForm />
        <ul className="mt-4 divide-y divide-black/5">
          {(!dietEntries || dietEntries.length === 0) && (
            <p className="text-sm text-black/50">Sin entradas todavía.</p>
          )}
          {(dietEntries ?? []).map((e) => (
            <li key={e.id} className="py-3 text-sm">
              <div className="text-black/50">{e.entry_date}</div>
              <p className="mt-1">{e.notes}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
