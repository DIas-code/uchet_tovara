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

// Экранируем спецсимволы фильтра PostgREST в пользовательском вводе.
function sanitize(q: string) {
  return q.replace(/[,()%*]/g, " ").trim();
}

type ProductRow = {
  id: string;
  code: string;
  name: string | null;
  category: string | null;
  stock: number;
  sale_price: number;
  purchase_price: number | null;
};

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

  // Полный список категорий бутика (для плашек и подсказок), не зависит от фильтра.
  const { data: catRows } = await supabase.from("products").select("category");
  const categories = Array.from(
    new Set((catRows ?? []).map((r) => r.category).filter(Boolean) as string[]),
  ).sort((a, b) => a.localeCompare(b, "ru"));
  const hasUncategorized = (catRows ?? []).some((r) => !r.category);

  // Основной список с учётом поиска и фильтров.
  let query = supabase
    .from("products")
    .select("id, code, name, category, stock, sale_price, purchase_price")
    .order("code", { ascending: true });
  if (q) query = query.or(`code.ilike.%${q}%,name.ilike.%${q}%`);
  if (inStock) query = query.gt("stock", 0);
  if (category === NO_CATEGORY) query = query.is("category", null);
  else if (category) query = query.eq("category", category);

  const { data } = await query;
  const products = (data ?? []) as ProductRow[];

  // Ссылка на плашку категории с сохранением поиска и фильтра наличия.
  function chipHref(cat: string | null) {
    const p = new URLSearchParams();
    if (rawQ) p.set("q", rawQ);
    if (inStock) p.set("inStock", "1");
    if (cat) p.set("category", cat);
    const s = p.toString();
    return s ? `/products?${s}` : "/products";
  }

  const chips: { key: string; label: string; value: string | null }[] = [
    { key: "all", label: t("allCategories"), value: null },
    ...categories.map((c) => ({ key: c, label: c, value: c })),
  ];
  if (hasUncategorized) {
    chips.push({ key: NO_CATEGORY, label: t("noCategory"), value: NO_CATEGORY });
  }

  // Группировка по категориям для режима «Все».
  const grouped = new Map<string, ProductRow[]>();
  for (const p of products) {
    const key = p.category ?? t("noCategory");
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
      <TableCell>{p.category ?? "—"}</TableCell>
      <TableCell className="text-right tabular-nums">
        {p.stock > 0 ? p.stock : <Badge variant="secondary">0</Badge>}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatMoney(p.sale_price)}
      </TableCell>
      <TableCell className="text-right">
        <ProductRowActions product={p} role={role} categories={categories} />
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

      {/* Плашки-фильтры по категориям */}
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
