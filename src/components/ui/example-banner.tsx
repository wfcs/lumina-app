import { Info } from "lucide-react";

export function ExampleBanner({ note }: { note?: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-warn/30 bg-warn/10 px-4 py-2.5 mb-5 text-sm">
      <Info size={16} className="text-warn mt-0.5 shrink-0" />
      <span>{note ?? "Esta tela ainda usa dados de exemplo — em breve com seus dados reais do Open Finance."}</span>
    </div>
  );
}
