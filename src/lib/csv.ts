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
