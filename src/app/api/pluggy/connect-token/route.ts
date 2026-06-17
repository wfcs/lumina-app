import { NextResponse } from "next/server";
import { createConnectToken, pluggyConfigured } from "@/server/pluggy";

export async function GET() {
  if (!pluggyConfigured()) {
    return NextResponse.json({ mode: "mock", token: null, note: "Pluggy sem credenciais (.env)" });
  }
  try {
    const token = await createConnectToken();
    return NextResponse.json({ mode: "live", token });
  } catch (e) {
    return NextResponse.json({ mode: "error", token: null, note: String(e) }, { status: 500 });
  }
}
