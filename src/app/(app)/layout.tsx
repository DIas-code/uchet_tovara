import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";
import { Toaster } from "@/components/ui/sonner";

// Layout для приватной части: требует входа и рисует шапку.
// Дополнительная защита поверх proxy.ts (на случай отсутствия профиля).
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppHeader user={user} />
      <div className="flex flex-1 flex-col">{children}</div>
      <Toaster />
    </div>
  );
}
