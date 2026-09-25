"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createNutritionPlan } from "@/lib/data/plan-actions";
import type { MealSlot, FoodCategory } from "@/lib/data/reference";

export function NutritionPlanForm({
  athleteId,
  mealSlots,
  categories,
}: {
  athleteId: string;
  mealSlots: MealSlot[];
  categories: FoodCategory[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [waterTargetL, setWaterTargetL] = useState("");
  const [grid, setGrid] = useState<Record<string, number>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function cellKey(mealId: string, catId: string) {
    return `${mealId}:${catId}`;
  }

  function setCell(mealId: string, catId: string, value: string) {
    const n = value === "" ? 0 : Math.max(0, Number(value));
    setGrid((prev) => ({ ...prev, [cellKey(mealId, catId)]: n }));
  }

  function rowTotal(catId: string) {
    return mealSlots.reduce((sum, m) => sum + (grid[cellKey(m.id, catId)] ?? 0), 0);
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
      const targets = mealSlots.flatMap((m) =>
        categories.map((c) => ({
          mealSlotId: m.id,
          categoryId: c.id,
          portions: grid[cellKey(m.id, c.id)] ?? 0,
        }))
      );
      await createNutritionPlan({
        athleteId,
        name: name.trim(),
        expiresAt: expiresAt || null,
        waterTargetMl: waterTargetL ? Math.round(Number(waterTargetL) * 1000) : null,
        targets,
      });
      setName("");
      setExpiresAt("");
      setWaterTargetL("");
      setGrid({});
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
            placeholder="Ej. Plan de mantenimiento"
            className="rounded-md border border-black/15 px-3 py-2"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-black/60">Meta de agua (litros/día)</span>
          <input
            type="number"
            step="0.1"
            value={waterTargetL}
            onChange={(e) => setWaterTargetL(e.target.value)}
            placeholder="3"
            className="w-28 rounded-md border border-black/15 px-3 py-2"
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

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border border-black/10 bg-black/[.02] p-2 text-left">Raciones</th>
              <th className="border border-black/10 bg-black/[.02] p-2">Total</th>
              {mealSlots.map((m) => (
                <th key={m.id} className="border border-black/10 bg-black/[.02] p-2 font-medium">
                  {m.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id}>
                <td className="border border-black/10 p-2 font-medium">{c.label}</td>
                <td className="border border-black/10 p-2 text-center tabular-nums text-black/50">
                  {rowTotal(c.id) || "—"}
                </td>
                {mealSlots.map((m) => (
                  <td key={m.id} className="border border-black/10 p-1">
                    <input
                      type="number"
                      min={0}
                      value={grid[cellKey(m.id, c.id)] ?? ""}
                      onChange={(e) => setCell(m.id, c.id, e.target.value)}
                      className="w-14 rounded-md border border-transparent px-2 py-1 text-center hover:border-black/15 focus:border-black/30"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
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
