"use client";

import { useLang, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const OPTIONS: { value: Lang; label: string }[] = [
  { value: "id", label: "ID" },
  { value: "en", label: "EN" },
];

/** Compact ID / EN toggle, persisted via the language context. */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang } = useLang();

  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border border-[var(--border)] bg-[var(--card)] p-0.5",
        className
      )}
    >
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          onClick={() => setLang(o.value)}
          aria-pressed={lang === o.value}
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-semibold transition-colors cursor-pointer",
            lang === o.value
              ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
