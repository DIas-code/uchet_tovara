"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import type { ActionResult } from "@/app/(app)/products/actions";

const movementSchema = z.object({
  productId: z.string().uuid(),
  type: z.enum(["приход", "продажа", "возврат"]),
  quantity: z.coerce.number().int().positive(),
  date: z.string().optional(),
});

export type MovementInput = z.input<typeof movementSchema>;

// Провести операцию по товару. Остаток пересчитывает триггер в БД,
// он же не даёт уйти в минус (вернёт понятную ошибку).
export async function createMovement(
  raw: MovementInput,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Не авторизовано" };

  const parsed = movementSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Проверьте поля формы" };
  const { productId, type, quantity, date } = parsed.data;

  const supabase = await createClient();
  const row: Record<string, unknown> = {
    product_id: productId,
    type,
    quantity,
  };
  if (date) row.date = date;

  const { error } = await supabase.from("movements").insert(row);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
  return { ok: true };
}
