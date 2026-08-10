import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, role")
    .eq("id", user!.id)
    .single();

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Panel principal</h1>
      <p className="mt-2 text-black/60">
        Hola, {profile?.full_name ?? "—"} ({profile?.role ?? "—"}).
      </p>
    </main>
  );
}
