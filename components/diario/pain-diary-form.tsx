"use client";

import { useActionState } from "react";
import { createPainEntry, type DiaryFormState } from "@/lib/data/athlete-actions";

const painZones = [
  { value: "", label: "Sin molestia" },
  { value: "cuello", label: "Cuello" },
  { value: "hombro_izquierdo", label: "Hombro izquierdo" },
  { value: "hombro_derecho", label: "Hombro derecho" },
  { value: "zona_lumbar_cadera", label: "Zona lumbar / cadera" },
  { value: "rodilla_izquierda", label: "Rodilla izquierda" },
  { value: "rodilla_derecha", label: "Rodilla derecha" },
  { value: "tobillo_izquierdo", label: "Tobillo izquierdo" },
  { value: "tobillo_derecho", label: "Tobillo derecho" },
];

const initialState: DiaryFormState = {};

export function PainDiaryForm() {
  const [state, formAction, pending] = useActionState(createPainEntry, initialState);

  return (
    <form action={formAction} className="grid gap-3 rounded-md border border-black/10 p-4">
      <label className="grid gap-1 text-sm">
        <span className="text-black/60">¿Dónde sentís molestia?</span>
        <select name="painZone" className="rounded-md border border-black/15 px-3 py-2">
          {painZones.map((z) => (
            <option key={z.value} value={z.value}>
              {z.label}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        <span className="text-black/60">Severidad (0-10)</span>
        <input name="painSeverity" type="number" min={0} max={10} defaultValue={0} className="rounded-md border border-black/15 px-3 py-2" />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="text-black/60">Energía de hoy</span>
        <select name="energyLevel" className="rounded-md border border-black/15 px-3 py-2" defaultValue="media">
          <option value="alta">Alta</option>
          <option value="media">Media</option>
          <option value="baja">Baja</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        <span className="text-black/60">Notas</span>
        <textarea name="notes" rows={2} className="rounded-md border border-black/15 px-3 py-2" />
      </label>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-green-700">Guardado.</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
