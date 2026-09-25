"use client";

import { useState } from "react";
import type { RosterAthlete } from "@/lib/data/athletes";
import type { RoutineCategory } from "@/lib/data/routine-categories";
import { TrainingPlanForm } from "./training-plan-form";

export function PlanBuilder({
  athletes,
  categories,
}: {
  athletes: RosterAthlete[];
  categories: RoutineCategory[];
}) {
  const [athleteId, setAthleteId] = useState("");

  return (
    <div className="rounded-md border border-black/10 p-5">
      <label className="grid gap-1 text-sm">
        <span className="text-black/60">Deportista</span>
        <select
          value={athleteId}
          onChange={(e) => setAthleteId(e.target.value)}
          className="w-fit rounded-md border border-black/15 px-3 py-2"
        >
          <option value="">Seleccioná un deportista</option>
          {athletes.map((a) => (
            <option key={a.athleteId} value={a.athleteId}>
              {a.fullName}
            </option>
          ))}
        </select>
      </label>

      {!athleteId ? (
        <p className="mt-4 text-sm text-black/50">Elegí un deportista para armar su plan.</p>
      ) : (
        <div className="mt-5">
          <TrainingPlanForm key={athleteId} athleteId={athleteId} categories={categories} />
        </div>
      )}
    </div>
  );
}
