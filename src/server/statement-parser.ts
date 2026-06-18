// Parser de extratos OFX e CSV → modelo comum de transações.
export interface ParsedTx {
  fitid: string;       // id estável da transação no arquivo
  date: string;        // YYYY-MM-DD
  amount: number;      // sinal: negativo = saída
  description: string;
  type: "DEBIT" | "CREDIT";
}
export interface ParsedStatement {
  accountKey: string;      // identificador da conta no arquivo
  accountName: string;
  balance: number | null;
  currency: string;
  transactions: ParsedTx[];
}

function tag(block: string, name: string): string | null {
  const m = block.match(new RegExp(`<${name}>([^<\\r\\n]*)`, "i"));
  return m ? m[1].trim() : null;
}

function ofxDate(v: string | null): string {
  if (!v) return "";
  const d = v.replace(/[^0-9]/g, "").slice(0, 8); // YYYYMMDD
  if (d.length < 8) return "";
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
}

export function parseOFX(text: string): ParsedStatement {
  const acctId = tag(text, "ACCTID") ?? "conta";
  const bankId = tag(text, "BANKID") ?? "";
  const balRaw = tag(text, "BALAMT");
  const curr = tag(text, "CURDEF") ?? "BRL";

  const blocks = text.split(/<STMTTRN>/i).slice(1);
  const transactions: ParsedTx[] = [];
  for (const b of blocks) {
    const amtRaw = tag(b, "TRNAMT");
    if (amtRaw == null) continue;
    const amount = parseFloat(amtRaw.replace(",", "."));
    if (Number.isNaN(amount)) continue;
    const date = ofxDate(tag(b, "DTPOSTED"));
    if (!date) continue;
    const memo = tag(b, "MEMO") ?? tag(b, "NAME") ?? "Transação";
    const fitid = tag(b, "FITID") ?? `${date}-${amtRaw}-${memo}`.slice(0, 80);
    transactions.push({
      fitid,
      date,
      amount,
      description: memo,
      type: amount < 0 ? "DEBIT" : "CREDIT",
    });
  }

  return {
    accountKey: `${bankId}-${acctId}`,
    accountName: bankId ? `Conta ${bankId}` : `Conta ${acctId}`,
    balance: balRaw != null ? parseFloat(balRaw.replace(",", ".")) : null,
    currency: curr,
    transactions,
  };
}

function parseAmountBR(raw: string): number {
  let s = raw.trim().replace(/[R$\s]/g, "");
  if (s.includes(",") && s.includes(".")) s = s.replace(/\./g, "").replace(",", ".");
  else if (s.includes(",")) s = s.replace(",", ".");
  return parseFloat(s);
}
function parseDateAny(raw: string): string {
  const s = raw.trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  m = s.match(/^(\d{2})\/(\d{2})\/(\d{2})$/);
  if (m) return `20${m[3]}-${m[2]}-${m[1]}`;
  return "";
}

export function parseCSV(text: string): ParsedStatement {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { accountKey: "csv", accountName: "Importação CSV", balance: null, currency: "BRL", transactions: [] };

  const delim = (lines[0].match(/;/g)?.length ?? 0) > (lines[0].match(/,/g)?.length ?? 0) ? ";" : ",";
  const header = lines[0].toLowerCase().split(delim).map((h) => h.trim());
  const findCol = (...keys: string[]) => header.findIndex((h) => keys.some((k) => h.includes(k)));
  let dateIdx = findCol("data", "date");
  let descIdx = findCol("descri", "histor", "memo", "lançamento", "lancamento", "title");
  let amtIdx = findCol("valor", "amount", "montante", "value");
  const hasHeader = dateIdx !== -1 || amtIdx !== -1;
  if (!hasHeader) { dateIdx = 0; descIdx = 1; amtIdx = 2; }
  if (amtIdx === -1) amtIdx = header.length - 1;
  if (dateIdx === -1) dateIdx = 0;
  if (descIdx === -1) descIdx = 1;

  const rows = hasHeader ? lines.slice(1) : lines;
  const transactions: ParsedTx[] = [];
  rows.forEach((line, i) => {
    const cols = line.split(delim);
    const date = parseDateAny(cols[dateIdx] ?? "");
    const amount = parseAmountBR(cols[amtIdx] ?? "");
    if (!date || Number.isNaN(amount)) return;
    const description = (cols[descIdx] ?? "Transação").trim().replace(/^"|"$/g, "");
    transactions.push({
      fitid: `${date}-${amount}-${i}`,
      date,
      amount,
      description,
      type: amount < 0 ? "DEBIT" : "CREDIT",
    });
  });

  return { accountKey: "csv", accountName: "Importação CSV", balance: null, currency: "BRL", transactions };
}

export function parseStatement(filename: string, text: string): ParsedStatement {
  const isOFX = /\.ofx$/i.test(filename) || /<OFX>/i.test(text) || /<STMTTRN>/i.test(text);
  return isOFX ? parseOFX(text) : parseCSV(text);
}
