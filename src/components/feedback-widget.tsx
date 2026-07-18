"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquarePlus, X, CheckCircle2, AlertCircle } from "lucide-react";
import { submitFeedback, type FeedbackState } from "@/app/feedback/actions";

const categories = [
  { id: "visual", label: "Visual", emoji: "🎨" },
  { id: "performance", label: "Performance", emoji: "⚡" },
  { id: "bug", label: "Bug", emoji: "🐞" },
  { id: "ideia", label: "Ideia", emoji: "💡" },
  { id: "outro", label: "Outro", emoji: "💬" },
];

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState("ideia");
  const path = usePathname();
  const [state, formAction] = useFormState<FeedbackState, FormData>(submitFeedback, {});

  // fecha sozinho após sucesso
  useEffect(() => {
    if (state.ok && open) {
      const t = setTimeout(() => setOpen(false), 1800);
      return () => clearTimeout(t);
    }
  }, [state.ok, open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Enviar feedback"
        className="fixed bottom-5 right-5 z-30 h-12 px-4 rounded-full flex items-center gap-2 text-white font-semibold text-sm shadow-glow-violet"
        style={{ background: "linear-gradient(135deg, #52528C, #D7B8F3)" }}
      >
        <MessageSquarePlus size={18} /> Feedback
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40 grid place-items-end sm:place-items-center justify-items-center bg-black/50 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              className="card p-5 w-full max-w-md"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-bold text-lg">Enviar feedback</h3>
                <button onClick={() => setOpen(false)} className="text-muted hover:text-[var(--text)]"><X size={18} /></button>
              </div>

              {state.ok ? (
                <div className="py-8 text-center">
                  <CheckCircle2 size={36} className="mx-auto text-[var(--mint)] mb-2" />
                  <p className="font-semibold">Obrigado pelo feedback!</p>
                  <p className="text-sm text-muted">Sua mensagem foi registrada.</p>
                </div>
              ) : (
                <form action={formAction} className="space-y-3">
                  <input type="hidden" name="category" value={cat} />
                  <input type="hidden" name="page" value={path} />

                  <div className="flex flex-wrap gap-2">
                    {categories.map((c) => (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => setCat(c.id)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                          cat === c.id
                            ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--text)]"
                            : "border-[var(--border)] text-muted hover:text-[var(--text)]"
                        }`}
                      >
                        {c.emoji} {c.label}
                      </button>
                    ))}
                  </div>

                  <textarea
                    name="message"
                    rows={4}
                    placeholder="O que podemos melhorar? Conte detalhes de visual, performance, bugs ou ideias…"
                    className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--card-2)] text-sm outline-none focus:border-[var(--accent)] resize-none"
                  />

                  {state.error && (
                    <div className="flex items-center gap-2 text-danger text-sm rounded-lg border border-danger/30 bg-danger/10 px-3 py-2">
                      <AlertCircle size={15} /> {state.error}
                    </div>
                  )}

                  <SubmitButton />
                  <p className="text-[11px] text-muted text-center">Enviado da página <span className="num">{path}</span></p>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full h-11 rounded-xl font-semibold text-white transition-opacity disabled:opacity-50"
      style={{ background: "linear-gradient(135deg, #52528C, #D7B8F3)" }}
    >
      {pending ? "Enviando…" : "Enviar feedback"}
    </button>
  );
}
