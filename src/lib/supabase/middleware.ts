import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAdmin, hasAppAccess } from "@/lib/access";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const isAuthFlow = path.startsWith("/auth");
  const isLogin = path === "/login";
  const redirect = (to: string) => {
    const url = request.nextUrl.clone(); url.pathname = to; return NextResponse.redirect(url);
  };

  if (!user) {
    if (isLogin || isAuthFlow) return response;
    return redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles").select("onboarded, plan, trial_ends_at").eq("id", user.id).single();

  // 1) CPF/CNPJ
  if (!(profile?.onboarded ?? false)) {
    if (path === "/onboarding" || isAuthFlow) return response;
    return redirect("/onboarding");
  }

  // 2) Trial/plano (admins isentos)
  const admin = isAdmin(user.email);
  const access = admin || hasAppAccess(profile ?? {});
  if (!access) {
    if (path === "/upgrade" || isAuthFlow) return response;
    return redirect("/upgrade");
  }
  if (path === "/upgrade") return redirect("/");

  // 3) Fonte de dados conectada
  const { count } = await supabase
    .from("connections").select("id", { count: "exact", head: true });
  if ((count ?? 0) === 0) {
    if (path.startsWith("/connect") || isAuthFlow) return response;
    return redirect("/connect");
  }

  // 4) Limpeza
  if (isLogin || path === "/onboarding") return redirect("/");

  return response;
}
