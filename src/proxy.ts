import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// В Next.js 16 middleware.ts переименован в proxy.ts.
// Здесь обновляем сессию Supabase и защищаем приватные маршруты.
export default async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Все пути, кроме статики и файлов с расширением.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
