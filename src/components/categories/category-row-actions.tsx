"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import {
  deleteCategory,
  renameCategory,
} from "@/app/(app)/categories/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function CategoryRowActions({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const t = useTranslations("categories");
  const tc = useTranslations("common");
  const [renameOpen, setRenameOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [value, setValue] = useState(name);
  const [busy, setBusy] = useState(false);

  async function doRename(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await renameCategory(id, value);
    setBusy(false);
    if (res.ok) {
      toast.success(t("renamed"));
      setRenameOpen(false);
    } else {
      toast.error(res.error);
    }
  }

  async function doDelete() {
    setBusy(true);
    const res = await deleteCategory(id);
    setBusy(false);
    if (res.ok) {
      toast.success(t("deleted"));
      setConfirmOpen(false);
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="flex justify-end gap-1">
      <Dialog
        open={renameOpen}
        onOpenChange={(o) => {
          setRenameOpen(o);
          if (o) setValue(name);
        }}
      >
        <DialogTrigger
          render={
            <Button variant="ghost" size="icon" aria-label={t("rename")}>
              <Pencil className="size-4" />
            </Button>
          }
        />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("rename")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={doRename} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="cat-name">{t("name")}</Label>
              <Input
                id="cat-name"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={busy}>
                {tc("save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
          <p className="text-sm">{t("deleteConfirm", { name })}</p>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">{tc("cancel")}</Button>} />
            <Button variant="destructive" onClick={doDelete} disabled={busy}>
              {tc("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
