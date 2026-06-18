import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

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
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const isAuthFlow = path.startsWith("/auth");
  const isLogin = path === "/login";
  const redirect = (to: string) => {
    const url = request.nextUrl.clone();
    url.pathname = to;
    return NextResponse.redirect(url);
  };

  // 1) Sem sessão
  if (!user) {
    if (isLogin || isAuthFlow) return response;
    return redirect("/login");
  }

  // 2) Sem CPF/CNPJ
  const { data: profile } = await supabase
    .from("profiles").select("onboarded").eq("id", user.id).single();
  if (!(profile?.onboarded ?? false)) {
    if (path === "/onboarding" || isAuthFlow) return response;
    return redirect("/onboarding");
  }

  // 3) Sem banco conectado (Open Finance)
  const { count } = await supabase
    .from("connections").select("id", { count: "exact", head: true });
  const connected = (count ?? 0) > 0;
  if (!connected) {
    if (path.startsWith("/connect") || isAuthFlow) return response;
    return redirect("/connect");
  }

  // 4) Tudo ok → não deixa voltar para telas de entrada
  if (isLogin || path === "/onboarding") {
    return redirect("/");
  }

  return response;
}
