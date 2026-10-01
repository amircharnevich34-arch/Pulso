"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PracticeAttendee } from "@/lib/data/attendance";

export function AttendanceGrid({
  practiceId,
  currentUserId,
  initialAttendees,
}: {
  practiceId: string;
  currentUserId: string;
  initialAttendees: PracticeAttendee[];
}) {
  const [statusById, setStatusById] = useState(
    new Map(initialAttendees.map((a) => [a.athleteId, a.status]))
  );
  const [, startTransition] = useTransition();

  function setStatus(athleteId: string, status: "presente" | "ausente") {
    const next = new Map(statusById);
    next.set(athleteId, status);
    setStatusById(next);

    startTransition(async () => {
      const supabase = createClient();
      await supabase.from("attendance").upsert(
        {
          practice_id: practiceId,
          athlete_id: athleteId,
          status,
          marked_by: currentUserId,
          marked_at: new Date().toISOString(),
        },
        { onConflict: "practice_id,athlete_id" }
      );
    });
  }

  const presentCount = [...statusById.values()].filter((s) => s === "presente").length;

  return (
    <div>
      <p className="mb-3 text-sm text-black/50">
        {presentCount}/{initialAttendees.length} presentes
      </p>
      <ul className="divide-y divide-black/5">
        {initialAttendees.map((a) => {
          const status = statusById.get(a.athleteId) ?? null;
          return (
            <li key={a.athleteId} className="flex items-center justify-between py-2 text-sm">
              <span className="font-medium">{a.fullName}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStatus(a.athleteId, "presente")}
                  className={`rounded-md border px-3 py-1 text-xs font-medium ${
                    status === "presente" ? "border-black bg-black text-white" : "border-black/15 text-black/60"
                  }`}
                >
                  Presente
                </button>
                <button
                  type="button"
                  onClick={() => setStatus(a.athleteId, "ausente")}
                  className={`rounded-md border px-3 py-1 text-xs font-medium ${
                    status === "ausente" ? "border-black bg-black text-white" : "border-black/15 text-black/60"
                  }`}
                >
                  Ausente
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
