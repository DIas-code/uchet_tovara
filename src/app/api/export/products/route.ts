import { createClient } from "@/lib/supabase/server";
import { toCsv } from "@/lib/csv";

// Экспорт товаров текущего бутика в CSV. RLS ограничивает выборку своим бутиком.
export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("code, name, category, stock, sale_price, purchase_price")
    .order("code", { ascending: true });

  if (error) return new Response(error.message, { status: 500 });

  const csv = toCsv(
    ["Код", "Наименование", "Категория", "Остаток", "Цена продажи", "Цена закупки"],
    (data ?? []).map((p) => [
      p.code,
      p.name ?? "",
      p.category ?? "",
      p.stock,
      p.sale_price,
      p.purchase_price ?? "",
    ]),
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="tovary.csv"',
    },
  });
}
