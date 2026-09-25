"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTrainingPlan } from "@/lib/data/plan-actions";
import type { RoutineCategory } from "@/lib/data/routine-categories";

export function TrainingPlanForm({
  athleteId,
  categories,
}: {
  athleteId: string;
  categories: RoutineCategory[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [itemsByCategory, setItemsByCategory] = useState<Record<string, string[]>>(
    Object.fromEntries(categories.map((c) => [c.id, [""]]))
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateItem(catId: string, i: number, value: string) {
    setItemsByCategory((prev) => ({
      ...prev,
      [catId]: prev[catId].map((it, idx) => (idx === i ? value : it)),
    }));
  }
  function addItem(catId: string) {
    setItemsByCategory((prev) => ({ ...prev, [catId]: [...prev[catId], ""] }));
  }
  function removeItem(catId: string, i: number) {
    setItemsByCategory((prev) => ({
      ...prev,
      [catId]: prev[catId].filter((_, idx) => idx !== i),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Ponele un nombre al plan.");
      return;
    }
    setPending(true);
    try {
      const items = categories.flatMap((c) =>
        (itemsByCategory[c.id] ?? []).map((description) => ({ categoryId: c.id, description }))
      );
      await createTrainingPlan({
        athleteId,
        name: name.trim(),
        expiresAt: expiresAt || null,
        items,
      });
      setName("");
      setExpiresAt("");
      setItemsByCategory(Object.fromEntries(categories.map((c) => [c.id, [""]])));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el plan.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="flex flex-wrap gap-4">
        <label className="grid gap-1 text-sm">
          <span className="text-black/60">Nombre del plan</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Bloque de pretemporada"
            className="rounded-md border border-black/15 px-3 py-2"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-black/60">Vence (opcional)</span>
          <input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="rounded-md border border-black/15 px-3 py-2"
          />
        </label>
      </div>

      {categories.map((cat) => (
        <div key={cat.id} className="rounded-md border border-black/10 p-4">
          <span className="text-sm font-semibold">{cat.label}</span>
          <div className="mt-2 grid gap-2">
            {(itemsByCategory[cat.id] ?? []).map((it, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={it}
                  onChange={(e) => updateItem(cat.id, i, e.target.value)}
                  placeholder="Ej. Sentadilla 4×6 @ 80%"
                  className="flex-1 rounded-md border border-black/15 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeItem(cat.id, i)}
                  disabled={(itemsByCategory[cat.id] ?? []).length === 1}
                  className="rounded-md border border-black/15 px-3 text-sm disabled:opacity-30"
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => addItem(cat.id)}
            className="mt-2 text-sm underline underline-offset-2"
          >
            + Agregar ejercicio
          </button>
        </div>
      ))}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Guardar plan"}
      </button>
    </form>
  );
}
