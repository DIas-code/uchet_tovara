import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { MovementDialog } from "@/components/movements/movement-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type MoveType = "приход" | "продажа" | "возврат";

const BADGE_VARIANT: Record<MoveType, "default" | "secondary" | "destructive"> =
  {
    приход: "default",
    возврат: "secondary",
    продажа: "destructive",
  };

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("movements");
  const tp = await getTranslations("products");

  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("id, code, name, category, stock, sale_price")
    .eq("id", id)
    .single();
  if (!product) notFound();

  const { data: movements } = await supabase
    .from("movements")
    .select("id, type, quantity, date")
    .eq("product_id", id)
    .order("date", { ascending: false })
    .order("id", { ascending: false });

  const typeLabel: Record<MoveType, string> = {
    приход: t("receipt"),
    продажа: t("sale"),
    возврат: t("return"),
  };
  const fmt = new Intl.NumberFormat("ru-RU");
  const dfmt = new Intl.DateTimeFormat("ru-RU");

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <Link
        href="/products"
        className="text-muted-foreground text-sm hover:underline"
      >
        ← {tp("title")}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-mono text-2xl font-semibold">{product.code}</h1>
          <p className="text-muted-foreground">
            {product.name ?? "—"}
            {product.category ? ` · ${product.category}` : ""}
          </p>
          <p className="mt-1 text-sm">
            {tp("stock")}: <b className="tabular-nums">{product.stock}</b>
            {" · "}
            {tp("salePrice")}: {fmt.format(product.sale_price)}
          </p>
        </div>
        <MovementDialog
          productId={product.id}
          productCode={product.code}
          trigger={<Button>{t("add")}</Button>}
        />
      </div>

      <section>
        <h2 className="mb-2 font-medium">{t("history")}</h2>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("date")}</TableHead>
                <TableHead>{t("type")}</TableHead>
                <TableHead className="text-right">{t("quantity")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!movements || movements.length === 0) && (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-muted-foreground py-8 text-center"
                  >
                    {t("noHistory")}
                  </TableCell>
                </TableRow>
              )}
              {movements?.map((m) => {
                const mt = m.type as MoveType;
                return (
                  <TableRow key={m.id}>
                    <TableCell>{dfmt.format(new Date(m.date))}</TableCell>
                    <TableCell>
                      <Badge variant={BADGE_VARIANT[mt]}>{typeLabel[mt]}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {mt === "продажа" ? "−" : "+"}
                      {m.quantity}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </section>
    </main>
  );
}
