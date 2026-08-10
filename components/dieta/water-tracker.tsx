"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

export function WaterTracker({
  athleteId,
  logDate,
  initialMl,
  targetMl,
}: {
  athleteId: string;
  logDate: string;
  initialMl: number;
  targetMl: number | null;
}) {
  const [ml, setMl] = useState(initialMl);
  const [pending, startTransition] = useTransition();

  function adjust(delta: number) {
    const next = Math.max(0, ml + delta);
    setMl(next);
    startTransition(async () => {
      const supabase = createClient();
      await supabase
        .from("water_logs")
        .upsert(
          { athlete_id: athleteId, log_date: logDate, total_ml: next },
          { onConflict: "athlete_id,log_date" }
        );
    });
  }

  const liters = (ml / 1000).toFixed(2).replace(".", ",");
  const pct = targetMl ? Math.min(100, (ml / targetMl) * 100) : 0;

  return (
    <div className="rounded-md border border-black/10 p-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xl font-semibold">{liters} L</span>
          {targetMl != null && (
            <span className="ml-2 text-sm text-black/50">
              de {(targetMl / 1000).toFixed(1).replace(".", ",")} L
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => adjust(-250)}
            disabled={pending}
            className="rounded-full border border-black/15 px-3 py-1 text-sm"
          >
            – 250 ml
          </button>
          <button
            type="button"
            onClick={() => adjust(250)}
            disabled={pending}
            className="rounded-full border border-black/15 px-3 py-1 text-sm"
          >
            + 250 ml
          </button>
        </div>
      </div>
      {targetMl != null && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/10">
          <div className="h-full bg-black" style={{ width: `${pct}%` }} />
        </div>
      )}
      {targetMl == null && (
        <p className="mt-2 text-xs text-black/40">Tu nutriólogo todavía no te asignó una meta de agua.</p>
      )}
    </div>
  );
}
