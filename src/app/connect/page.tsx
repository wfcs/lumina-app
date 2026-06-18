import { createClient } from "@/lib/supabase/server";
import { canUseOpenFinance } from "@/lib/access";
import { ConnectChoice } from "./connect-choice";

export default async function ConnectPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <ConnectChoice canOpenFinance={canUseOpenFinance(user?.email)} />;
}
