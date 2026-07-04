"use client";

import { useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { ProductDialog } from "./product-dialog";
import type { Role } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ProductsToolbar({
  role,
  q,
  inStock,
  categories,
}: {
  role: Role;
  q: string;
  inStock: boolean;
  categories: string[];
}) {
  const t = useTranslations("products");
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  function onSearchChange(value: string) {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => setParam("q", value), 300);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        placeholder={t("search")}
        defaultValue={q}
        onChange={(e) => onSearchChange(e.target.value)}
        className="max-w-xs"
      />
      <label className="flex items-center gap-2 text-sm select-none">
        <input
          type="checkbox"
          defaultChecked={inStock}
          onChange={(e) => setParam("inStock", e.target.checked ? "1" : "")}
          className="size-4"
        />
        {t("inStock")}
      </label>
      <div className="ml-auto">
        <ProductDialog
          role={role}
          categories={categories}
          trigger={
            <Button>
              <Plus className="size-4" />
              {t("add")}
            </Button>
          }
        />
      </div>
    </div>
  );
}
