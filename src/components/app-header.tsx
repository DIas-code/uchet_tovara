import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BarChart3, LogOut, Package, Store } from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import type { CurrentUser } from "@/lib/auth";

// Шапка приложения: имя бутика, роль и кнопка выхода.
export async function AppHeader({ user }: { user: CurrentUser }) {
  const t = await getTranslations();
  const roleLabel = t(`roles.${user.role}`);

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
      <div className="flex items-center gap-4 sm:gap-6">
        <Link href="/" className="flex items-center gap-2">
          <Store className="size-5 shrink-0" />
          <span className="flex flex-col leading-tight">
            <span className="font-semibold">{user.boutiqueName}</span>
            <span className="text-muted-foreground text-xs">{roleLabel}</span>
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link
            href="/products"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
          >
            <Package className="size-4" />
            {t("nav.products")}
          </Link>
          <Link
            href="/reports"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
          >
            <BarChart3 className="size-4" />
            {t("nav.reports")}
          </Link>
        </nav>
      </div>
      <form action={signOut}>
        <Button type="submit" variant="outline" size="sm">
          <LogOut className="size-4" />
          {t("nav.logout")}
        </Button>
      </form>
    </header>
  );
}
