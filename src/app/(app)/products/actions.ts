"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { productSchema, type ProductInput } from "@/lib/validation";

export type ActionResult = { ok: true } | { ok: false; error: string };

const DUPLICATE_CODE = "23505";

// Создание товара. Начальный остаток заводится движением «приход»,
// чтобы журнал movements сходился с полем stock.
export async function createProduct(raw: ProductInput): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Не авторизовано" };

  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Проверьте поля формы" };
  const p = parsed.data;

  const supabase = await createClient();
  const { data: product, error } = await supabase
    .from("products")
    .insert({
      code: p.code,
      name: p.name || null,
      category: p.category || null,
      sale_price: p.salePrice,
      purchase_price: p.purchasePrice ?? null,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === DUPLICATE_CODE)
      return { ok: false, error: "Товар с таким кодом уже существует" };
    return { ok: false, error: error.message };
  }

  const initial = p.initialStock ?? 0;
  if (initial > 0) {
    const { error: mErr } = await supabase.from("movements").insert({
      product_id: product.id,
      type: "приход",
      quantity: initial,
    });
    if (mErr) {
      // Компенсация: убрать только что созданный товар.
      await supabase.from("products").delete().eq("id", product.id);
      return { ok: false, error: mErr.message };
    }
  }

  revalidatePath("/products");
  return { ok: true };
}

// Редактирование товара. Остаток здесь не меняется (только через движения).
// Продавец не может менять цены.
export async function updateProduct(
  id: string,
  raw: ProductInput,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Не авторизовано" };

  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Проверьте поля формы" };
  const p = parsed.data;

  const update: Record<string, unknown> = {
    code: p.code,
    name: p.name || null,
    category: p.category || null,
  };
  if (user.role === "admin") {
    update.sale_price = p.salePrice;
    update.purchase_price = p.purchasePrice ?? null;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("products").update(update).eq("id", id);
  if (error) {
    if (error.code === DUPLICATE_CODE)
      return { ok: false, error: "Товар с таким кодом уже существует" };
    return { ok: false, error: error.message };
  }

  revalidatePath("/products");
  return { ok: true };
}

// Удаление товара — только администратор и только при нулевом остатке.
export async function deleteProduct(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Не авторизовано" };
  if (user.role !== "admin")
    return { ok: false, error: "Удалять товары может только администратор" };

  const supabase = await createClient();
  const { data: product, error: readErr } = await supabase
    .from("products")
    .select("stock")
    .eq("id", id)
    .single();
  if (readErr) return { ok: false, error: readErr.message };
  if (product.stock !== 0)
    return { ok: false, error: "Нельзя удалить товар с ненулевым остатком" };

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/products");
  return { ok: true };
}
