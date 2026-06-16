import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "default" | "green" | "amber" | "slate" | "indigo";

const tones: Record<Tone, string> = {
  default: "bg-[var(--muted)] text-[var(--muted-foreground)] border border-[var(--border)]",
  green: "bg-[#eaf3ec] text-[#1f6b43] border border-[#cfe6d6]",
  amber: "bg-[#f6efe2] text-[#8a6a1f] border border-[#e8dcc2]",
  slate: "bg-[#f1f0ec] text-[#8a857a] border border-[#e6e5dd]",
  indigo: "bg-[#1a1a1a] text-white border border-[#1a1a1a]",
};

export function Badge({
  tone = "default",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.06em]",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}

export function statusTone(status: string): Tone {
  if (status === "paid") return "green";
  if (status === "sent") return "indigo";
  return "slate";
}

export function statusLabel(status: string): string {
  if (status === "paid") return "Lunas";
  if (status === "sent") return "Terkirim";
  return "Draf";
}
