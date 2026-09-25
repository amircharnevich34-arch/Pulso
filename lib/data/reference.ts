import { createClient } from "@/lib/supabase/server";

export type MealSlot = { id: string; key: string; label: string; sortOrder: number };
export type FoodCategory = { id: string; key: string; label: string; sortOrder: number };

export async function getMealSlots(): Promise<MealSlot[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("meal_slots")
    .select("id, key, label, sort_order")
    .order("sort_order", { ascending: true });
  return (data ?? []).map((m) => ({ id: m.id, key: m.key, label: m.label, sortOrder: m.sort_order }));
}

export async function getFoodCategories(): Promise<FoodCategory[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("food_categories")
    .select("id, key, label, sort_order")
    .order("sort_order", { ascending: true });
  return (data ?? []).map((c) => ({ id: c.id, key: c.key, label: c.label, sortOrder: c.sort_order }));
}
