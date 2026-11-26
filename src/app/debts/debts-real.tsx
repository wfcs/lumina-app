"use client";
import { Card } from "@/components/ui/card";
import { useUI } from "@/lib/store";
import type { DebtPlan, RankItem } from "@/lib/debt-plan";
import { CARD_ALERT } from "@/lib/debt-plan";
import { Info } from "lucide-react";

// Formatos pt-BR (biblioteca visual, com desvio aprovado: 1 casa na casa do mil).
const nf = (d: number) => new Intl.NumberFormat("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });
const reais = (v: number) => "R$ " + nf(2).format(v);
const kpi = (v: number) => (Math.abs(v) >= 10_000 ? `R$ ${nf(1).format(v / 1000)} mil` : `R$ ${nf(0).format(v)}`);
const pct = (v: number, d = 1) => `${nf(d).format(v * 100)}%`;
const dmy = (iso: string | null) => (iso ? iso.slice(8, 10) + "/" + iso.slice(5, 7) : "—");
const my = (iso: string | null) => (iso ? iso.slice(5, 7) + "/" + iso.slice(0, 4) : "—");
// "CREDITO ECONSIGNADO REFIN ITAU …374" → "Consignado Itaú …374" (nome do banco vem em caixa alta).
const loanLabel = (name: string) => {
  const suf = /…\d+$/.exec(name)?.[0];
  const base = name.replace(/…\d+$/, "").trim().toUpperCase();
  const kind = /CONSIGNADO/.test(base) ? "Consignado" : /PESSOAL/.test(base) ? "Pessoal"
    : /IMOBILI|HABITA/.test(base) ? "Imobiliário" : /VE[IÍ]CULO|AUTO/.test(base) ? "Veículo" : null;
  const bank = /ITAU|ITAÚ/.test(base) ? "Itaú" : /NUBANK|NU /.test(base) ? "Nubank" : null;
  const label = kind ? [kind, bank].filter(Boolean).join(" ") : name.replace(/…\d+$/, "").trim().toLowerCase().replace(/^./, (c) => c.toUpperCase());
  return suf ? `${label} ${suf}` : label;
};

function useMask() {
  const hide = useUI((s) => s.hideValues);
  return (s: string) => (hide ? "••••" : s);
}

function Bar({ share, color, track = "var(--card-2)", h = 6 }: { share: number; color: string; track?: string; h?: number }) {
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height: h, background: track }}>
      <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(1, share)) * 100}%`, background: color }} />
    </div>
  );
}

function Pill({ tone, children }: { tone: "danger" | "accent" | "neutral"; children: React.ReactNode }) {
  const cls = tone === "danger" ? "bg-danger/12 text-danger border-danger/20"
    : tone === "accent" ? "bg-[var(--accent)]/12 text-[var(--accent)] border-[var(--accent)]/25"
    : "bg-white/[0.04] text-muted border-[var(--border)]";
  return <span className={`inline-flex self-start shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${cls}`}>{children}</span>;
}

function RankRow({ item, pos, mask }: { item: RankItem; pos: number; mask: (s: string) => string }) {
  const focus = item.kind === "bills" || item.action === "amortizar";
  return (
    <div className="flex gap-3 py-3 border-b border-[var(--border)] last:border-0">
      <span className="grid place-items-center h-6 w-6 shrink-0 rounded-full text-[11px] font-semibold"
        style={focus ? { background: "var(--accent)", color: "var(--on-accent)" } : { background: "var(--card-2)", color: "var(--muted)" }}>{pos}</span>
      {item.kind === "bills" ? (
        <div className="flex-1 min-w-0 text-sm">
          <div className="flex items-start justify-between gap-3"><div>{item.action === "confirmar" ? "Confirmar faturas: " : "Pagar o total no vencimento: "}
            {item.bills.map((b, i) => (
              <span key={i}>{i > 0 && " e "}{b.institution} {mask(reais(b.total_amount))} ({item.action === "confirmar" ? "venceu" : "vence"} {dmy(b.due_date)})</span>
            ))}
          </div>{item.action === "confirmar" && <Pill tone="danger">Confirmar</Pill>}</div>
          <div className="text-xs text-muted mt-0.5">Rotativo é o crédito mais caro; a taxa do cartão não vem no Open Finance{item.action === "confirmar" ? ". O pagamento ainda não apareceu: confira no app do banco" : ""}.</div>
        </div>
      ) : (
        <div className="flex-1 min-w-0 text-sm">
          <div className="flex items-start justify-between gap-3">
            <div>{item.action === "amortizar" ? "Amortizar" : "Manter em dia"} {loanLabel(item.name)} · {pct(item.rate, 2)} a.m.</div>
            {item.action === "amortizar" && <Pill tone="accent">Amortizar</Pill>}
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <Bar share={item.interestShare} color={item.action === "amortizar" ? "var(--accent)" : "var(--peach)"} />
            <span className="text-xs text-muted num w-28 text-right shrink-0">{pct(item.interestShare)} dos juros</span>
          </div>
          {item.action === "amortizar" && (
            <div className="text-xs text-muted mt-1">Cada R$ 1.000 amortizados = {mask(reais(item.savingPer1000))} a menos de juros por mês.</div>
          )}
        </div>
      )}
    </div>
  );
}

export function DebtsReal({ plan, asOf, banks }: { plan: DebtPlan; asOf: string | null; banks: string[] }) {
  const mask = useMask();
  const k = plan.kpis;
  const top = plan.ranking.find((r) => r.kind === "loan");
  const asOfTxt = asOf ? new Date(asOf).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  if (plan.activeLoans.length === 0 && plan.cards.length === 0) {
    return (
      <Card><div className="text-sm">Nenhum empréstimo ou cartão encontrado. Conecte um banco e clique em <b>Atualizar</b> (↻) no topo.</div></Card>
    );
  }

  return (
    <div>
      <div className="text-[11px] text-muted mb-1">Dívidas · dados até {asOfTxt} · valores em R$ · {banks.join(" e ") || "Open Finance"}</div>
      <h1 className="text-xl md:text-2xl font-bold tracking-tight mb-5">
        Você deve {mask(kpi(k.totalOwed))}
        {top && top.kind === "loan" && <>; {pct(top.interestShare, 0)} dos juros do mês vêm de {loanLabel(top.name)} ({pct(top.rate, 2)} a.m.)</>}
      </h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Card className="p-4 card-peach"><div className="text-xs text-muted">Total devido</div><div className="text-2xl font-bold num my-1">{mask(kpi(k.totalOwed))}</div><div className="text-xs text-muted">empréstimos {mask(kpi(k.loanBalance))} + faturas {mask(kpi(k.billsToConfirm))}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted">Juros do mês (est.)</div><div className="text-2xl font-bold num my-1">{mask(kpi(k.monthlyInterest))}</div><div className="text-xs text-muted">custo médio {pct(k.avgRate)} a.m. sobre o saldo</div></Card>
        <Card className="p-4"><div className="text-xs text-muted">Parcelas do mês (est.)</div><div className="text-2xl font-bold num my-1">{mask(kpi(k.monthlyInstallments))}</div><div className="text-xs text-muted">{plan.activeLoans.length} contrato(s) · último em {my(k.lastDueDate)}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted">Faturas a confirmar</div><div className="text-2xl font-bold num my-1">{mask(kpi(k.billsToConfirm))}</div>
          <div className="text-xs">{k.billsToConfirmCount > 0 ? <Pill tone="danger">{k.billsToConfirmCount} sem pagamento visível</Pill> : <span className="text-muted">nenhuma pendente</span>}</div></Card>
      </div>

      {plan.ranking.length > 0 && (
        <Card className="mb-4">
          <div className="font-semibold">Ordem recomendada</div>
          <div className="text-xs text-muted mb-1">O que pagar primeiro?</div>
          {plan.ranking.map((r, i) => <RankRow key={i} item={r} pos={i + 1} mask={mask} />)}
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <Card>
          <div className="font-semibold">Empréstimos</div>
          <div className="text-xs text-muted mb-2">Quanto falta de cada contrato?</div>
          {plan.activeLoans.length === 0 && <p className="text-sm text-muted">Nenhum empréstimo ativo.</p>}
          {plan.activeLoans.map((l) => (
            <div key={l.id} className="py-2.5 border-b border-[var(--border)] last:border-0 text-sm">
              <div className="flex justify-between gap-3"><span className="truncate">{loanLabel(l.name)} · {pct(l.rate ?? 0, 2)} a.m.</span><span className="num font-semibold">{mask(reais(l.outstanding_balance))}</span></div>
              <div className="my-1.5"><Bar share={l.paidShare} color="var(--accent)" track="color-mix(in srgb, var(--accent) 30%, transparent)" h={8} /></div>
              <div className="text-xs text-muted">{l.installments_paid ?? 0} de {l.installments_total ?? "?"} pagas · parcela {l.installmentEstimated ? "est. " : ""}{mask(reais(l.installment))} · fim {my(l.due_date)}</div>
            </div>
          ))}
          <div className="text-xs text-muted pt-2">Cheio = parcelas pagas · claro = restantes{plan.paidOffLoans.length > 0 && ` · ${plan.paidOffLoans.length} contrato(s) quitado(s) oculto(s)`}</div>
        </Card>

        <Card>
          <div className="font-semibold">Cartões</div>
          <div className="text-xs text-muted mb-2">Quanto do limite estou usando?</div>
          {plan.cards.length === 0 && <p className="text-sm text-muted">Nenhum cartão conectado.</p>}
          {plan.cards.map((c) => (
            <div key={c.id} className="py-2.5 border-b border-[var(--border)] last:border-0 text-sm">
              <div className="flex justify-between gap-3"><span>{c.institution}</span><span className="num">{mask(reais(c.used))}{c.limit != null && <> de {mask(reais(c.limit))}</>}</span></div>
              <div className="my-1.5"><Bar share={c.utilization ?? 0} color={c.alert ? "var(--danger)" : "#A6A6A6"} h={8} /></div>
              <div className="text-xs text-muted">{c.utilization != null ? `${pct(c.utilization)} do limite` : "limite não informado"}
                {c.lastBill && <> · última fatura {mask(reais(c.lastBill.total_amount))} ({dmy(c.lastBill.due_date)})</>}</div>
            </div>
          ))}
          <div className="text-xs text-muted pt-2">Barra em cinza; vira alerta acima de {pct(CARD_ALERT, 0)} do limite.</div>
        </Card>
      </div>

      <details className="text-xs text-muted">
        <summary className="cursor-pointer inline-flex items-center gap-1"><Info size={13} /> Como calculamos</summary>
        <ul className="mt-2 space-y-1 list-disc pl-5">
          <li>Total devido = saldo devedor dos empréstimos + faturas vencidas sem pagamento visível. O limite usado do cartão não entra, para não contar a mesma compra duas vezes.</li>
          <li>Juros do mês = Σ (saldo × taxa mensal do contrato). Custo médio = juros do mês ÷ saldo total (ponderado pelo saldo, não média simples das taxas).</li>
          <li>Parcela = valor informado pelo banco; quando vem zerada, estimada pela tabela Price: saldo × i ÷ (1 − (1 + i)^−n), n = parcelas restantes. Pode diferir da real (seguro, IOF, arredondamento).</li>
          <li>Ordem: faturas vencidas sem pagamento visível → faturas abertas (pagar o total) → empréstimos da maior para a menor taxa (avalanche).</li>
          <li>&quot;Confirmar&quot; não quer dizer vencida: o pagamento pode ter sido feito e ainda não ter refletido no Open Finance.</li>
          <li>Recomendação apenas. O Lumina não faz pagamentos.</li>
        </ul>
      </details>
    </div>
  );
}
