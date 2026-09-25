"use client";

import { useState } from "react";
import type { RosterAthlete } from "@/lib/data/athletes";
import type { MealSlot, FoodCategory } from "@/lib/data/reference";
import { TrainingPlanForm } from "./training-plan-form";
import { NutritionPlanForm } from "./nutrition-plan-form";

export function PlanBuilder({
  athletes,
  mealSlots,
  categories,
}: {
  athletes: RosterAthlete[];
  mealSlots: MealSlot[];
  categories: FoodCategory[];
}) {
  const [athleteId, setAthleteId] = useState("");
  const [type, setType] = useState<"entrenamiento" | "nutricion">("entrenamiento");

  return (
    <div className="rounded-md border border-black/10 p-5">
      <div className="flex flex-wrap items-end gap-4">
        <label className="grid gap-1 text-sm">
          <span className="text-black/60">Deportista</span>
          <select
            value={athleteId}
            onChange={(e) => setAthleteId(e.target.value)}
            className="rounded-md border border-black/15 px-3 py-2"
          >
            <option value="">Seleccioná un deportista</option>
            {athletes.map((a) => (
              <option key={a.athleteId} value={a.athleteId}>
                {a.fullName}
              </option>
            ))}
          </select>
        </label>

        <div className="flex gap-2">
          {(
            [
              { value: "entrenamiento", label: "Entrenamiento" },
              { value: "nutricion", label: "Nutrición" },
            ] as const
          ).map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              className={`rounded-md border px-3 py-2 text-sm font-medium ${
                type === t.value ? "border-black bg-black text-white" : "border-black/15"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {!athleteId ? (
        <p className="mt-4 text-sm text-black/50">Elegí un deportista para armar su plan.</p>
      ) : (
        <div className="mt-5">
          {type === "entrenamiento" ? (
            <TrainingPlanForm key={athleteId} athleteId={athleteId} />
          ) : (
            <NutritionPlanForm
              key={athleteId}
              athleteId={athleteId}
              mealSlots={mealSlots}
              categories={categories}
            />
          )}
        </div>
      )}
    </div>
  );
}
