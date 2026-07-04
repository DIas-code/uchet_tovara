"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { deleteProduct } from "@/app/(app)/products/actions";
import { ProductDialog, type ProductForEdit } from "./product-dialog";
import type { Role } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ProductRowActions({
  product,
  role,
  categories,
}: {
  product: ProductForEdit & { stock: number };
  role: Role;
  categories: string[];
}) {
  const t = useTranslations("products");
  const tc = useTranslations("common");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function onDelete() {
    setDeleting(true);
    const res = await deleteProduct(product.id);
    setDeleting(false);
    if (res.ok) {
      toast.success(t("deleted"));
      setConfirmOpen(false);
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="flex justify-end gap-1">
      <ProductDialog
        product={product}
        role={role}
        categories={categories}
        trigger={
          <Button variant="ghost" size="icon" aria-label={t("edit")}>
            <Pencil className="size-4" />
          </Button>
        }
      />

      {role === "admin" && (
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogTrigger
            render={
              <Button variant="ghost" size="icon" aria-label={tc("delete")}>
                <Trash2 className="size-4" />
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("deleteTitle")}</DialogTitle>
            </DialogHeader>
            <p className="text-sm">{t("deleteConfirm", { code: product.code })}</p>
            <DialogFooter>
              <DialogClose
                render={<Button variant="outline">{tc("cancel")}</Button>}
              />
              <Button
                variant="destructive"
                onClick={onDelete}
                disabled={deleting}
              >
                {tc("delete")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
