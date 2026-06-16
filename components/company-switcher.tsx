"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon, UnfoldMoreIcon, PlusSignIcon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function CompanySwitcher() {
  const { companies, activeCompanyId, setActiveCompany } = useStore();
  const [open, setOpen] = useState(false);
  const active = companies.find((c) => c.id === activeCompanyId);
  const t = useT();

  if (!active) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-2 text-left hover:bg-[var(--muted)] transition-colors cursor-pointer"
      >
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
          style={{ background: active.logoColor }}
        >
          {active.logoText}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">
            {active.companyName}
          </span>
          <span className="block text-xs text-[var(--muted-foreground)]">
            {t.account.activeCompany}
          </span>
        </span>
        <HugeiconsIcon
          icon={UnfoldMoreIcon}
          size={16}
          className="shrink-0 text-[var(--muted-foreground)]"
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full z-20 mb-2 w-full overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] shadow-lg">
            <div className="px-3 py-2 text-xs font-medium text-[var(--muted-foreground)]">
              {t.account.switchCompany}
            </div>
            {companies.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setActiveCompany(c.id);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-[var(--muted)] cursor-pointer"
              >
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-bold text-white"
                  style={{ background: c.logoColor }}
                >
                  {c.logoText}
                </span>
                <span className="flex-1 truncate text-sm">{c.companyName}</span>
                {c.id === activeCompanyId && (
                  <HugeiconsIcon icon={Tick02Icon} size={15} className="text-[var(--primary)]" />
                )}
              </button>
            ))}
            <Link
              href="/companies"
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-2 border-t border-[var(--border)] px-3 py-2.5 text-sm font-medium text-[var(--primary)] hover:bg-[var(--muted)]"
              )}
            >
              <HugeiconsIcon icon={PlusSignIcon} size={15} /> {t.account.addCompany}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
