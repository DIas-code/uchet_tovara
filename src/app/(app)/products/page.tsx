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

// Экранируем спецсимволы фильтра PostgREST в пользовательском вводе.
function sanitize(q: string) {
  return q.replace(/[,()%*]/g, " ").trim();
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; inStock?: string }>;
}) {
  const sp = await searchParams;
  const rawQ = (sp.q ?? "").toString();
  const q = sanitize(rawQ);
  const inStock = sp.inStock === "1";

  const t = await getTranslations("products");
  const user = await getCurrentUser();
  const role = user!.role;

  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select("id, code, name, category, stock, sale_price, purchase_price")
    .order("code", { ascending: true });
  if (q) query = query.or(`code.ilike.%${q}%,name.ilike.%${q}%`);
  if (inStock) query = query.gt("stock", 0);

  const { data: products } = await query;
  const fmt = new Intl.NumberFormat("ru-RU");

  return (
    <main className="flex flex-1 flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>

      <ProductsToolbar role={role} q={rawQ} inStock={inStock} />

      <div className="rounded-md border">
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
            {(!products || products.length === 0) && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground py-8 text-center"
                >
                  {t("empty")}
                </TableCell>
              </TableRow>
            )}
            {products?.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono">
                  <Link
                    href={`/products/${p.id}`}
                    className="hover:underline"
                  >
                    {p.code}
                  </Link>
                </TableCell>
                <TableCell>{p.name ?? "—"}</TableCell>
                <TableCell>{p.category ?? "—"}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {p.stock > 0 ? (
                    p.stock
                  ) : (
                    <Badge variant="secondary">0</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {fmt.format(p.sale_price)}
                </TableCell>
                <TableCell className="text-right">
                  <ProductRowActions product={p} role={role} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}
