import { createClient } from "@/lib/supabase/server";

export type FoodBankItem = { id: string; name: string; portionDescription: string | null };

// All active food bank items, grouped by food_category_id.
export async function getFoodBankByCategory(): Promise<Map<string, FoodBankItem[]>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("food_bank_items")
    .select("id, name, portion_description, food_category_id")
    .eq("active", true)
    .order("name", { ascending: true });

  const byCategory = new Map<string, FoodBankItem[]>();
  for (const item of data ?? []) {
    const list = byCategory.get(item.food_category_id) ?? [];
    list.push({ id: item.id, name: item.name, portionDescription: item.portion_description });
    byCategory.set(item.food_category_id, list);
  }
  return byCategory;
}
