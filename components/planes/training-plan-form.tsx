"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTrainingPlan } from "@/lib/data/plan-actions";

export function TrainingPlanForm({ athleteId }: { athleteId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [items, setItems] = useState<string[]>([""]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateItem(i: number, value: string) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? value : it)));
  }
  function addItem() {
    setItems((prev) => [...prev, ""]);
  }
  function removeItem(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
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
      await createTrainingPlan({
        athleteId,
        name: name.trim(),
        expiresAt: expiresAt || null,
        items,
      });
      setName("");
      setExpiresAt("");
      setItems([""]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el plan.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <label className="grid gap-1 text-sm">
        <span className="text-black/60">Nombre del plan</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Fuerza tren inferior — bloque 3"
          className="rounded-md border border-black/15 px-3 py-2"
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="text-black/60">Vence (opcional)</span>
        <input
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          className="w-fit rounded-md border border-black/15 px-3 py-2"
        />
      </label>

      <div>
        <span className="text-sm text-black/60">Ejercicios</span>
        <div className="mt-1 grid gap-2">
          {items.map((it, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={it}
                onChange={(e) => updateItem(i, e.target.value)}
                placeholder="Ej. Sentadilla 4×6 @ 80%"
                className="flex-1 rounded-md border border-black/15 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => removeItem(i)}
                disabled={items.length === 1}
                className="rounded-md border border-black/15 px-3 text-sm disabled:opacity-30"
              >
                Quitar
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addItem}
          className="mt-2 text-sm underline underline-offset-2"
        >
          + Agregar ejercicio
        </button>
      </div>

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
