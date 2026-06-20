"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  FileAddIcon,
  Building02Icon,
  UserMultipleIcon,
  File01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { CompanySwitcher } from "./company-switcher";
import { LanguageSwitcher } from "./language-switcher";

const NAV = [
  { href: "/", key: "createInvoice", icon: FileAddIcon, exact: true },
  { href: "/companies", key: "companies", icon: Building02Icon, exact: false },
  { href: "/contacts", key: "contacts", icon: UserMultipleIcon, exact: false },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const t = useT();

  return (
    <aside className="hidden md:flex h-screen w-64 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--card)] sticky top-0">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)]">
          <HugeiconsIcon icon={File01Icon} size={18} />
        </span>
        <span className="text-[15px] font-bold tracking-tight">InvoiceKilat</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-[var(--accent)] text-[var(--primary)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              )}
            >
              <HugeiconsIcon icon={item.icon} size={18} />
              {t.nav[item.key]}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-[var(--border)] p-3">
        <LanguageSwitcher className="w-full justify-center" />
        <CompanySwitcher />
      </div>
    </aside>
  );
}

export function MobileBar() {
  const pathname = usePathname();
  const t = useT();
  return (
    <div className="md:hidden sticky top-0 z-30 flex items-center gap-2 overflow-x-auto border-b border-[var(--border)] bg-[var(--card)] px-3 py-2">
      <span className="flex items-center gap-2 pr-2 font-bold">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)]">
          <HugeiconsIcon icon={File01Icon} size={14} />
        </span>
      </span>
      {NAV.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium",
              active
                ? "bg-[var(--accent)] text-[var(--primary)]"
                : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
            )}
          >
            {t.nav[item.key]}
          </Link>
        );
      })}
    </div>
  );
}
