"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAthleteProfilesBulk } from "@/lib/data/roster-actions";

export function AddAthletesForm() {
  const router = useRouter();
  const [namesText, setNamesText] = useState("");
  const [sport, setSport] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const names = namesText
    .split("\n")
    .map((n) => n.trim())
    .filter(Boolean);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (names.length === 0) {
      setError("Escribí al menos un nombre.");
      return;
    }
    setPending(true);
    try {
      const { count } = await createAthleteProfilesBulk({ names, sport: sport.trim() || null });
      setSuccess(`Se agregaron ${count} deportista${count === 1 ? "" : "s"}.`);
      setNamesText("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 rounded-md border border-black/10 p-4">
      <label className="grid gap-1 text-sm">
        <span className="text-black/60">Nombres (uno por línea)</span>
        <textarea
          value={namesText}
          onChange={(e) => setNamesText(e.target.value)}
          rows={5}
          placeholder={"Juan Pérez\nMaría López\n…"}
          className="rounded-md border border-black/15 px-3 py-2 font-mono text-sm"
        />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="text-black/60">Deporte (se aplica a todos)</span>
        <input
          value={sport}
          onChange={(e) => setSport(e.target.value)}
          placeholder="Baloncesto"
          className="w-fit rounded-md border border-black/15 px-3 py-2"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-700">{success}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Guardando…" : `Agregar ${names.length || ""} deportista${names.length === 1 ? "" : "s"}`}
      </button>
    </form>
  );
}
