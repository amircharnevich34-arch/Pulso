import Link from "next/link";
import { signOut } from "@/lib/auth/actions";

const links = [
  { href: "/dashboard", label: "Panel" },
  { href: "/deportistas", label: "Deportistas" },
  { href: "/evaluaciones", label: "Evaluaciones" },
  { href: "/planes", label: "Planes" },
];

export function StaffNav() {
  return (
    <nav className="flex items-center justify-between border-b border-black/10 px-6 py-3">
      <div className="flex items-center gap-5">
        <span className="font-semibold">Pulso</span>
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="text-sm text-black/60 hover:text-black">
            {l.label}
          </Link>
        ))}
      </div>
      <form action={signOut}>
        <button type="submit" className="text-sm text-black/60 hover:text-black">
          Cerrar sesión
        </button>
      </form>
    </nav>
  );
}
