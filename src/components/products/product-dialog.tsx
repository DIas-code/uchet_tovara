"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  createProduct,
  updateProduct,
} from "@/app/(app)/products/actions";
import type { Role } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export type ProductForEdit = {
  id: string;
  code: string;
  name: string | null;
  category: string | null;
  sale_price: number;
  purchase_price: number | null;
};

type FormValues = {
  code: string;
  name: string;
  category: string;
  salePrice: string;
  purchasePrice: string;
  initialStock: string;
};

export function ProductDialog({
  product,
  role,
  trigger,
}: {
  product?: ProductForEdit;
  role: Role;
  trigger: React.ReactElement;
}) {
  const t = useTranslations("products");
  const [open, setOpen] = useState(false);
  const isEdit = !!product;
  const canPrice = role === "admin";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      code: product?.code ?? "",
      name: product?.name ?? "",
      category: product?.category ?? "",
      salePrice: product ? String(product.sale_price) : "",
      purchasePrice:
        product?.purchase_price != null ? String(product.purchase_price) : "",
      initialStock: "",
    },
  });

  async function onSubmit(values: FormValues) {
    const res = isEdit
      ? await updateProduct(product!.id, values)
      : await createProduct(values);

    if (res.ok) {
      toast.success(isEdit ? t("updated") : t("created"));
      setOpen(false);
      if (!isEdit) reset();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? t("edit") : t("add")}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="grid gap-2">
            <Label htmlFor="code">{t("code")}</Label>
            <Input id="code" {...register("code", { required: true })} />
            {errors.code && (
              <p className="text-destructive text-xs">{t("required")}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="name">{t("name")}</Label>
            <Input id="name" {...register("name")} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category">{t("category")}</Label>
            <Input id="category" {...register("category")} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="salePrice">{t("salePrice")}</Label>
            <Input
              id="salePrice"
              type="number"
              step="0.01"
              min="0"
              disabled={!canPrice}
              {...register("salePrice", { required: canPrice })}
            />
            {errors.salePrice && (
              <p className="text-destructive text-xs">{t("required")}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="purchasePrice">{t("purchasePrice")}</Label>
            <Input
              id="purchasePrice"
              type="number"
              step="0.01"
              min="0"
              disabled={!canPrice}
              {...register("purchasePrice")}
            />
          </div>

          {!isEdit && (
            <div className="grid gap-2">
              <Label htmlFor="initialStock">{t("initialStock")}</Label>
              <Input
                id="initialStock"
                type="number"
                step="1"
                min="0"
                {...register("initialStock")}
              />
            </div>
          )}

          {!canPrice && (
            <p className="text-muted-foreground text-xs">{t("priceAdminOnly")}</p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
