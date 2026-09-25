"use client";

import { useActionState, useState } from "react";
import { createEvaluation, type EvaluationFormState } from "@/lib/data/evaluations";
import type { RosterAthlete } from "@/lib/data/athletes";

const painZones = [
  { value: "cuello", label: "Cuello" },
  { value: "hombro_izquierdo", label: "Hombro izquierdo" },
  { value: "hombro_derecho", label: "Hombro derecho" },
  { value: "zona_lumbar_cadera", label: "Zona lumbar / cadera" },
  { value: "rodilla_izquierda", label: "Rodilla izquierda" },
  { value: "rodilla_derecha", label: "Rodilla derecha" },
  { value: "tobillo_izquierdo", label: "Tobillo izquierdo" },
  { value: "tobillo_derecho", label: "Tobillo derecho" },
];

const initialState: EvaluationFormState = {};

export function EvaluationForm({ athletes }: { athletes: RosterAthlete[] }) {
  const [state, formAction, pending] = useActionState(createEvaluation, initialState);
  const [type, setType] = useState<"medica" | "entrenamiento">("medica");

  return (
    <form action={formAction} className="mt-6 grid max-w-xl gap-4">
      <label className="grid gap-1 text-sm">
        <span className="text-black/60">Deportista</span>
        <select name="athleteId" required className="rounded-md border border-black/15 px-3 py-2">
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
            { value: "medica", label: "Médica" },
            { value: "entrenamiento", label: "Entrenamiento" },
          ] as const
        ).map((t) => (
          <button
            type="button"
            key={t.value}
            onClick={() => setType(t.value)}
            className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium ${
              type === t.value ? "border-black bg-black text-white" : "border-black/15"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <input type="hidden" name="type" value={type} />

      {type === "medica" && (
        <fieldset className="grid gap-3 rounded-md border border-black/10 p-4">
          <label className="grid gap-1 text-sm">
            <span className="text-black/60">Frecuencia cardiaca en reposo (bpm)</span>
            <input name="restingHr" type="number" className="rounded-md border border-black/15 px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-black/60">Presión arterial</span>
            <input name="bloodPressure" type="text" placeholder="112/70" className="rounded-md border border-black/15 px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-black/60">Zona de dolor (si aplica)</span>
            <select name="painZone" className="rounded-md border border-black/15 px-3 py-2">
              <option value="">Ninguna</option>
              {painZones.map((z) => (
                <option key={z.value} value={z.value}>
                  {z.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-black/60">Severidad (0-10)</span>
            <input name="painSeverity" type="number" min={0} max={10} className="rounded-md border border-black/15 px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-black/60">Próxima revisión</span>
            <input name="nextCheckupDate" type="date" className="rounded-md border border-black/15 px-3 py-2" />
          </label>
        </fieldset>
      )}

      {type === "entrenamiento" && (
        <fieldset className="grid gap-3 rounded-md border border-black/10 p-4">
          <label className="grid gap-1 text-sm">
            <span className="text-black/60">Prueba realizada</span>
            <input
              name="testRealizado"
              type="text"
              placeholder="Ej. Tiro de media distancia, triples, rebotes…"
              className="rounded-md border border-black/15 px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-black/60">Resultado</span>
            <input name="resultado" type="text" className="rounded-md border border-black/15 px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-black/60">Percepción de esfuerzo (RPE 1-10)</span>
            <input name="rpe" type="number" min={1} max={10} className="rounded-md border border-black/15 px-3 py-2" />
          </label>
        </fieldset>
      )}

      <label className="grid gap-1 text-sm">
        <span className="text-black/60">Notas</span>
        <textarea name="notes" rows={3} className="rounded-md border border-black/15 px-3 py-2" />
      </label>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-green-700">Evaluación guardada.</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Guardar evaluación"}
      </button>
    </form>
  );
}
