import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const STAFF_ROLES = new Set(["medico", "entrenador", "nutriologo", "admin"]);

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic = path.startsWith("/login") || path === "/";

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role as string | undefined;
    const isStaffArea = ["/dashboard", "/deportistas", "/evaluaciones", "/planes"].some((p) => path.startsWith(p));
    const isAthleteArea = ["/hoy", "/diario"].some((p) => path.startsWith(p));
    const homePath = role === "deportista" ? "/hoy" : "/dashboard";

    if (role && isStaffArea && !STAFF_ROLES.has(role)) {
      return NextResponse.redirect(new URL(homePath, request.url));
    }
    if (role && STAFF_ROLES.has(role) && isAthleteArea) {
      return NextResponse.redirect(new URL(homePath, request.url));
    }
    if (path === "/login") {
      return NextResponse.redirect(new URL(homePath, request.url));
    }
  }

  return response;
}
