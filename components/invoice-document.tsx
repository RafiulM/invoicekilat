"use client";

import { Company, InvoiceItem, TemplateId } from "@/lib/types";
import { formatIDR, formatDate } from "@/lib/utils";
import { TEMPLATES } from "@/lib/dummy-data";
import { useT, type Dict } from "@/lib/i18n";

type Doc = Dict["doc"];

export interface InvoiceView {
  number: string;
  templateId: TemplateId;
  company: Company;
  recipientName: string;
  recipientContact: string;
  recipientAddress: string;
  items: InvoiceItem[];
  signatureName: string;
  notes: string;
  issueDate: string;
  dueDate: string;
}

function subtotal(items: InvoiceItem[]) {
  return items.reduce((s, it) => s + it.quantity * it.price, 0);
}

const TAX_RATE = 0.11; // PPN 11%

export function computeTotals(items: InvoiceItem[]) {
  const sub = subtotal(items);
  const tax = Math.round(sub * TAX_RATE);
  return { sub, tax, total: sub + tax };
}

/** Renders the printable invoice. All colors inline (hex) so html2canvas PDF capture is exact. */
export function InvoiceDocument({ data }: { data: InvoiceView }) {
  const accent =
    TEMPLATES.find((tpl) => tpl.id === data.templateId)?.accent ?? "#4f46e5";
  const t = useT().doc;
  const common = { data, accent, t };

  switch (data.templateId) {
    case "klasik":
      return <Klasik {...common} />;
    case "minimalis":
      return <Minimalis {...common} />;
    case "profesional":
      return <Profesional {...common} />;
    default:
      return <Modern {...common} />;
  }
}

const ink = "#0f172a";
const sub = "#64748b";
const line = "#e2e8f0";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        aspectRatio: "1 / 1.414",
        background: "#ffffff",
        color: ink,
        fontFamily:
          "var(--font-geist-sans), system-ui, -apple-system, sans-serif",
        fontSize: 12,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

function Logo({ company, size = 48 }: { company: Company; size?: number }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: 12,
        background: company.logoColor,
        color: "#fff",
        fontWeight: 700,
        fontSize: size * 0.36,
        flexShrink: 0,
      }}
    >
      {company.logoText}
    </span>
  );
}

function ItemsTable({
  items,
  headBg,
  headColor,
  t,
}: {
  items: InvoiceItem[];
  accent: string;
  headBg: string;
  headColor: string;
  t: Doc;
}) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ background: headBg }}>
          <th style={{ ...th, color: headColor }}>{t.description}</th>
          <th style={{ ...th, color: headColor, textAlign: "center", width: 50 }}>
            {t.qty}
          </th>
          <th style={{ ...th, color: headColor, textAlign: "right", width: 120 }}>
            {t.price}
          </th>
          <th style={{ ...th, color: headColor, textAlign: "right", width: 130 }}>
            {t.amount}
          </th>
        </tr>
      </thead>
      <tbody>
        {items.map((it) => (
          <tr key={it.id} style={{ borderBottom: `1px solid ${line}` }}>
            <td style={td}>{it.description || "—"}</td>
            <td style={{ ...td, textAlign: "center" }}>{it.quantity}</td>
            <td style={{ ...td, textAlign: "right" }}>{formatIDR(it.price)}</td>
            <td style={{ ...td, textAlign: "right", fontWeight: 600 }}>
              {formatIDR(it.quantity * it.price)}
            </td>
          </tr>
        ))}
        {items.length === 0 && (
          <tr>
            <td style={{ ...td, color: sub }} colSpan={4}>
              {t.noItems}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "9px 12px",
  fontSize: 10,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};
const td: React.CSSProperties = { padding: "10px 12px", fontSize: 12 };

function Totals({ items, accent, t }: { items: InvoiceItem[]; accent: string; t: Doc }) {
  const { sub: s, tax, total } = computeTotals(items);
  return (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <div style={{ width: 260 }}>
        <Row label={t.subtotal} value={formatIDR(s)} />
        <Row label={t.tax} value={formatIDR(tax)} />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 8,
            paddingTop: 10,
            borderTop: `2px solid ${accent}`,
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 13 }}>{t.total}</span>
          <span style={{ fontWeight: 800, fontSize: 15, color: accent }}>
            {formatIDR(total)}
          </span>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "3px 0",
        color: sub,
        fontSize: 12,
      }}
    >
      <span>{label}</span>
      <span style={{ color: ink }}>{value}</span>
    </div>
  );
}

function Signature({ name, accent, t }: { name: string; accent: string; t: Doc }) {
  if (!name) return null;
  return (
    <div style={{ textAlign: "right" }}>
      <div style={{ fontSize: 11, color: sub, marginBottom: 6 }}>{t.regards}</div>
      <div
        style={{
          fontFamily: "'Segoe Script', 'Brush Script MT', cursive",
          fontSize: 26,
          color: accent,
          lineHeight: 1,
          marginBottom: 4,
        }}
      >
        {name}
      </div>
      <div
        style={{
          borderTop: `1px solid ${line}`,
          paddingTop: 4,
          fontSize: 11,
          fontWeight: 600,
        }}
      >
        {name}
      </div>
    </div>
  );
}

/* ---------------- MODERN ---------------- */
function Modern({ data, accent, t }: { data: InvoiceView; accent: string; t: Doc }) {
  const c = data.company;
  return (
    <Shell>
      <div style={{ background: accent, color: "#fff", padding: "26px 32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 48,
                height: 48,
                borderRadius: 12,
                background: "rgba(255,255,255,0.18)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 17,
              }}
            >
              {c.logoText}
            </span>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700 }}>{c.companyName}</div>
              <div style={{ fontSize: 11, opacity: 0.85, maxWidth: 260 }}>
                {c.companyAddress}
              </div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "0.02em" }}>
              INVOICE
            </div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>{data.number}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: "26px 32px", flex: 1, display: "flex", flexDirection: "column", gap: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 24 }}>
          <div>
            <Caption>{t.billedTo}</Caption>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{data.recipientName || "—"}</div>
            <div style={{ color: sub, fontSize: 11, maxWidth: 240 }}>{data.recipientAddress}</div>
            <div style={{ color: sub, fontSize: 11 }}>{data.recipientContact}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <MetaRow label={t.date} value={formatDate(data.issueDate)} />
            <MetaRow label={t.due} value={formatDate(data.dueDate)} />
            <MetaRow label={t.contactPerson} value={c.contactPerson} />
          </div>
        </div>

        <ItemsTable items={data.items} accent={accent} headBg={"#f1f5f9"} headColor={ink} t={t} />
        <Totals items={data.items} accent={accent} t={t} />

        <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24 }}>
          <div style={{ maxWidth: 260 }}>
            {data.notes && (
              <>
                <Caption>{t.notes}</Caption>
                <div style={{ color: sub, fontSize: 11 }}>{data.notes}</div>
              </>
            )}
          </div>
          <Signature name={data.signatureName} accent={accent} t={t} />
        </div>
      </div>
    </Shell>
  );
}

/* ---------------- KLASIK ---------------- */
function Klasik({ data, accent, t }: { data: InvoiceView; accent: string; t: Doc }) {
  const c = data.company;
  return (
    <Shell>
      <div style={{ padding: "32px 36px", flex: 1, display: "flex", flexDirection: "column", gap: 20, fontFamily: "Georgia, 'Times New Roman', serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: `3px double ${accent}`, paddingBottom: 16 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <Logo company={c} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{c.companyName}</div>
              <div style={{ fontSize: 11, color: sub, maxWidth: 280 }}>{c.companyAddress}</div>
              <div style={{ fontSize: 11, color: sub }}>{c.companyContact}</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: "0.12em", color: accent }}>
              INVOICE
            </div>
            <div style={{ fontSize: 12, color: sub }}>{t.no} {data.number}</div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", gap: 24 }}>
          <div>
            <Caption>{t.attn}</Caption>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{data.recipientName || "—"}</div>
            <div style={{ color: sub, fontSize: 11, maxWidth: 240 }}>{data.recipientAddress}</div>
            <div style={{ color: sub, fontSize: 11 }}>{data.recipientContact}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <MetaRow label={t.date} value={formatDate(data.issueDate)} />
            <MetaRow label={t.due} value={formatDate(data.dueDate)} />
          </div>
        </div>

        <ItemsTable items={data.items} accent={accent} headBg={accent} headColor={"#fff"} t={t} />
        <Totals items={data.items} accent={accent} t={t} />

        <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24 }}>
          <div style={{ maxWidth: 260 }}>
            {data.notes && (
              <>
                <Caption>{t.notes}</Caption>
                <div style={{ color: sub, fontSize: 11 }}>{data.notes}</div>
              </>
            )}
          </div>
          <Signature name={data.signatureName} accent={accent} t={t} />
        </div>
      </div>
    </Shell>
  );
}

/* ---------------- MINIMALIS ---------------- */
function Minimalis({ data, accent, t }: { data: InvoiceView; accent: string; t: Doc }) {
  const c = data.company;
  return (
    <Shell>
      <div style={{ padding: "40px 40px", flex: 1, display: "flex", flexDirection: "column", gap: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: sub }}>
              {t.invoice}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{data.number}</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{c.companyName}</span>
            <Logo company={c} size={36} />
          </div>
        </div>

        <div style={{ height: 1, background: line }} />

        <div style={{ display: "flex", justifyContent: "space-between", gap: 24 }}>
          <div>
            <Caption>{t.forLabel}</Caption>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{data.recipientName || "—"}</div>
            <div style={{ color: sub, fontSize: 11, maxWidth: 240 }}>{data.recipientAddress}</div>
            <div style={{ color: sub, fontSize: 11 }}>{data.recipientContact}</div>
          </div>
          <div style={{ textAlign: "right", color: sub, fontSize: 11 }}>
            <div>{t.date} — {formatDate(data.issueDate)}</div>
            <div>{t.due} — {formatDate(data.dueDate)}</div>
            <div style={{ marginTop: 6 }}>{c.companyContact}</div>
          </div>
        </div>

        <ItemsTable items={data.items} accent={accent} headBg={"#ffffff"} headColor={sub} t={t} />
        <Totals items={data.items} accent={accent} t={t} />

        <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24 }}>
          <div style={{ maxWidth: 260 }}>
            {data.notes && <div style={{ color: sub, fontSize: 11 }}>{data.notes}</div>}
          </div>
          <Signature name={data.signatureName} accent={accent} t={t} />
        </div>
      </div>
    </Shell>
  );
}

/* ---------------- PROFESIONAL ---------------- */
function Profesional({ data, accent, t }: { data: InvoiceView; accent: string; t: Doc }) {
  const c = data.company;
  return (
    <Shell>
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* sidebar band */}
        <div style={{ width: 8, background: accent }} />
        <div style={{ padding: "28px 30px", flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <Logo company={c} />
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{c.companyName}</div>
                <div style={{ fontSize: 11, color: sub }}>{c.companyContact}</div>
              </div>
            </div>
            <div
              style={{
                background: accent,
                color: "#fff",
                padding: "8px 16px",
                borderRadius: 8,
                textAlign: "right",
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: "0.08em" }}>INVOICE</div>
              <div style={{ fontSize: 11 }}>{data.number}</div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              background: "#f8fafc",
              border: `1px solid ${line}`,
              borderRadius: 10,
              padding: 16,
            }}
          >
            <div>
              <Caption>{t.billedTo}</Caption>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{data.recipientName || "—"}</div>
              <div style={{ color: sub, fontSize: 11 }}>{data.recipientAddress}</div>
              <div style={{ color: sub, fontSize: 11 }}>{data.recipientContact}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <MetaRow label={t.issueDate} value={formatDate(data.issueDate)} />
              <MetaRow label={t.due} value={formatDate(data.dueDate)} />
              <MetaRow label={t.issuedBy} value={c.contactPerson} />
            </div>
          </div>

          <ItemsTable items={data.items} accent={accent} headBg={"#1f2937"} headColor={"#fff"} t={t} />
          <Totals items={data.items} accent={accent} t={t} />

          <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24 }}>
            <div style={{ maxWidth: 260 }}>
              {data.notes && (
                <>
                  <Caption>{t.notes}</Caption>
                  <div style={{ color: sub, fontSize: 11 }}>{data.notes}</div>
                </>
              )}
            </div>
            <Signature name={data.signatureName} accent={accent} t={t} />
          </div>
        </div>
      </div>
    </Shell>
  );
}

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        color: sub,
        marginBottom: 4,
      }}
    >
      {children}
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ fontSize: 11, marginBottom: 2 }}>
      <span style={{ color: sub }}>{label}: </span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}
