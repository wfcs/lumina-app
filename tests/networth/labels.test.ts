import { describe, it, expect } from "vitest";
import { accountTypeLabel, loanLabel } from "@/lib/labels";

describe("N-02 rótulos legíveis", () => {
  it("traduz tipos de conta do Open Finance", () => {
    expect(accountTypeLabel("CHECKING_ACCOUNT")).toBe("Conta corrente");
    expect(accountTypeLabel("SAVINGS_ACCOUNT")).toBe("Poupança");
    expect(accountTypeLabel(null, "BANK")).toBe("Conta bancária");
    expect(accountTypeLabel("SOME_NEW_TYPE")).toBe("Some new type");
    expect(accountTypeLabel(null, null)).toBe("");
  });
  it("encurta nome de empréstimo mantendo o final do contrato", () => {
    expect(loanLabel("CREDITO ECONSIGNADO REFIN ITAU …374")).toBe("Consignado Itaú …374");
    expect(loanLabel("CREDITO ECONSIGNADO REFIN ITAU")).toBe("Consignado Itaú");
  });
});
