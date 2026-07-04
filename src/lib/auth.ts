import { createClient } from "@/lib/supabase/server";

export type Role = "admin" | "seller";

export type CurrentUser = {
  userId: string;
  email: string | null;
  boutiqueId: string;
  boutiqueName: string;
  role: Role;
  fullName: string | null;
};

// Текущий пользователь вместе с его бутиком и ролью.
// Возвращает null, если не вошёл или профиль ещё не создан.
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("boutique_id, role, full_name, boutiques(name)")
    .eq("id", user.id)
    .single();

  if (error || !data) return null;

  const boutique = data.boutiques as { name: string } | { name: string }[] | null;
  const boutiqueName = Array.isArray(boutique)
    ? (boutique[0]?.name ?? "")
    : (boutique?.name ?? "");

  return {
    userId: user.id,
    email: user.email ?? null,
    boutiqueId: data.boutique_id,
    boutiqueName,
    role: data.role as Role,
    fullName: data.full_name,
  };
}
