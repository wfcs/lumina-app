"use client";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { saveTaxId, type OnboardState } from "./actions";
import { maskTaxId, onlyDigits, isValidTaxId } from "@/lib/tax-id";
import { ShieldCheck, AlertCircle } from "lucide-react";
import { LuminaMark } from "@/components/ui/lumina-mark";

export default function OnboardingPage() {
  const [value, setValue] = useState("");
  const [state, formAction] = useFormState<OnboardState, FormData>(saveTaxId, {});
  const digits = onlyDigits(value);
  const kind = digits.length <= 11 ? "CPF" : "CNPJ";
  const localValid = isValidTaxId(digits);
  const showLocalError = digits.length >= 11 && !localValid;

  return (
    <div className="min-h-screen grid place-items-center px-4 relative overflow-hidden">
      <div className="orb h-72 w-72 -top-10 right-0" style={{ background: "radial-gradient(circle, #7C3AED, transparent 70%)" }} />
      <div className="relative w-full max-w-md">
        <div className="card p-6">
          <LuminaMark size={44} className="mb-4" />
          <h1 className="font-display text-xl font-bold">Confirme sua identidade</h1>
          <p className="text-sm text-muted mt-1 mb-6">
            Para continuar, informe um <b>CPF</b> ou <b>CNPJ</b> válido. Ele identifica sua conta de forma única no Lumina.
          </p>

          <form action={formAction} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted uppercase tracking-wide">{kind}</label>
              <input
                name="taxId"
                inputMode="numeric"
                autoComplete="off"
                value={value}
                onChange={(e) => setValue(maskTaxId(e.target.value))}
                placeholder="000.000.000-00"
                className={`mt-1.5 w-full h-12 px-4 rounded-xl border bg-[var(--card-2)] num text-lg outline-none transition-colors
                  ${showLocalError ? "border-danger" : localValid ? "border-[var(--mint)]" : "border-[var(--border)] focus:border-[var(--accent)]"}`}
              />
              {showLocalError && (
                <p className="text-danger text-xs mt-1.5 flex items-center gap-1"><AlertCircle size={12} /> {kind} inválido.</p>
              )}
            </div>

            {state.error && (
              <div className="flex items-center gap-2 text-danger text-sm rounded-lg border border-danger/30 bg-danger/10 px-3 py-2">
                <AlertCircle size={15} /> {state.error}
              </div>
            )}

            <SubmitButton disabled={!localValid} />
          </form>

          <div className="flex items-center gap-2 text-[11px] text-muted mt-5">
            <ShieldCheck size={13} className="text-[var(--mint)]" />
            Validamos os dígitos e a unicidade no servidor. Dados protegidos pela LGPD.
          </div>
        </div>

        <form action="/auth/signout" method="post" className="text-center mt-4">
          <button className="text-xs text-muted hover:text-[var(--text)]">Sair desta conta</button>
        </form>
      </div>
    </div>
  );
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="w-full h-12 rounded-xl font-semibold text-white transition-opacity disabled:opacity-50"
      style={{ background: "linear-gradient(135deg, #7C3AED, #D7B8F3)" }}
    >
      {pending ? "Validando…" : "Continuar"}
    </button>
  );
}
