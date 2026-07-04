"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { createMovement } from "@/app/(app)/movements/actions";
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

type MoveType = "приход" | "продажа" | "возврат";
const TYPES: MoveType[] = ["приход", "продажа", "возврат"];

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function MovementDialog({
  productId,
  productCode,
  trigger,
  defaultType = "продажа",
}: {
  productId: string;
  productCode: string;
  trigger: React.ReactElement;
  defaultType?: MoveType;
}) {
  const t = useTranslations("movements");
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<MoveType>(defaultType);
  const [quantity, setQuantity] = useState("1");
  const [date, setDate] = useState(today);
  const [submitting, setSubmitting] = useState(false);

  const label: Record<MoveType, string> = {
    приход: t("receipt"),
    продажа: t("sale"),
    возврат: t("return"),
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const res = await createMovement({ productId, type, quantity, date });
    setSubmitting(false);
    if (res.ok) {
      toast.success(t("created"));
      setOpen(false);
      setQuantity("1");
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setType(defaultType);
          setDate(today());
        }
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t("add")} · <span className="font-mono">{productCode}</span>
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label>{t("type")}</Label>
            <div className="grid grid-cols-3 gap-2">
              {TYPES.map((ty) => (
                <Button
                  key={ty}
                  type="button"
                  variant={type === ty ? "default" : "outline"}
                  onClick={() => setType(ty)}
                >
                  {label[ty]}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="qty">{t("quantity")}</Label>
            <Input
              id="qty"
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="date">{t("date")}</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {t("add")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
