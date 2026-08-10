"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

export function RoutineChecklist({
  logDate,
  items,
  initialCompleted,
}: {
  logDate: string;
  items: { id: string; description: string }[];
  initialCompleted: string[];
}) {
  const [completed, setCompleted] = useState(new Set(initialCompleted));
  const [, startTransition] = useTransition();

  function toggle(itemId: string) {
    const next = new Set(completed);
    const isNowCompleted = !next.has(itemId);
    if (isNowCompleted) next.add(itemId);
    else next.delete(itemId);
    setCompleted(next);

    startTransition(async () => {
      const supabase = createClient();
      await supabase.from("routine_completions").upsert(
        { plan_item_id: itemId, log_date: logDate, completed: isNowCompleted },
        { onConflict: "plan_item_id,log_date" }
      );
    });
  }

  return (
    <ul className="divide-y divide-black/5">
      {items.map((item) => (
        <li key={item.id}>
          <label className="flex items-center gap-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={completed.has(item.id)}
              onChange={() => toggle(item.id)}
              className="h-4 w-4"
            />
            <span className={completed.has(item.id) ? "text-black/40 line-through" : ""}>
              {item.description}
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}
