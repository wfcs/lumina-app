import { NextResponse } from "next/server";
import { createConnectToken } from "@/server/pluggy";

// GET /api/pluggy/connect-token
// Retorna um token para inicializar o Pluggy Connect Widget no cliente.
// Em modo protótipo (sem credenciais), devolve um token mock.
export async function GET() {
  try {
    const token = await createConnectToken();
    return NextResponse.json({ token, mode: "live" });
  } catch (e) {
    return NextResponse.json(
      { token: "mock-connect-token", mode: "mock", note: String(e) },
      { status: 200 }
    );
  }
}
