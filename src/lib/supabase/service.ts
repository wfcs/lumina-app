import { createClient } from "@supabase/supabase-js";

// Cliente com service role — bypassa RLS. Use APENAS em rotas server sem sessão
// de usuário (ex.: webhook do Stripe). Nunca exponha no cliente.
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
