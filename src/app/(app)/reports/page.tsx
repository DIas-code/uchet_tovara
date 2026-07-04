import { getTranslations } from "next-intl/server";
import { Download } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatMoney, formatNumber } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  { приход: "default", возврат: "secondary", продажа: "destructive" };

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const from = (sp.from ?? "").toString();
  const to = (sp.to ?? "").toString();

  const t = await getTranslations("reports");

  const supabase = await createClient();
  let query = supabase
    .from("movements")
    .select("date, type, quantity, products(code, name, sale_price)")
    .order("date", { ascending: false });
  if (from) query = query.gte("date", from);
  if (to) query = query.lte("date", to);

  const { data } = await query;
  const movements = (data ?? []) as unknown as {
    date: string;
    type: MoveType;
    quantity: number;
    products: { code: string; name: string | null; sale_price: number } | null;
  }[];

  let soldUnits = 0;
  let revenue = 0;
  let receivedUnits = 0;
  let returnedUnits = 0;
  for (const m of movements) {
    if (m.type === "продажа") {
      soldUnits += m.quantity;
      revenue += m.quantity * Number(m.products?.sale_price ?? 0);
    } else if (m.type === "приход") {
      receivedUnits += m.quantity;
    } else if (m.type === "возврат") {
      returnedUnits += m.quantity;
    }
  }

  const typeLabel: Record<MoveType, string> = {
    приход: t("received"),
    продажа: t("sold"),
    возврат: t("returned"),
  };
  const dfmt = new Intl.DateTimeFormat("ru-RU");

  const exportQs = new URLSearchParams();
  if (from) exportQs.set("from", from);
  if (to) exportQs.set("to", to);
  const movementsHref = `/api/export/movements${
    exportQs.toString() ? `?${exportQs}` : ""
  }`;

  const stats = [
    { label: t("sold"), value: formatNumber(soldUnits) },
    { label: t("revenue"), value: formatMoney(revenue) },
    { label: t("received"), value: formatNumber(receivedUnits) },
    { label: t("returned"), value: formatNumber(returnedUnits) },
  ];

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            render={<a href="/api/export/products" />}
          >
            <Download className="size-4" />
            {t("exportProducts")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            render={<a href={movementsHref} />}
          >
            <Download className="size-4" />
            {t("exportMovements")}
          </Button>
        </div>
      </div>

      {/* Фильтр по периоду (обычная GET-форма) */}
      <form className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="from">{t("from")}</Label>
          <Input id="from" type="date" name="from" defaultValue={from} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="to">{t("to")}</Label>
          <Input id="to" type="date" name="to" defaultValue={to} />
        </div>
        <Button type="submit">{t("apply")}</Button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tabular-nums">
                {s.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <section>
        <h2 className="mb-2 font-medium">{t("movements")}</h2>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("date")}</TableHead>
                <TableHead>{t("product")}</TableHead>
                <TableHead>{t("type")}</TableHead>
                <TableHead className="text-right">{t("quantity")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-muted-foreground py-8 text-center"
                  >
                    {t("empty")}
                  </TableCell>
                </TableRow>
              )}
              {movements.map((m, i) => (
                <TableRow key={i}>
                  <TableCell>{dfmt.format(new Date(m.date))}</TableCell>
                  <TableCell className="font-mono">
                    {m.products?.code ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={BADGE_VARIANT[m.type]}>
                      {typeLabel[m.type]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {m.type === "продажа" ? "−" : "+"}
                    {m.quantity}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </main>
  );
}
