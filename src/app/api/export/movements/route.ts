import { createClient } from "@/lib/supabase/server";
import { toCsv } from "@/lib/csv";

// Экспорт операций (движений) за период в CSV.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const supabase = await createClient();
  let query = supabase
    .from("movements")
    .select("date, type, quantity, products(code, name)")
    .order("date", { ascending: false });
  if (from) query = query.gte("date", from);
  if (to) query = query.lte("date", to);

  const { data, error } = await query;
  if (error) return new Response(error.message, { status: 500 });

  const csv = toCsv(
    ["Дата", "Код", "Наименование", "Тип операции", "Количество"],
    (data ?? []).map((m) => {
      const product = m.products as unknown as {
        code: string;
        name: string | null;
      } | null;
      return [
        m.date,
        product?.code ?? "",
        product?.name ?? "",
        m.type,
        m.quantity,
      ];
    }),
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="operacii.csv"',
    },
  });
}
