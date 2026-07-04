import { createClient } from "@/lib/supabase/server";
import { toCsv } from "@/lib/csv";

// Экспорт товаров текущего бутика в CSV. RLS ограничивает выборку своим бутиком.
export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("code, name, stock, sale_price, purchase_price, categories(name)")
    .order("code", { ascending: true });

  if (error) return new Response(error.message, { status: 500 });

  const csv = toCsv(
    ["Код", "Наименование", "Категория", "Остаток", "Цена продажи", "Цена закупки"],
    (data ?? []).map((p) => {
      const cat = p.categories as { name: string } | { name: string }[] | null;
      const categoryName = Array.isArray(cat)
        ? (cat[0]?.name ?? "")
        : (cat?.name ?? "");
      return [
        p.code,
        p.name ?? "",
        categoryName,
        p.stock,
        p.sale_price,
        p.purchase_price ?? "",
      ];
    }),
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="tovary.csv"',
    },
  });
}
