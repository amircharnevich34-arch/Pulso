"use client";

import { useActionState } from "react";
import { createDietDiaryEntry, type DiaryFormState } from "@/lib/data/athlete-actions";

const initialState: DiaryFormState = {};

export function DietDiaryForm() {
  const [state, formAction, pending] = useActionState(createDietDiaryEntry, initialState);

  return (
    <form action={formAction} className="grid gap-3 rounded-md border border-black/10 p-4">
      <label className="grid gap-1 text-sm">
        <span className="text-black/60">¿Cómo te sentiste hoy con la dieta?</span>
        <textarea
          name="notes"
          rows={2}
          placeholder="Hambre, antojos, energía…"
          className="rounded-md border border-black/15 px-3 py-2"
        />
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
