import { z } from "zod";

// Пустую строку/undefined превращаем в undefined (для необязательных чисел).
const emptyToUndef = (v: unknown) =>
  v === "" || v === null || v === undefined ? undefined : v;

// Схема товара. Значения приходят из формы строками — coerce приводит к числам.
export const productSchema = z.object({
  code: z.string().trim().min(1),
  name: z.string().trim().optional().default(""),
  categoryId: z.string().trim().optional().default(""),
  salePrice: z.coerce.number().min(0),
  purchasePrice: z.preprocess(emptyToUndef, z.coerce.number().min(0).optional()),
  initialStock: z.preprocess(
    emptyToUndef,
    z.coerce.number().int().min(0).optional(),
  ),
});

export type ProductInput = z.input<typeof productSchema>;
export type ProductParsed = z.output<typeof productSchema>;
