import { Fragment } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { ProductsToolbar } from "@/components/products/products-toolbar";
import { ProductRowActions } from "@/components/products/product-row-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";

const NO_CATEGORY = "__none__";

function sanitize(q: string) {
  return q.replace(/[,()%*]/g, " ").trim();
}

type ProductRow = {
  id: string;
  code: string;
  name: string | null;
  category_id: string | null;
  stock: number;
  sale_price: number;
  purchase_price: number | null;
  categories: { name: string } | { name: string }[] | null;
};

function categoryName(row: ProductRow): string | null {
  const c = row.categories;
  if (!c) return null;
  return Array.isArray(c) ? (c[0]?.name ?? null) : c.name;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; inStock?: string; category?: string }>;
}) {
  const sp = await searchParams;
  const rawQ = (sp.q ?? "").toString();
  const q = sanitize(rawQ);
  const inStock = sp.inStock === "1";
  const category = (sp.category ?? "").toString();

  const t = await getTranslations("products");
  const user = await getCurrentUser();
  const role = user!.role;

  const supabase = await createClient();

  // Список категорий бутика (для плашек и выпадающего списка в форме).
  const { data: catData } = await supabase
    .from("categories")
    .select("id, name")
    .order("name", { ascending: true });
  const categories = (catData ?? []) as { id: string; name: string }[];

  // Есть ли товары без категории (для плашки «Без категории»).
  const { count: uncategorizedCount } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .is("category_id", null);
  const hasUncategorized = (uncategorizedCount ?? 0) > 0;

  // Основной список.
  let query = supabase
    .from("products")
    .select(
      "id, code, name, category_id, stock, sale_price, purchase_price, categories(name)",
    )
    .order("code", { ascending: true });
  if (q) query = query.or(`code.ilike.%${q}%,name.ilike.%${q}%`);
  if (inStock) query = query.gt("stock", 0);
  if (category === NO_CATEGORY) query = query.is("category_id", null);
  else if (category) query = query.eq("category_id", category);

  const { data } = await query;
  const products = (data ?? []) as unknown as ProductRow[];

  function chipHref(value: string | null) {
    const p = new URLSearchParams();
    if (rawQ) p.set("q", rawQ);
    if (inStock) p.set("inStock", "1");
    if (value) p.set("category", value);
    const s = p.toString();
    return s ? `/products?${s}` : "/products";
  }

  const chips: { key: string; label: string; value: string | null }[] = [
    { key: "all", label: t("allCategories"), value: null },
    ...categories.map((c) => ({ key: c.id, label: c.name, value: c.id })),
  ];
  if (hasUncategorized) {
    chips.push({ key: NO_CATEGORY, label: t("noCategory"), value: NO_CATEGORY });
  }

  // Группировка по категории для режима «Все».
  const grouped = new Map<string, ProductRow[]>();
  for (const p of products) {
    const key = categoryName(p) ?? t("noCategory");
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(p);
  }
  const groups = Array.from(grouped.entries()).sort((a, b) =>
    a[0].localeCompare(b[0], "ru"),
  );
  const showGrouped = !category && groups.length > 1;

  const renderRow = (p: ProductRow) => (
    <TableRow key={p.id}>
      <TableCell className="font-mono">
        <Link href={`/products/${p.id}`} className="hover:underline">
          {p.code}
        </Link>
      </TableCell>
      <TableCell>{p.name ?? "—"}</TableCell>
      <TableCell>{categoryName(p) ?? "—"}</TableCell>
      <TableCell className="text-right tabular-nums">
        {p.stock > 0 ? p.stock : <Badge variant="secondary">0</Badge>}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatMoney(p.sale_price)}
      </TableCell>
      <TableCell className="text-right">
        <ProductRowActions
          product={{
            id: p.id,
            code: p.code,
            name: p.name,
            category_id: p.category_id,
            sale_price: p.sale_price,
            purchase_price: p.purchase_price,
            stock: p.stock,
          }}
          role={role}
          categories={categories}
        />
      </TableCell>
    </TableRow>
  );

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>

      <ProductsToolbar
        role={role}
        q={rawQ}
        inStock={inStock}
        categories={categories}
      />

      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => {
          const active = (chip.value ?? "") === category;
          return (
            <Link
              key={chip.key}
              href={chipHref(chip.value)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition-colors",
                active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "hover:bg-accent",
              )}
            >
              {chip.label}
            </Link>
          );
        })}
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("code")}</TableHead>
              <TableHead>{t("name")}</TableHead>
              <TableHead>{t("category")}</TableHead>
              <TableHead className="text-right">{t("stock")}</TableHead>
              <TableHead className="text-right">{t("salePrice")}</TableHead>
              <TableHead className="w-[1%] text-right">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground py-8 text-center"
                >
                  {t("empty")}
                </TableCell>
              </TableRow>
            )}

            {products.length > 0 &&
              (showGrouped
                ? groups.map(([cat, items]) => (
                    <Fragment key={`g-${cat}`}>
                      <TableRow className="hover:bg-transparent">
                        <TableCell
                          colSpan={6}
                          className="bg-muted/50 text-muted-foreground text-xs font-medium tracking-wide uppercase"
                        >
                          {cat} · {items.length}
                        </TableCell>
                      </TableRow>
                      {items.map(renderRow)}
                    </Fragment>
                  ))
                : products.map(renderRow))}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}
