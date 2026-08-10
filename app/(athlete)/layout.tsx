import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth/actions";

export default async function AthleteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-black/10 px-4 py-3">
        <div className="flex items-center gap-4">
          <span className="font-semibold">Pulso</span>
          <Link href="/hoy" className="text-sm text-black/60 hover:text-black">
            Hoy
          </Link>
          <Link href="/diario" className="text-sm text-black/60 hover:text-black">
            Mi diario
          </Link>
        </div>
        <form action={signOut}>
          <button type="submit" className="text-sm text-black/60 hover:text-black">
            Cerrar sesión
          </button>
        </form>
      </header>
      {children}
    </div>
  );
}
