"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { createCategory } from "@/app/(app)/categories/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AddCategory() {
  const t = useTranslations("categories");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    const res = await createCategory(name);
    setBusy(false);
    if (res.ok) {
      toast.success(t("added"));
      setName("");
    } else {
      toast.error(res.error);
    }
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t("namePlaceholder")}
        className="max-w-xs"
      />
      <Button type="submit" disabled={busy}>
        <Plus className="size-4" />
        {t("add")}
      </Button>
    </form>
  );
}
