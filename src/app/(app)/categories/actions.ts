"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import type { ActionResult } from "@/app/(app)/products/actions";

const DUPLICATE = "23505";

function revalidate() {
  revalidatePath("/categories");
  revalidatePath("/products");
}

export async function createCategory(nameRaw: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Не авторизовано" };
  if (user.role !== "admin")
    return { ok: false, error: "Управлять категориями может только администратор" };

  const name = nameRaw.trim();
  if (!name) return { ok: false, error: "Укажите название категории" };

  const supabase = await createClient();
  const { error } = await supabase.from("categories").insert({ name });
  if (error) {
    if (error.code === DUPLICATE)
      return { ok: false, error: "Такая категория уже существует" };
    return { ok: false, error: error.message };
  }
  revalidate();
  return { ok: true };
}

export async function renameCategory(
  id: string,
  nameRaw: string,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Не авторизовано" };
  if (user.role !== "admin")
    return { ok: false, error: "Управлять категориями может только администратор" };

  const name = nameRaw.trim();
  if (!name) return { ok: false, error: "Укажите название категории" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({ name })
    .eq("id", id);
  if (error) {
    if (error.code === DUPLICATE)
      return { ok: false, error: "Такая категория уже существует" };
    return { ok: false, error: error.message };
  }
  revalidate();
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Не авторизовано" };
  if (user.role !== "admin")
    return { ok: false, error: "Управлять категориями может только администратор" };

  const supabase = await createClient();
  // Товары этой категории станут «без категории» (FK on delete set null).
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}
