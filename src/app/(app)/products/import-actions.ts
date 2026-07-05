"use server";

import { revalidatePath } from "next/cache";
import { parseCsv } from "@/lib/csv";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export type ImportResult = {
  ok: boolean;
  added: number;
  skipped: number;
  errors: { row: number; message: string }[];
  error?: string;
};

// Сопоставление заголовков колонок (в нижнем регистре) с полями.
const HEADER_MAP: Record<string, string> = {
  код: "code",
  наименование: "name",
  название: "name",
  категория: "category",
  "цена продажи": "salePrice",
  цена: "salePrice",
  "цена закупки": "purchasePrice",
  остаток: "stock",
  количество: "stock",
};

function toNumber(raw: string): number | null {
  const v = (raw ?? "").replace(/\s/g, "").replace(",", ".");
  if (v === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? NaN : n;
}

function fail(error: string): ImportResult {
  return { ok: false, added: 0, skipped: 0, errors: [], error };
}

// Импорт товаров из CSV. Существующие коды пропускаются, новые категории
// создаются автоматически, начальный остаток заводится движением «приход».
export async function importProducts(csvText: string): Promise<ImportResult> {
  const user = await getCurrentUser();
  if (!user) return fail("Не авторизовано");
  if (user.role !== "admin")
    return fail("Импорт доступен только администратору");

  const rows = parseCsv(csvText);
  if (rows.length < 2) return fail("Файл пустой или без данных");

  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const col: Record<string, number> = {};
  headers.forEach((h, i) => {
    const key = HEADER_MAP[h];
    if (key && col[key] === undefined) col[key] = i;
  });
  if (col.code === undefined || col.salePrice === undefined)
    return fail("Нужны хотя бы колонки «Код» и «Цена продажи»");

  const supabase = await createClient();

  const { data: existing } = await supabase.from("products").select("code");
  const existingCodes = new Set((existing ?? []).map((p) => p.code as string));

  const { data: cats } = await supabase.from("categories").select("id, name");
  const catMap = new Map<string, string>(
    (cats ?? []).map((c) => [
      (c.name as string).toLowerCase(),
      c.id as string,
    ]),
  );

  let added = 0;
  let skipped = 0;
  const errors: { row: number; message: string }[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const get = (k: string) =>
      col[k] !== undefined ? (row[col[k]] ?? "").trim() : "";

    const code = get("code");
    if (!code) {
      errors.push({ row: r + 1, message: "пустой код" });
      continue;
    }
    if (existingCodes.has(code)) {
      skipped++;
      continue;
    }

    const salePrice = toNumber(get("salePrice"));
    if (salePrice === null || Number.isNaN(salePrice) || salePrice < 0) {
      errors.push({ row: r + 1, message: `${code}: неверная цена продажи` });
      continue;
    }
    const purchaseRaw = toNumber(get("purchasePrice"));
    const purchasePrice =
      purchaseRaw === null || Number.isNaN(purchaseRaw) ? null : purchaseRaw;
    const stockRaw = toNumber(get("stock"));
    const stock = stockRaw === null || Number.isNaN(stockRaw) ? 0 : Math.trunc(stockRaw);
    const name = get("name") || null;
    const categoryName = get("category");

    // Категория: найти или создать.
    let categoryId: string | null = null;
    if (categoryName) {
      const key = categoryName.toLowerCase();
      categoryId = catMap.get(key) ?? null;
      if (!categoryId) {
        const { data: newCat, error: catErr } = await supabase
          .from("categories")
          .insert({ name: categoryName })
          .select("id")
          .single();
        if (catErr) {
          errors.push({
            row: r + 1,
            message: `${code}: категория «${categoryName}» — ${catErr.message}`,
          });
        } else {
          categoryId = newCat.id as string;
          catMap.set(key, categoryId);
        }
      }
    }

    const { data: prod, error: pErr } = await supabase
      .from("products")
      .insert({
        code,
        name,
        category_id: categoryId,
        sale_price: salePrice,
        purchase_price: purchasePrice,
      })
      .select("id")
      .single();
    if (pErr) {
      errors.push({ row: r + 1, message: `${code}: ${pErr.message}` });
      continue;
    }
    existingCodes.add(code);

    if (stock > 0) {
      const { error: mErr } = await supabase
        .from("movements")
        .insert({ product_id: prod.id, type: "приход", quantity: stock });
      if (mErr)
        errors.push({
          row: r + 1,
          message: `${code}: остаток не проведён — ${mErr.message}`,
        });
    }
    added++;
  }

  revalidatePath("/products");
  revalidatePath("/categories");
  return { ok: true, added, skipped, errors };
}
