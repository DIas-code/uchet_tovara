// Генерация CSV. Разделитель «;» и BOM — чтобы Excel корректно
// открывал файл с кириллицей и раскладывал по столбцам.
const BOM = "﻿";

function escapeCell(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[";\n\r]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  const sep = ";";
  const lines = [
    headers.map(escapeCell).join(sep),
    ...rows.map((row) => row.map(escapeCell).join(sep)),
  ];
  return BOM + lines.join("\r\n");
}

// Разбор CSV: поддерживает кавычки, экранированные кавычки и разделитель
// «;» или «,» (определяется по первой строке). Убирает BOM.
export function parseCsv(text: string): string[][] {
  const s = text.replace(/^﻿/, "");
  const firstLine = s.split(/\r?\n/)[0] ?? "";
  const sep = firstLine.includes(";") ? ";" : ",";

  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inQuotes) {
      if (ch === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === sep) {
      cur.push(field);
      field = "";
    } else if (ch === "\n") {
      cur.push(field);
      rows.push(cur);
      cur = [];
      field = "";
    } else if (ch !== "\r") {
      field += ch;
    }
  }
  if (field.length > 0 || cur.length > 0) {
    cur.push(field);
    rows.push(cur);
  }

  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}
