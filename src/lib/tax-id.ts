export function onlyDigits(v: string): string {
  return (v ?? "").replace(/\D/g, "");
}

export function isValidCPF(value: string): boolean {
  const c = onlyDigits(value);
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
  let s = 0;
  for (let i = 0; i < 9; i++) s += +c[i] * (10 - i);
  let d1 = 11 - (s % 11);
  if (d1 >= 10) d1 = 0;
  if (d1 !== +c[9]) return false;
  s = 0;
  for (let i = 0; i < 10; i++) s += +c[i] * (11 - i);
  let d2 = 11 - (s % 11);
  if (d2 >= 10) d2 = 0;
  return d2 === +c[10];
}

export function isValidCNPJ(value: string): boolean {
  const c = onlyDigits(value);
  if (c.length !== 14 || /^(\d)\1{13}$/.test(c)) return false;
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let s = 0;
  for (let i = 0; i < 12; i++) s += +c[i] * w1[i];
  let r = s % 11;
  const d1 = r < 2 ? 0 : 11 - r;
  if (d1 !== +c[12]) return false;
  s = 0;
  for (let i = 0; i < 13; i++) s += +c[i] * w2[i];
  r = s % 11;
  const d2 = r < 2 ? 0 : 11 - r;
  return d2 === +c[13];
}

export function isValidTaxId(value: string): boolean {
  const c = onlyDigits(value);
  if (c.length === 11) return isValidCPF(c);
  if (c.length === 14) return isValidCNPJ(c);
  return false;
}

export function maskTaxId(value: string): string {
  const c = onlyDigits(value).slice(0, 14);
  if (c.length <= 11) {
    return c
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return c
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}
