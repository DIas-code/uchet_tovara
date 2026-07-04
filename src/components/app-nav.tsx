"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Package, Tags } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppNav({
  labels,
}: {
  labels: { products: string; categories: string; reports: string };
}) {
  const pathname = usePathname();

  const items = [
    { href: "/products", label: labels.products, Icon: Package },
    { href: "/categories", label: labels.categories, Icon: Tags },
    { href: "/reports", label: labels.reports, Icon: BarChart3 },
  ];

  return (
    <nav className="flex items-center gap-1 text-sm">
      {items.map(({ href, label, Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors",
              active
                ? "bg-muted text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
