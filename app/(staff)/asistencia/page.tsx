import Link from "next/link";
import { getPractices } from "@/lib/data/attendance";
import { todayInMexicoCity } from "@/lib/date";

const weekdayLabel: Record<number, string> = {
  1: "Lunes",
  3: "Miércoles",
  6: "Sábado",
};

function formatTime(t: string) {
  return t.slice(0, 5);
}

export default async function AsistenciaPage() {
  const practices = await getPractices();
  const today = todayInMexicoCity();

  if (practices.length === 0) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-semibold">Asistencia</h1>
        <p className="mt-4 text-black/60">Todavía no hay prácticas programadas.</p>
      </main>
    );
  }

  const upcoming = practices.filter((p) => p.practiceDate >= today);
  const past = practices.filter((p) => p.practiceDate < today).reverse();

  function PracticeRow({ p }: { p: (typeof practices)[number] }) {
    const dow = new Date(`${p.practiceDate}T00:00:00`).getDay();
    return (
      <li key={p.id} className="flex items-center justify-between py-3 text-sm">
        <div>
          <span className="font-medium">{weekdayLabel[dow] ?? ""} {p.practiceDate}</span>
          <span className="ml-2 text-black/50">
            {formatTime(p.startTime)}–{formatTime(p.endTime)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="tabular-nums text-black/60">
            {p.presentCount}/{p.rosterSize} presentes
          </span>
          <Link href={`/asistencia/${p.id}`} className="underline underline-offset-2">
            Marcar asistencia
          </Link>
        </div>
      </li>
    );
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Asistencia</h1>
      <p className="mt-1 text-black/60">
        Lunes 19:00–21:00 · Miércoles 07:00–09:00 · Sábado 08:00–10:00
      </p>

      <section className="mt-8">
        <h2 className="mb-3 font-semibold">Próximas</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-black/50">Sin prácticas próximas.</p>
        ) : (
          <ul className="divide-y divide-black/5">
            {upcoming.map((p) => (
              <PracticeRow key={p.id} p={p} />
            ))}
          </ul>
        )}
      </section>

      {past.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 font-semibold">Pasadas</h2>
          <ul className="divide-y divide-black/5">
            {past.map((p) => (
              <PracticeRow key={p.id} p={p} />
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
