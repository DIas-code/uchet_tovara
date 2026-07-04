import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { AddCategory } from "@/components/categories/add-category";
import { CategoryRowActions } from "@/components/categories/category-row-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function CategoriesPage() {
  const t = await getTranslations("categories");
  const user = await getCurrentUser();
  const isAdmin = user!.role === "admin";

  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name, products(count)")
    .order("name", { ascending: true });

  const categories = (data ?? []) as {
    id: string;
    name: string;
    products: { count: number }[];
  }[];

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>

      {isAdmin ? (
        <AddCategory />
      ) : (
        <p className="text-muted-foreground text-sm">{t("adminOnly")}</p>
      )}

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("name")}</TableHead>
              <TableHead className="text-right">{t("count")}</TableHead>
              {isAdmin && (
                <TableHead className="w-[1%] text-right">
                  {t("actions")}
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={isAdmin ? 3 : 2}
                  className="text-muted-foreground py-8 text-center"
                >
                  {t("empty")}
                </TableCell>
              </TableRow>
            )}
            {categories.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.name}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {c.products?.[0]?.count ?? 0}
                </TableCell>
                {isAdmin && (
                  <TableCell className="text-right">
                    <CategoryRowActions id={c.id} name={c.name} />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}
