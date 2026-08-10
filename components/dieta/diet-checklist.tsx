"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import type { FoodBankItem } from "@/lib/data/foodbank";

export type DietMealGroup = {
  mealSlotId: string;
  mealLabel: string;
  categories: {
    categoryId: string;
    categoryLabel: string;
    targetPortions: number;
    items: FoodBankItem[];
  }[];
};

export function DietChecklist({
  athleteId,
  logDate,
  meals,
  initialCounts,
}: {
  athleteId: string;
  logDate: string;
  meals: DietMealGroup[];
  initialCounts: Record<string, number>;
}) {
  const [counts, setCounts] = useState<Record<string, number>>(initialCounts);
  const [, startTransition] = useTransition();

  function setCount(mealSlotId: string, itemId: string, value: number) {
    const next = Math.max(0, value);
    const key = `${mealSlotId}:${itemId}`;
    setCounts((prev) => ({ ...prev, [key]: next }));

    startTransition(async () => {
      const supabase = createClient();
      await supabase.from("diet_logs").upsert(
        {
          athlete_id: athleteId,
          log_date: logDate,
          meal_slot_id: mealSlotId,
          food_bank_item_id: itemId,
          portion_count: next,
        },
        { onConflict: "athlete_id,log_date,meal_slot_id,food_bank_item_id" }
      );
    });
  }

  if (meals.length === 0) {
    return (
      <p className="text-sm text-black/50">
        Todavía no tenés un plan de nutrición asignado.
      </p>
    );
  }

  return (
    <div className="grid gap-6">
      {meals.map((meal) => (
        <div key={meal.mealSlotId}>
          <h3 className="mb-2 font-semibold">{meal.mealLabel}</h3>
          <div className="grid gap-4">
            {meal.categories.map((cat) => {
              const total = cat.items.reduce(
                (sum, item) => sum + (counts[`${meal.mealSlotId}:${item.id}`] ?? 0),
                0
              );
              const done = total >= cat.targetPortions;
              return (
                <div key={cat.categoryId} className="rounded-md border border-black/10 p-3">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-black/70">{cat.categoryLabel}</span>
                    <span className={done ? "font-semibold text-green-700" : "text-black/50"}>
                      {total}/{cat.targetPortions}
                    </span>
                  </div>
                  <div className="mb-2 h-1 overflow-hidden rounded-full bg-black/10">
                    <div
                      className={`h-full ${done ? "bg-green-600" : "bg-black/40"}`}
                      style={{ width: `${Math.min(100, (total / cat.targetPortions) * 100)}%` }}
                    />
                  </div>
                  <ul className="grid gap-1">
                    {cat.items.map((item) => {
                      const key = `${meal.mealSlotId}:${item.id}`;
                      const count = counts[key] ?? 0;
                      return (
                        <li key={item.id} className="flex items-center justify-between py-1 text-sm">
                          <span>
                            {item.name}
                            {item.portionDescription && (
                              <span className="text-black/40"> ({item.portionDescription})</span>
                            )}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setCount(meal.mealSlotId, item.id, count - 1)}
                              disabled={count === 0}
                              className="h-6 w-6 rounded-full border border-black/15 text-xs disabled:opacity-30"
                            >
                              –
                            </button>
                            <span className="w-4 text-center tabular-nums">{count}</span>
                            <button
                              type="button"
                              onClick={() => setCount(meal.mealSlotId, item.id, count + 1)}
                              className="h-6 w-6 rounded-full border border-black/15 text-xs"
                            >
                              +
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
