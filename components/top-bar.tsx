"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  FileAddIcon,
  Building02Icon,
  UserMultipleIcon,
  File01Icon,
  ArrowDown01Icon,
  Tick02Icon,
  PlusSignIcon,
  Logout01Icon,
  Login01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { useSession, signOut } from "@/lib/auth-client";
import { useT } from "@/lib/i18n";
import { LanguageSwitcher } from "./language-switcher";

const NAV = [
  { href: "/", key: "createInvoice", icon: FileAddIcon, exact: true },
  { href: "/companies", key: "companies", icon: Building02Icon, exact: false },
  { href: "/contacts", key: "contacts", icon: UserMultipleIcon, exact: false },
] as const;

export function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const qc = useQueryClient();
  const { data: session, isPending } = useSession();
  const { companies, activeCompanyId, setActiveCompany } = useStore();
  const [open, setOpen] = useState(false);
  const active = companies.find((c) => c.id === activeCompanyId);
  const t = useT();

  async function handleSignOut() {
    setOpen(false);
    await signOut();
    qc.clear();
    router.push("/sign-in");
    router.refresh();
  }

  // Logged-out: just a Masuk button (no company menu yet).
  if (!isPending && !session) {
    return (
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--card)]/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)]">
              <HugeiconsIcon icon={File01Icon} size={16} />
            </span>
            <span className="text-[15px] font-bold tracking-tight">
              InvoiceKilat
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-3.5 py-1.5 text-sm font-medium transition-colors hover:bg-[var(--muted)]"
            >
              <HugeiconsIcon icon={Login01Icon} size={15} /> {t.account.signIn}
            </Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--card)]/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)]">
            <HugeiconsIcon icon={File01Icon} size={16} />
          </span>
          <span className="text-[15px] font-bold tracking-tight">
            InvoiceKilat
          </span>
        </Link>

        <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <div className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] py-1 pl-1 pr-2.5 transition-colors hover:bg-[var(--muted)] cursor-pointer"
          >
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white"
              style={{ background: active?.logoColor ?? "#64748b" }}
            >
              {active?.logoText ?? "??"}
            </span>
            <span className="hidden max-w-[140px] truncate text-sm font-medium sm:block">
              {active?.companyName ?? t.account.menu}
            </span>
            <HugeiconsIcon icon={ArrowDown01Icon} size={15} className="text-[var(--muted-foreground)]" />
          </button>

          {open && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setOpen(false)}
              />
              <div className="absolute right-0 top-full z-20 mt-2 w-64 overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] shadow-lg">
                <div className="px-3 pb-1 pt-2.5 text-xs font-medium text-[var(--muted-foreground)]">
                  {t.account.navigation}
                </div>
                <nav className="px-1.5 pb-1.5">
                  {NAV.map((item) => {
                    const isActive = item.exact
                      ? pathname === item.href
                      : pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-[var(--accent)] text-[var(--primary)]"
                            : "text-[var(--foreground)] hover:bg-[var(--muted)]"
                        )}
                      >
                        <HugeiconsIcon icon={item.icon} size={16} />
                        {t.nav[item.key]}
                      </Link>
                    );
                  })}
                </nav>

                <div className="border-t border-[var(--border)] px-3 pb-1 pt-2.5 text-xs font-medium text-[var(--muted-foreground)]">
                  {t.account.switchCompany}
                </div>
                <div className="px-1.5 pb-1.5">
                  {companies.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setActiveCompany(c.id);
                        setOpen(false);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-[var(--muted)] cursor-pointer"
                    >
                      <span
                        className="flex h-6 w-6 items-center justify-center rounded-md text-[9px] font-bold text-white"
                        style={{ background: c.logoColor }}
                      >
                        {c.logoText}
                      </span>
                      <span className="flex-1 truncate text-sm">
                        {c.companyName}
                      </span>
                      {c.id === activeCompanyId && (
                        <HugeiconsIcon icon={Tick02Icon} size={14} className="text-[var(--primary)]" />
                      )}
                    </button>
                  ))}
                </div>
                <Link
                  href="/companies"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 border-t border-[var(--border)] px-3 py-2.5 text-sm font-medium text-[var(--primary)] transition-colors hover:bg-[var(--muted)]"
                >
                  <HugeiconsIcon icon={PlusSignIcon} size={15} /> {t.account.addCompany}
                </Link>

                {session?.user && (
                  <div className="flex items-center gap-2 border-t border-[var(--border)] px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {session.user.name || session.user.email}
                      </div>
                      <div className="truncate text-xs text-[var(--muted-foreground)]">
                        {session.user.email}
                      </div>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-[var(--muted)] cursor-pointer"
                    >
                      <HugeiconsIcon icon={Logout01Icon} size={15} /> {t.account.signOut}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        </div>
      </div>
    </header>
  );
}
