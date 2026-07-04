import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import type { CurrentUser } from "@/lib/auth";

// Шапка приложения: имя бутика, роль и кнопка выхода.
export async function AppHeader({ user }: { user: CurrentUser }) {
  const t = await getTranslations();
  const roleLabel = t(`roles.${user.role}`);

  return (
    <header className="flex items-center justify-between border-b px-4 py-3">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex flex-col leading-tight">
          <span className="font-semibold">{user.boutiqueName}</span>
          <span className="text-muted-foreground text-xs">{roleLabel}</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/products" className="hover:underline">
            {t("nav.products")}
          </Link>
        </nav>
      </div>
      <form action={signOut}>
        <Button type="submit" variant="outline" size="sm">
          {t("nav.logout")}
        </Button>
      </form>
    </header>
  );
}
