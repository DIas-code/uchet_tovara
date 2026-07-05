"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import {
  importProducts,
  type ImportResult,
} from "@/app/(app)/products/import-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ImportDialog() {
  const t = useTranslations("import");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setResult(null);
    const text = await file.text();
    const res = await importProducts(text);
    setBusy(false);
    setResult(res);
    if (res.ok) {
      toast.success(t("done", { added: res.added, skipped: res.skipped }));
    } else {
      toast.error(res.error ?? t("failed"));
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setResult(null);
      }}
    >
      <DialogTrigger
        render={
          <Button variant="outline">
            <Upload className="size-4" />
            {t("button")}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 text-sm">
          <p className="text-muted-foreground">{t("hint")}</p>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={onFile}
            disabled={busy}
            className="text-sm"
          />
          {busy && <p className="text-muted-foreground">{t("processing")}</p>}
          {result?.ok && (
            <div className="rounded-md border p-3">
              <p>
                {t("added")}: <b>{result.added}</b> · {t("skipped")}:{" "}
                <b>{result.skipped}</b>
              </p>
              {result.errors.length > 0 && (
                <ul className="text-destructive mt-2 list-disc pl-5">
                  {result.errors.slice(0, 20).map((er, i) => (
                    <li key={i}>
                      {t("rowLabel")} {er.row}: {er.message}
                    </li>
                  ))}
                  {result.errors.length > 20 && <li>…</li>}
                </ul>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
