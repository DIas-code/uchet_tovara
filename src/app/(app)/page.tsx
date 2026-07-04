import { getTranslations } from "next-intl/server";
import { Boxes, Package, TriangleAlert, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatMoney, formatNumber } from "@/lib/format";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");

  const supabase = await createClient();
  const { data } = await supabase.from("products").select("stock, sale_price");
  const rows = (data ?? []) as { stock: number; sale_price: number | string }[];

  const totalProducts = rows.length;
  const totalUnits = rows.reduce((a, r) => a + Number(r.stock), 0);
  const inventoryValue = rows.reduce(
    (a, r) => a + Number(r.stock) * Number(r.sale_price),
    0,
  );
  const outOfStock = rows.filter((r) => Number(r.stock) === 0).length;

  const stats = [
    { label: t("totalProducts"), value: formatNumber(totalProducts), Icon: Package },
    { label: t("totalUnits"), value: formatNumber(totalUnits), Icon: Boxes },
    { label: t("inventoryValue"), value: formatMoney(inventoryValue), Icon: Wallet },
    { label: t("outOfStock"), value: formatNumber(outOfStock), Icon: TriangleAlert },
  ];

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {label}
              </CardTitle>
              <Icon className="text-muted-foreground size-4 shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tabular-nums">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
