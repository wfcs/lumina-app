import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { bancoMcpConfigured, getAddConnectionUrl } from "@/server/bancomcp";
import { canUseOpenFinance } from "@/lib/access";

export async function GET() {
  if (!bancoMcpConfigured()) return NextResponse.json({ configured: false });
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!canUseOpenFinance(user.email)) return NextResponse.json({ configured: false });
  try {
    const url = await getAddConnectionUrl();
    return NextResponse.json({ configured: true, url });
  } catch (e) {
    return NextResponse.json({ configured: true, url: null, note: String(e) }, { status: 200 });
  }
}
