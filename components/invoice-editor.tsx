"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Invoice01Icon,
  Layout01Icon,
  DollarCircleIcon,
  PaintBoardIcon,
  Edit02Icon,
  ViewIcon,
  Download04Icon,
  FloppyDiskIcon,
  Loading03Icon,
  Tick02Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons";
import { uid, formatIDR, formatDate } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { useActiveCompany } from "@/components/providers";
import {
  useCompanies,
  useContacts,
  useCreateInvoice,
  useInvoices,
  useDeleteInvoice,
} from "@/lib/hooks";
import { useSession } from "@/lib/auth-client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Company, Contact, Invoice, TemplateId } from "@/lib/types";
import type { InvoiceInput } from "@/lib/api-client";

type IconType = React.ComponentProps<typeof HugeiconsIcon>["icon"];

/* ---------------------------------------------------------------------------
   Interactive invoice editor — recreated from the Claude Design handoff
   (Invoice.dc.html). Three live templates (Minimal / Classic / Bold), USD/IDR
   currency switch, accent picker, sender/recipient pickers, live totals, and
   print-to-PDF. Everything is editable inline on the "paper".

   Rendered both on the home page (blank, create mode) and on /invoice/[id]
   (prefilled from a saved invoice). The control panel always lists the saved
   invoices so you can jump between them.
--------------------------------------------------------------------------- */

const SG = "var(--font-schibsted), system-ui, sans-serif";
const JM = "var(--font-jetbrains), monospace";

interface Party {
  name: string;
  line1: string;
  line2: string;
  email: string;
  phone?: string;
}
interface Item {
  id: string;
  description: string;
  qty: string;
  rate: string;
}

const SENDERS: Party[] = [
  {
    name: "Studio Avela",
    email: "hello@studioavela.com",
    phone: "+1 (917) 555‑0148",
    line1: "120 Mercer Street",
    line2: "Brooklyn, NY 11201",
  },
  {
    name: "Avela Labs, LLC",
    email: "billing@avelalabs.com",
    phone: "+1 (415) 555‑0110",
    line1: "500 Howard Street, Fl 4",
    line2: "San Francisco, CA 94105",
  },
  {
    name: "Maru Studio",
    email: "studio@maru.design",
    phone: "+62 21 5550 9914",
    line1: "Jl. Senopati No. 72",
    line2: "Jakarta 12190, ID",
  },
];

const CLIENTS: Party[] = [
  {
    name: "Northwind Collective",
    email: "accounts@northwind.co",
    line1: "88 Harbour Road, Suite 300",
    line2: "San Francisco, CA 94107",
  },
  {
    name: "Lumen Health, Inc.",
    email: "ap@lumenhealth.com",
    line1: "1450 Biscayne Blvd",
    line2: "Miami, FL 33132",
  },
  {
    name: "Orbit Studios",
    email: "finance@orbit.studio",
    line1: "24 Rivington Street",
    line2: "London EC2A 3DU, UK",
  },
  {
    name: "Ferme & Co.",
    email: "hello@fermeco.id",
    line1: "Jl. Kemang Raya 18",
    line2: "Jakarta 12730, ID",
  },
];

const SWATCHES = [
  "#1a1a1a",
  "#2a6fdb",
  "#0e8a7a",
  "#1f8a5b",
  "#7257d6",
  "#d97757",
  "#c0395b",
];

type TemplateKey = "minimal" | "classic" | "bold";
type Currency = "USD" | "IDR";

interface State {
  template: TemplateKey;
  preview: boolean;
  accent: string | null;
  menu: "sender" | "client" | null;
  currency: Currency;
  companyId: string | null; // issuer company FK for saving to the backend
  logoUrl: string | null; // issuer logo image (from the selected company)
  biz: Party;
  meta: { number: string; issued: string; due: string };
  billTo: Party;
  items: Item[];
  discount: string;
  taxRate: string;
  terms: string;
  bank: { name: string; account: string; routing: string; swift: string };
  notes: string;
}

const INITIAL: State = {
  template: "minimal",
  companyId: null,
  logoUrl: null,
  preview: false,
  accent: null,
  menu: null,
  currency: "USD",
  biz: {
    name: "Studio Avela",
    email: "hello@studioavela.com",
    phone: "+1 (917) 555‑0148",
    line1: "120 Mercer Street",
    line2: "Brooklyn, NY 11201",
  },
  meta: {
    number: "INV‑2026‑014",
    issued: "Jun 16, 2026",
    due: "Jun 30, 2026",
  },
  billTo: {
    name: "Northwind Collective",
    line1: "88 Harbour Road, Suite 300",
    line2: "San Francisco, CA 94107",
    email: "accounts@northwind.co",
  },
  items: [
    {
      id: uid("it"),
      description: "Brand identity system — logo, type & color",
      qty: "1",
      rate: "4200",
    },
    {
      id: uid("it"),
      description: "Marketing website design (8 pages)",
      qty: "1",
      rate: "5600",
    },
    { id: uid("it"), description: "Design consulting", qty: "6", rate: "150" },
  ],
  discount: "500",
  taxRate: "0",
  terms: "Net 14 — due by Jun 30, 2026",
  bank: {
    name: "First Republic Bank",
    account: "•••• 4821",
    routing: "021000021",
    swift: "FRBBUS6S",
  },
  notes:
    "Thank you for your business! Payment is due within 14 days of the issue date. Late payments are subject to a 1.5% monthly service fee.",
};

function themeVars(t: TemplateKey): Record<string, string> {
  const minimal: Record<string, string> = {
    "--page-bg": "#f4f4f2",
    "--paper-bg": "#ffffff",
    "--body-font": SG,
    "--title-font": SG,
    "--label-font": JM,
    "--num-font": JM,
    "--ink": "#1a1a1a",
    "--muted": "#6b6b63",
    "--label": "#9a9a93",
    "--line-strong": "#1a1a1a",
    "--line-soft": "#f0f0ec",
    "--field-hover": "#f5f5f3",
    "--field-focus": "#e4e4de",
    "--head-bg": "transparent",
    "--head-ink": "#1a1a1a",
    "--head-muted": "#6b6b63",
    "--head-label": "#9a9a93",
    "--head-pad": "0",
    "--head-radius": "0",
    "--head-border-bottom": "none",
    "--head-field-hover": "#f5f5f3",
    "--head-field-focus": "#e4e4de",
    "--logo-bg":
      "repeating-linear-gradient(45deg,#f3f3f0,#f3f3f0 6px,#fafafa 6px,#fafafa 12px)",
    "--logo-border": "#e6e6e1",
    "--logo-ink": "#b3b3ab",
    "--tick-display": "block",
    "--title-size": "36px",
    "--title-weight": "300",
    "--title-spacing": ".2em",
    "--title-color": "#1a1a1a",
    "--total-bg": "transparent",
    "--total-pad": "13px 0 0",
    "--total-radius": "0",
    "--total-border-top": "1px solid #1a1a1a",
    "--total-label": "#1a1a1a",
    "--total-value": "var(--accent)",
    "--total-value-size": "20px",
  };
  if (t === "classic") {
    return {
      ...minimal,
      "--page-bg": "#efece3",
      "--paper-bg": "#fffdf7",
      "--body-font": "var(--font-source-serif), Georgia, serif",
      "--title-font": "var(--font-source-serif), Georgia, serif",
      "--label-font": "var(--font-source-serif), Georgia, serif",
      "--num-font": "var(--font-source-serif), Georgia, serif",
      "--ink": "#222019",
      "--muted": "#5a564c",
      "--label": "#908b7e",
      "--line-strong": "#222019",
      "--line-soft": "#e7e3d8",
      "--field-hover": "#f6f4ee",
      "--field-focus": "#e0dccf",
      "--head-ink": "#222019",
      "--head-muted": "#5a564c",
      "--head-label": "#908b7e",
      "--head-pad": "0 0 24px",
      "--head-border-bottom": "1px solid #222019",
      "--head-field-hover": "#f6f4ee",
      "--head-field-focus": "#e0dccf",
      "--logo-bg":
        "repeating-linear-gradient(45deg,#f1efe7,#f1efe7 6px,#faf8f2 6px,#faf8f2 12px)",
      "--logo-border": "#ddd8c9",
      "--logo-ink": "#b3ad9c",
      "--tick-display": "none",
      "--title-size": "32px",
      "--title-weight": "400",
      "--title-spacing": ".3em",
      "--title-color": "#222019",
      "--total-border-top": "2px solid #222019",
      "--total-label": "#222019",
      "--total-value-size": "21px",
    };
  }
  if (t === "bold") {
    return {
      ...minimal,
      "--page-bg": "#eeeeec",
      "--head-bg": "var(--accent)",
      "--head-ink": "#ffffff",
      "--head-muted": "rgba(255,255,255,.82)",
      "--head-label": "rgba(255,255,255,.7)",
      "--head-pad": "32px 34px",
      "--head-radius": "12px",
      "--head-field-hover": "rgba(255,255,255,.16)",
      "--head-field-focus": "rgba(255,255,255,.45)",
      "--logo-bg": "rgba(255,255,255,.12)",
      "--logo-border": "rgba(255,255,255,.32)",
      "--logo-ink": "rgba(255,255,255,.85)",
      "--tick-display": "none",
      "--title-size": "40px",
      "--title-weight": "600",
      "--title-spacing": ".02em",
      "--title-color": "#ffffff",
      "--total-bg": "var(--accent)",
      "--total-pad": "16px 20px",
      "--total-radius": "12px",
      "--total-border-top": "none",
      "--total-label": "#ffffff",
      "--total-value": "#ffffff",
      "--total-value-size": "22px",
    };
  }
  return minimal;
}

function num(v: string) {
  return parseFloat(String(v).replace(/,/g, "")) || 0;
}

// shared field base for inline-editable inputs
function field(extra: CSSProperties): CSSProperties {
  return {
    width: "100%",
    border: 0,
    background: "transparent",
    borderRadius: 6,
    outline: "none",
    ...extra,
  };
}

// Editor template keys -> backend template ids.
const TEMPLATE_MAP: Record<TemplateKey, TemplateId> = {
  minimal: "minimalis",
  classic: "klasik",
  bold: "modern",
};

// Backend template ids -> editor keys (reverse of TEMPLATE_MAP). Unknown ids
// (e.g. "profesional", which has no editor variant) fall back to minimal.
const TEMPLATE_KEY: Record<string, TemplateKey> = {
  minimalis: "minimal",
  klasik: "classic",
  modern: "bold",
};

// Companies/contacts store contact as "email · phone"; split into a Party.
function splitContact(s: string): { email: string; phone: string } {
  const parts = (s || "")
    .split(/[·|]/)
    .map((x) => x.trim())
    .filter(Boolean);
  const email = parts.find((p) => p.includes("@")) ?? parts[0] ?? "";
  const phone = parts.find((p) => p !== email) ?? "";
  return { email, phone };
}
function companyToParty(c: Company): Party {
  const { email, phone } = splitContact(c.companyContact);
  return { name: c.companyName, line1: c.companyAddress, line2: "", email, phone };
}
function contactToParty(c: Contact): Party {
  const { email, phone } = splitContact(c.contactInfo);
  return { name: c.companyName, line1: c.address, line2: "", email, phone };
}
function parseDate(value: string): string {
  const d = new Date(value);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

// Recipient address is saved as "line1, line2"; best-effort split back so the
// two address inputs prefill cleanly when loading a saved invoice.
function splitAddress(s: string): { line1: string; line2: string } {
  const parts = (s || "").split(", ");
  if (parts.length <= 1) return { line1: s || "", line2: "" };
  return { line1: parts[0], line2: parts.slice(1).join(", ") };
}

// ISO date -> the freeform "Jun 16, 2026" string the editor shows.
function formatEditorDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Reconstruct editor state from a saved invoice. Fields the invoice model does
// not persist (discount, tax, terms, bank, currency, accent) reset to defaults.
function stateFromInvoice(inv: Invoice, companies: Company[]): State {
  const company = companies.find((c) => c.id === inv.companyId) ?? null;
  const biz: Party = company
    ? companyToParty(company)
    : { name: inv.signatureName || "", line1: "", line2: "", email: "", phone: "" };
  const { email } = splitContact(inv.recipientContact);
  const { line1, line2 } = splitAddress(inv.recipientAddress);
  return {
    ...INITIAL,
    template: TEMPLATE_KEY[inv.templateId] ?? "minimal",
    companyId: inv.companyId,
    logoUrl: company?.logoUrl ?? null,
    biz,
    meta: {
      number: inv.number,
      issued: formatEditorDate(inv.issueDate),
      due: formatEditorDate(inv.dueDate),
    },
    billTo: { name: inv.recipientName, line1, line2, email },
    items: inv.items.length
      ? inv.items.map((it) => ({
          id: it.id,
          description: it.description,
          qty: String(it.quantity),
          rate: String(it.price),
        }))
      : INITIAL.items,
    discount: "0",
    taxRate: "0",
    notes: inv.notes ?? "",
  };
}

export function InvoiceEditor({ invoice }: { invoice?: Invoice }) {
  const [s, setS] = useState<State>(INITIAL);
  const t = useT();
  const router = useRouter();

  // --- backend wiring ------------------------------------------------------
  const { activeCompanyId } = useActiveCompany();
  const { data: session } = useSession();
  const companiesQ = useCompanies();
  const contactsQ = useContacts();
  const invoicesQ = useInvoices();
  const companies = useMemo(() => companiesQ.data ?? [], [companiesQ.data]);
  const contacts = useMemo(() => contactsQ.data ?? [], [contactsQ.data]);
  const invoices = useMemo(() => invoicesQ.data ?? [], [invoicesQ.data]);
  const createInvoice = useCreateInvoice();
  const deleteInvoice = useDeleteInvoice();
  const [saved, setSaved] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<Invoice | null>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfErr, setPdfErr] = useState<string | null>(null);

  // "Choose" menus use real saved companies/contacts, falling back to the
  // demo data when there's nothing yet (or when logged out).
  const senderOptions: {
    id: string | null;
    party: Party;
    logoUrl: string | null;
  }[] = companies.length
    ? companies.map((c) => ({
        id: c.id,
        party: companyToParty(c),
        logoUrl: c.logoUrl ?? null,
      }))
    : SENDERS.map((p) => ({ id: null, party: p, logoUrl: null }));
  const clientOptions: { party: Party }[] = contacts.length
    ? contacts.map((c) => ({ party: contactToParty(c) }))
    : CLIENTS.map((p) => ({ party: p }));

  // Prefill once data loads: from the saved invoice when editing one, otherwise
  // from the active company (create mode).
  const didPrefill = useRef(false);
  useEffect(() => {
    if (didPrefill.current || companiesQ.isLoading) return;

    if (invoice) {
      didPrefill.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setS(stateFromInvoice(invoice, companies));
      return;
    }

    if (!companies.length) return;
    const c = companies.find((x) => x.id === activeCompanyId) ?? companies[0];
    if (!c) return;
    didPrefill.current = true;
    setS((p) => ({
      ...p,
      companyId: c.id,
      biz: companyToParty(c),
      logoUrl: c.logoUrl ?? null,
    }));
  }, [companies, companiesQ.isLoading, activeCompanyId, invoice]);

  const acc = s.accent || "#1a1a1a";
  const symbol = s.currency === "IDR" ? "Rp" : "$";

  function fmt(n: number) {
    n = n || 0;
    if (s.currency === "IDR") {
      return (
        "Rp " +
        new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(
          Math.round(n)
        )
      );
    }
    return (
      "$" +
      new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(n)
    );
  }

  // updaters
  const upd =
    <K extends "biz" | "meta" | "billTo" | "bank">(
      group: K,
      key: keyof State[K]
    ) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setS((p) => ({ ...p, [group]: { ...p[group], [key]: v } }));
    };
  const updScalar =
    (key: "discount" | "taxRate" | "terms" | "notes") =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const v = e.target.value;
      setS((p) => ({ ...p, [key]: v }));
    };
  const updItem =
    (i: number, key: keyof Item) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setS((p) => {
        const items = p.items.slice();
        items[i] = { ...items[i], [key]: v };
        return { ...p, items };
      });
    };
  const removeItem = (i: number) =>
    setS((p) => ({
      ...p,
      items: p.items.length > 1 ? p.items.filter((_, j) => j !== i) : p.items,
    }));
  const addItem = () =>
    setS((p) => ({
      ...p,
      items: [...p.items, { id: uid("it"), description: "", qty: "1", rate: "0" }],
    }));
  const setAccent = (c: string) => setS((p) => ({ ...p, accent: c }));
  const toggleMenu = (which: "sender" | "client") =>
    setS((p) => ({ ...p, menu: p.menu === which ? null : which }));
  const closeMenu = () => setS((p) => ({ ...p, menu: null }));
  const applySender = (
    c: Party,
    companyId: string | null,
    logoUrl: string | null
  ) =>
    setS((p) => ({
      ...p,
      companyId: companyId ?? p.companyId,
      logoUrl,
      biz: {
        name: c.name,
        email: c.email,
        phone: c.phone ?? "",
        line1: c.line1,
        line2: c.line2,
      },
      menu: null,
    }));
  const applyClient = (c: Party) =>
    setS((p) => ({
      ...p,
      billTo: { name: c.name, email: c.email, line1: c.line1, line2: c.line2 },
      menu: null,
    }));

  // totals
  const subtotal = s.items.reduce((a, it) => a + num(it.qty) * num(it.rate), 0);
  const discountVal = num(s.discount);
  const taxable = Math.max(0, subtotal - discountVal);
  const taxVal = (taxable * num(s.taxRate)) / 100;
  const total = taxable + taxVal;

  // --- save invoice to backend ---------------------------------------------
  const canSave = !!session && !!s.companyId && !createInvoice.isPending;

  async function handleSave() {
    if (!s.companyId) return;
    setSaveErr(null);
    const payload: InvoiceInput = {
      number: s.meta.number?.startsWith("INV-") ? s.meta.number : "",
      companyId: s.companyId,
      templateId: TEMPLATE_MAP[s.template],
      recipientName: s.billTo.name,
      recipientContact: [s.billTo.email, s.billTo.phone]
        .filter(Boolean)
        .join(" · "),
      recipientAddress: [s.billTo.line1, s.billTo.line2]
        .filter(Boolean)
        .join(", "),
      items: s.items.map((it) => ({
        id: it.id,
        description: it.description,
        quantity: Math.max(0, Math.round(num(it.qty))),
        price: Math.max(0, Math.round(num(it.rate))),
      })),
      totalAmount: Math.round(total),
      signatureName: s.biz.name,
      notes: s.notes,
      status: "draft",
      issueDate: parseDate(s.meta.issued),
      dueDate: parseDate(s.meta.due),
    };
    try {
      const created = await createInvoice.mutateAsync(payload);
      setS((p) => ({ ...p, meta: { ...p.meta, number: created.number } }));
      setSavedId(created.id);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : t.editor.saveError);
    }
  }

  // --- export the live paper to a real PDF (no browser print dialog) --------
  async function handleDownloadPdf() {
    const node = paperRef.current;
    if (!node || pdfBusy) return;
    setPdfErr(null);
    setPdfBusy(true);
    try {
      // client-only libs — load on demand so they never hit the server bundle
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);
      // make sure the web fonts are ready before we rasterize
      if (document.fonts?.ready) await document.fonts.ready;

      const paperBg = getComputedStyle(node).backgroundColor || "#ffffff";
      const canvas = await html2canvas(node, {
        scale: 2,
        backgroundColor: paperBg,
        useCORS: true,
        logging: false,
        // render a clean, edit-affordance-free copy of the paper
        onclone: (doc) => {
          doc.querySelector(".invoice-app")?.classList.add("preview");
          // html2canvas mis-renders text inside native <input>/<textarea> — it
          // clips form-control values mid-glyph. Swap each control for a static
          // <div> that carries the SAME author inline styles + class, so it
          // occupies the identical grid/flex box (width:100%/168px, padding,
          // negative margins, text-align all preserved) but renders as plain,
          // fully-visible text the rasterizer can measure. Copy the author CSS,
          // never getComputedStyle's resolved px — those break the responsive
          // grid when the clone renders at a different width.
          const liveInputs = node.querySelectorAll<
            HTMLInputElement | HTMLTextAreaElement
          >("input, textarea");
          // Scope the clone query to the paper too; the full document clone
          // contains the editor panel's inputs, which would break index-align.
          const cloneInputs =
            doc
              .querySelector("[data-paper]")
              ?.querySelectorAll<HTMLElement>("input, textarea") ?? [];
          liveInputs.forEach((el, i) => {
            const c = cloneInputs[i];
            if (!c) return;
            const div = doc.createElement("div");
            div.className = el.className;
            div.style.cssText = el.style.cssText;
            div.style.whiteSpace =
              el.tagName === "TEXTAREA" ? "pre-wrap" : "normal";
            div.style.overflow = "visible";
            div.style.wordBreak = "break-word";
            div.textContent = el.value;
            c.replaceWith(div);
          });
        },
      });

      const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgData = canvas.toDataURL("image/png");

      // Fit the whole invoice onto a single A4 page: fill the width, but if that
      // would overflow the page height, scale down uniformly so it still fits in
      // one page (centered horizontally). Invoices are meant to be one page.
      let imgW = pageW;
      let imgH = (canvas.height * imgW) / canvas.width;
      if (imgH > pageH) {
        imgW *= pageH / imgH;
        imgH = pageH;
      }
      const x = (pageW - imgW) / 2;
      pdf.addImage(imgData, "PNG", x, 0, imgW, imgH);

      const name = (s.meta.number || "invoice").replace(/[^\w.-]+/g, "-");
      pdf.save(`${name}.pdf`);
    } catch (e) {
      setPdfErr(e instanceof Error ? e.message : t.editor.pdfError);
    } finally {
      setPdfBusy(false);
    }
  }

  const vars = themeVars(s.template);
  const rootStyle = {
    ...vars,
    "--accent": acc,
    "--pad": "56px",
    minHeight: "calc(100vh - 3.5rem)",
    background: "var(--page-bg)",
    color: "var(--ink)",
    padding: "28px 18px 80px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 18,
  } as unknown as CSSProperties;

  // segmented-control button (fills its group evenly)
  const seg = (active: boolean): CSSProperties => ({
    flex: 1,
    border: 0,
    cursor: "pointer",
    borderRadius: 8,
    padding: "7px 10px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    fontWeight: 500,
    fontSize: 13,
    fontFamily: SG,
    transition: "all .15s",
    ...(active
      ? { background: "#1a1a1a", color: "#fff" }
      : { background: "transparent", color: "#6b6b63" }),
  });
  const segGroup: CSSProperties = {
    display: "flex",
    width: "100%",
    background: "#f1f0ec",
    borderRadius: 10,
    padding: 3,
    gap: 3,
  };
  // panel chrome
  const panelCard: CSSProperties = {
    width: "100%",
    background: "#fff",
    border: "1px solid #ececec",
    borderRadius: 14,
    boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 16px 40px -22px rgba(0,0,0,.22)",
    padding: 16,
    fontFamily: SG,
  };
  const groupLabel: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 7,
    marginBottom: 9,
    fontFamily: JM,
    fontSize: 11,
    lineHeight: 1,
    letterSpacing: ".1em",
    textTransform: "uppercase",
    color: "#9a9a93",
  };
  const group = (icon: IconType, label: string, node: React.ReactNode) => (
    <div>
      <div style={groupLabel}>
        <HugeiconsIcon icon={icon} size={14} color="#9a9a93" strokeWidth={2} />
        <span>{label}</span>
      </div>
      {node}
    </div>
  );
  const colLabel: CSSProperties = {
    fontWeight: 500,
    fontSize: 11,
    lineHeight: 1,
    fontFamily: "var(--label-font)",
    letterSpacing: ".1em",
    textTransform: "uppercase",
    color: "var(--label)",
  };
  const menuCard: CSSProperties = {
    background: "#fff",
    border: "1px solid #ececec",
    borderRadius: 12,
    boxShadow: "0 10px 30px -8px rgba(0,0,0,.24)",
    padding: 6,
    zIndex: 46,
    display: "flex",
    flexDirection: "column",
    gap: 1,
  };
  const menuItem: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    alignItems: "flex-start",
    width: "100%",
    textAlign: "left",
    border: 0,
    background: "transparent",
    padding: "10px 11px",
    cursor: "pointer",
    borderRadius: 8,
  };
  const chooseBtn: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    border: "1px solid var(--field-focus, #e4e4de)",
    background: "var(--paper-bg, #fff)",
    color: "var(--muted)",
    fontWeight: 500,
    fontSize: 10,
    lineHeight: 1,
    fontFamily: JM,
    letterSpacing: ".06em",
    textTransform: "uppercase",
    padding: "5px 8px",
    borderRadius: 7,
    cursor: "pointer",
  };

  return (
    <>
    <div
      className={`invoice-app -mx-4 -my-6 md:-mx-8 md:-my-8${
        s.preview ? " preview" : ""
      }`}
      style={rootStyle}
    >
      <div className="editor-shell">
        {/* Controls panel — docks into the right gutter on wide screens */}
        <aside data-print="hide" className="editor-panel" style={panelCard}>
          {/* header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              paddingBottom: 14,
              marginBottom: 14,
              borderBottom: "1px solid #f0f0ec",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                borderRadius: 9,
                background: "var(--accent, #1a1a1a)",
                color: "#fff",
                flexShrink: 0,
              }}
            >
              <HugeiconsIcon
                icon={Invoice01Icon}
                size={17}
                color="#fff"
                strokeWidth={2}
              />
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: "#1a1a1a" }}>
                {t.editor.title}
              </div>
              <div
                style={{
                  fontFamily: JM,
                  fontSize: 10.5,
                  letterSpacing: ".04em",
                  color: "#9a9a93",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {s.meta.number}
              </div>
            </div>
          </div>

          <div className="editor-panel-groups">
            {/* View toggle pinned to the top, spanning the full panel width. */}
            <div style={{ gridColumn: "1 / -1" }}>
              {group(
                s.preview ? ViewIcon : Edit02Icon,
                t.editor.view,
                <div style={segGroup}>
                  <button
                    onClick={() => setS((p) => ({ ...p, preview: false }))}
                    style={seg(!s.preview)}
                  >
                    <HugeiconsIcon icon={Edit02Icon} size={14} strokeWidth={2} />{" "}
                    {t.editor.edit}
                  </button>
                  <button
                    onClick={() =>
                      setS((p) => ({ ...p, preview: true, menu: null }))
                    }
                    style={seg(s.preview)}
                  >
                    <HugeiconsIcon icon={ViewIcon} size={15} strokeWidth={2} />{" "}
                    {t.editor.preview}
                  </button>
                </div>
              )}
            </div>

            {group(
              Layout01Icon,
              t.editor.template,
              <div style={segGroup}>
                <button
                  onClick={() => setS((p) => ({ ...p, template: "minimal" }))}
                  style={seg(s.template === "minimal")}
                >
                  {t.editor.minimal}
                </button>
                <button
                  onClick={() => setS((p) => ({ ...p, template: "classic" }))}
                  style={seg(s.template === "classic")}
                >
                  {t.editor.classic}
                </button>
                <button
                  onClick={() => setS((p) => ({ ...p, template: "bold" }))}
                  style={seg(s.template === "bold")}
                >
                  {t.editor.bold}
                </button>
              </div>
            )}

            {group(
              DollarCircleIcon,
              t.editor.currency,
              <div style={segGroup}>
                <button
                  onClick={() => setS((p) => ({ ...p, currency: "USD" }))}
                  style={seg(s.currency === "USD")}
                >
                  USD&nbsp;$
                </button>
                <button
                  onClick={() => setS((p) => ({ ...p, currency: "IDR" }))}
                  style={seg(s.currency === "IDR")}
                >
                  IDR&nbsp;Rp
                </button>
              </div>
            )}

            {group(
              PaintBoardIcon,
              t.editor.accent,
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 7,
                }}
              >
                {SWATCHES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setAccent(c)}
                    title={c}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      cursor: "pointer",
                      border: 0,
                      padding: 0,
                      background: c,
                      boxShadow:
                        c.toLowerCase() === acc.toLowerCase()
                          ? "0 0 0 2px #fff,0 0 0 3px #1a1a1a"
                          : "inset 0 0 0 1px rgba(0,0,0,.15)",
                    }}
                  />
                ))}
                <label
                  title="Custom color"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 26,
                    height: 26,
                    border: "1px solid #e2e2db",
                    borderRadius: 7,
                    background: "#fff",
                    cursor: "pointer",
                    position: "relative",
                  }}
                >
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      background: acc,
                      boxShadow: "inset 0 0 0 1px rgba(0,0,0,.15)",
                    }}
                  />
                  <input
                    type="color"
                    value={acc}
                    onInput={(e) =>
                      setAccent((e.target as HTMLInputElement).value)
                    }
                    style={{
                      position: "absolute",
                      inset: 0,
                      opacity: 0,
                      cursor: "pointer",
                    }}
                  />
                </label>
              </div>
            )}

            <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleSave}
                disabled={!canSave}
                className="iv-print"
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  border: 0,
                  background: "var(--accent, #1a1a1a)",
                  color: "#fff",
                  cursor: canSave ? "pointer" : "not-allowed",
                  opacity: canSave ? 1 : 0.55,
                  borderRadius: 9,
                  padding: "10px 16px",
                  fontWeight: 600,
                  fontSize: 13,
                  fontFamily: SG,
                }}
              >
                <HugeiconsIcon
                  icon={
                    createInvoice.isPending
                      ? Loading03Icon
                      : saved
                      ? Tick02Icon
                      : FloppyDiskIcon
                  }
                  size={15}
                  color="#fff"
                  strokeWidth={2}
                  className={createInvoice.isPending ? "animate-spin" : undefined}
                />{" "}
                {createInvoice.isPending
                  ? t.editor.saving
                  : saved
                  ? t.editor.saved
                  : t.editor.save}
              </button>

              <button
                onClick={handleDownloadPdf}
                disabled={pdfBusy}
                className="iv-btn-light"
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  border: "1px solid #e2e2db",
                  background: "#fff",
                  color: "#1a1a1a",
                  cursor: pdfBusy ? "wait" : "pointer",
                  opacity: pdfBusy ? 0.6 : 1,
                  borderRadius: 9,
                  padding: "9px 16px",
                  fontWeight: 500,
                  fontSize: 13,
                  fontFamily: SG,
                }}
              >
                <HugeiconsIcon
                  icon={pdfBusy ? Loading03Icon : Download04Icon}
                  size={15}
                  strokeWidth={2}
                  className={pdfBusy ? "animate-spin" : undefined}
                />{" "}
                {pdfBusy ? t.editor.preparingPdf : t.editor.downloadPdf}
              </button>
              </div>
              {pdfErr && (
                <span
                  style={{
                    fontFamily: JM,
                    fontSize: 10.5,
                    lineHeight: 1.4,
                    textAlign: "center",
                    color: "#dc2626",
                  }}
                >
                  {pdfErr}
                </span>
              )}

              {(() => {
                const base: CSSProperties = {
                  fontFamily: JM,
                  fontSize: 10.5,
                  lineHeight: 1.4,
                  textAlign: "center",
                  textDecoration: "none",
                };
                if (!session)
                  return (
                    <Link href="/sign-in" style={{ ...base, color: "#9a9a93" }}>
                      {t.editor.signInToSave}
                    </Link>
                  );
                if (!s.companyId)
                  return (
                    <Link href="/companies" style={{ ...base, color: "#9a9a93" }}>
                      {t.editor.needCompany}
                    </Link>
                  );
                if (saveErr)
                  return <span style={{ ...base, color: "#dc2626" }}>{saveErr}</span>;
                if (saved)
                  return (
                    <Link
                      href={savedId ? `/invoice/${savedId}` : "/"}
                      style={{ ...base, color: "var(--accent, #1a1a1a)" }}
                    >
                      {t.editor.viewHistory}
                    </Link>
                  );
                return null;
              })()}

              {/* Delete acts on the invoice currently open (the selected one in
                  the riwayat list); the rows themselves stay full-width links. */}
              {invoice && (
                <button
                  onClick={() => setConfirmDel(invoice)}
                  className="iv-delete"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 7,
                    width: "100%",
                    border: "1px solid #f0d6d6",
                    background: "#fff",
                    color: "#d04646",
                    cursor: "pointer",
                    borderRadius: 9,
                    padding: "9px 16px",
                    fontWeight: 500,
                    fontSize: 13,
                    fontFamily: SG,
                  }}
                >
                  <HugeiconsIcon icon={Delete02Icon} size={15} strokeWidth={2} />{" "}
                  {t.common.delete}
                </button>
              )}
            </div>
          </div>

          {!s.preview && (
            <div
              className="iv-hint"
              style={{
                marginTop: 14,
                paddingTop: 14,
                borderTop: "1px solid #f0f0ec",
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                fontFamily: JM,
                fontSize: 10.5,
                lineHeight: 1.5,
                letterSpacing: ".02em",
                color: "#9a9a93",
              }}
            >
              <span style={{ flexShrink: 0, marginTop: 1, lineHeight: 0 }}>
                <HugeiconsIcon
                  icon={Edit02Icon}
                  size={13}
                  color="#9a9a93"
                  strokeWidth={2}
                />
              </span>
              <span>{t.editor.hint}</span>
            </div>
          )}
        </aside>

      {/* Paper */}
      <div
        ref={paperRef}
        data-paper
        className="editor-paper"
        style={{
          background: "var(--paper-bg, #fff)",
          border: "1px solid #ececec",
          borderRadius: 6,
          boxShadow:
            "0 1px 2px rgba(0,0,0,.04),0 16px 48px -16px rgba(0,0,0,.14)",
          padding: "var(--pad, 56px)",
        }}
      >
        {/* accent tick */}
        <div
          style={{
            width: 48,
            height: 3,
            background: "var(--accent, #1a1a1a)",
            borderRadius: 2,
            marginBottom: 30,
            display: "var(--tick-display, block)",
          }}
        />

        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 32,
            flexWrap: "wrap",
            background: "var(--head-bg, transparent)",
            borderRadius: "var(--head-radius, 0)",
            padding: "var(--head-pad, 0)",
            borderBottom: "var(--head-border-bottom, none)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 18,
              minWidth: 240,
              flex: 1,
            }}
          >
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <span className="eyebrow" style={{ color: "var(--head-label)" }}>
                {t.editor.from}
              </span>
              <button
                data-print="hide"
                onClick={() => toggleMenu("sender")}
                className="iv-choose"
                style={chooseBtn}
              >
                {t.editor.choose} <span style={{ fontSize: 9 }}>&#9662;</span>
              </button>
              {s.menu === "sender" && (
                <>
                  <div
                    data-print="hide"
                    onClick={closeMenu}
                    style={{
                      position: "fixed",
                      inset: 0,
                      zIndex: 45,
                      background: "transparent",
                    }}
                  />
                  <div
                    data-print="hide"
                    style={{
                      ...menuCard,
                      position: "absolute",
                      top: "100%",
                      right: 0,
                      marginTop: 6,
                      minWidth: 250,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 500,
                        fontSize: 10,
                        lineHeight: 1,
                        fontFamily: JM,
                        letterSpacing: ".1em",
                        textTransform: "uppercase",
                        color: "#b3b3ab",
                        padding: "8px 11px 6px",
                      }}
                    >
                      {t.editor.savedSenders}
                    </div>
                    {senderOptions.map(({ id, party: opt, logoUrl }, i) => (
                      <button
                        key={id ?? `${opt.name}-${i}`}
                        onClick={() => applySender(opt, id, logoUrl)}
                        className="iv-menu-item"
                        style={menuItem}
                      >
                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: 13,
                            lineHeight: 1.2,
                            fontFamily: SG,
                            color: "#1a1a1a",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {opt.name}
                        </span>
                        <span
                          style={{
                            fontWeight: 400,
                            fontSize: 11,
                            lineHeight: 1.4,
                            fontFamily: JM,
                            color: "#9a9a93",
                          }}
                        >
                          {opt.line2}
                          {"  ·  "}
                          {opt.email}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div
              style={{
                width: 128,
                height: 48,
                border: s.logoUrl
                  ? "none"
                  : "1px solid var(--logo-border, #e6e6e1)",
                borderRadius: 6,
                background: s.logoUrl ? "transparent" : "var(--logo-bg)",
                display: "flex",
                alignItems: "center",
                justifyContent: s.logoUrl ? "flex-start" : "center",
                overflow: "hidden",
                fontWeight: 500,
                fontSize: 10,
                lineHeight: 1,
                fontFamily: JM,
                letterSpacing: ".12em",
                textTransform: "uppercase",
                color: "var(--logo-ink, #b3b3ab)",
              }}
            >
              {s.logoUrl ? (
                // crossOrigin lets html2canvas rasterize it for the PDF without
                // tainting the canvas (needs the bucket to send CORS headers).
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.logoUrl}
                  alt={s.biz.name || "Logo"}
                  crossOrigin="anonymous"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                  }}
                />
              ) : (
                t.editor.yourLogo
              )}
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 1,
                maxWidth: 280,
              }}
            >
              <input
                className="iv-hf"
                value={s.biz.name}
                onChange={upd("biz", "name")}
                placeholder={t.editor.ph.name}
                style={field({
                  fontWeight: 600,
                  fontSize: 17,
                  lineHeight: 1.3,
                  fontFamily: "var(--body-font)",
                  color: "var(--head-ink)",
                  padding: "5px 7px",
                  margin: "-5px -7px",
                })}
              />
              {(["line1", "line2", "email", "phone"] as const).map((k) => (
                <input
                  key={k}
                  className="iv-hf"
                  value={s.biz[k] ?? ""}
                  onChange={upd("biz", k)}
                  placeholder={
                    k === "line1"
                      ? t.editor.ph.street
                      : k === "line2"
                      ? t.editor.ph.city
                      : k === "email"
                      ? t.editor.ph.email
                      : t.editor.ph.phone
                  }
                  style={field({
                    fontWeight: 400,
                    fontSize: 13,
                    lineHeight: 1.45,
                    fontFamily: "var(--body-font)",
                    color: "var(--head-muted)",
                    padding: "4px 6px",
                    margin: "-2px -6px",
                  })}
                />
              ))}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 20,
              minWidth: 250,
            }}
          >
            <div
              style={{
                fontFamily: "var(--title-font)",
                fontWeight: "var(--title-weight, 300)" as unknown as number,
                fontSize: "var(--title-size, 36px)",
                lineHeight: 1,
                letterSpacing: "var(--title-spacing, .2em)",
                textTransform: "uppercase",
                color: "var(--title-color, #1a1a1a)",
                paddingRight: ".1em",
              }}
            >
              {t.editor.invoiceWord}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "auto 168px",
                gap: "9px 14px",
                alignItems: "center",
              }}
            >
              {(
                [
                  [t.editor.invoiceNo, "number"],
                  [t.editor.issued, "issued"],
                  [t.editor.due, "due"],
                ] as const
              ).map(([label, key]) => (
                <div key={key} style={{ display: "contents" }}>
                  <div
                    style={{
                      fontWeight: 500,
                      fontSize: 11,
                      lineHeight: 1.3,
                      fontFamily: "var(--label-font)",
                      letterSpacing: ".08em",
                      textTransform: "uppercase",
                      color: "var(--head-label)",
                      textAlign: "right",
                    }}
                  >
                    {label}
                  </div>
                  <input
                    className="iv-hf"
                    value={s.meta[key]}
                    onChange={upd("meta", key)}
                    style={field({
                      width: 168,
                      fontWeight: 500,
                      fontSize: 13,
                      lineHeight: 1.3,
                      fontFamily: "var(--num-font)",
                      color: "var(--head-ink)",
                      textAlign: "right",
                      padding: "4px 6px",
                      margin: "-4px -6px",
                    })}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bill To */}
        <div style={{ marginTop: 40 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              position: "relative",
              maxWidth: 360,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                marginBottom: 2,
              }}
            >
              <span
                style={{
                  ...colLabel,
                  fontSize: 11,
                  lineHeight: 1.3,
                  whiteSpace: "nowrap",
                }}
              >
                {t.editor.billTo}
              </span>
              <button
                data-print="hide"
                onClick={() => toggleMenu("client")}
                className="iv-choose"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  border: "1px solid var(--field-focus, #e4e4de)",
                  background: "var(--paper-bg, #fff)",
                  color: "var(--muted)",
                  fontWeight: 500,
                  fontSize: 10,
                  lineHeight: 1,
                  fontFamily: JM,
                  letterSpacing: ".06em",
                  textTransform: "uppercase",
                  padding: "5px 8px",
                  borderRadius: 7,
                  cursor: "pointer",
                }}
              >
                {t.editor.choose} <span style={{ fontSize: 9 }}>&#9662;</span>
              </button>
            </div>
            {s.menu === "client" && (
              <>
                <div
                  data-print="hide"
                  onClick={closeMenu}
                  style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 45,
                    background: "transparent",
                  }}
                />
                <div
                  data-print="hide"
                  style={{
                    ...menuCard,
                    position: "absolute",
                    top: 28,
                    right: 0,
                    minWidth: 250,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 500,
                      fontSize: 10,
                      lineHeight: 1,
                      fontFamily: JM,
                      letterSpacing: ".1em",
                      textTransform: "uppercase",
                      color: "#b3b3ab",
                      padding: "8px 11px 6px",
                    }}
                  >
                    {t.editor.savedClients}
                  </div>
                  {clientOptions.map(({ party: opt }, i) => (
                    <button
                      key={`${opt.name}-${i}`}
                      onClick={() => applyClient(opt)}
                      className="iv-menu-item"
                      style={menuItem}
                    >
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: 13,
                          lineHeight: 1.2,
                          fontFamily: SG,
                          color: "#1a1a1a",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {opt.name}
                      </span>
                      <span
                        style={{
                          fontWeight: 400,
                          fontSize: 11,
                          lineHeight: 1.4,
                          fontFamily: JM,
                          color: "#9a9a93",
                        }}
                      >
                        {opt.line2}
                        {"  ·  "}
                        {opt.email}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
            <input
              className="iv-f"
              value={s.billTo.name}
              onChange={upd("billTo", "name")}
              placeholder={t.editor.ph.clientName}
              style={field({
                fontWeight: 600,
                fontSize: 14,
                lineHeight: 1.4,
                fontFamily: "var(--body-font)",
                color: "var(--ink)",
                padding: "4px 6px",
                margin: "-4px -6px",
              })}
            />
            {(["line1", "line2", "email"] as const).map((k) => (
              <input
                key={k}
                className="iv-f"
                value={s.billTo[k] ?? ""}
                onChange={upd("billTo", k)}
                placeholder={
                  k === "line1"
                    ? t.editor.ph.street
                    : k === "line2"
                    ? t.editor.ph.city
                    : t.editor.ph.clientEmail
                }
                style={field({
                  fontWeight: 400,
                  fontSize: 13,
                  lineHeight: 1.5,
                  fontFamily: "var(--body-font)",
                  color: "var(--muted)",
                  padding: "3px 6px",
                  margin: "-2px -6px",
                })}
              />
            ))}
          </div>
        </div>

        {/* Line items */}
        <div style={{ marginTop: 40 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0,1fr) 60px 116px 128px 28px",
              gap: 12,
              padding: "0 0 10px",
              borderBottom: "1px solid var(--line-strong, #1a1a1a)",
            }}
          >
            <div style={colLabel}>{t.editor.description}</div>
            <div style={{ ...colLabel, textAlign: "right" }}>{t.editor.qty}</div>
            <div style={{ ...colLabel, textAlign: "right" }}>{t.editor.rate}</div>
            <div style={{ ...colLabel, textAlign: "right" }}>{t.editor.amount}</div>
            <div />
          </div>

          {s.items.map((item, i) => (
            <div
              key={item.id}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0,1fr) 60px 116px 128px 28px",
                gap: 12,
                alignItems: "center",
                borderBottom: "1px solid var(--line-soft, #f0f0ec)",
                padding: "2px 0",
              }}
            >
              <input
                className="iv-f"
                value={item.description}
                onChange={updItem(i, "description")}
                placeholder={t.editor.ph.item}
                style={field({
                  fontWeight: 400,
                  fontSize: 14,
                  lineHeight: 1.4,
                  fontFamily: "var(--body-font)",
                  color: "var(--ink)",
                  padding: "9px 8px",
                  margin: "0 -8px",
                })}
              />
              <input
                className="iv-f"
                value={item.qty}
                onChange={updItem(i, "qty")}
                inputMode="decimal"
                style={field({
                  fontWeight: 500,
                  fontSize: 14,
                  lineHeight: 1.4,
                  fontFamily: "var(--num-font)",
                  color: "var(--ink)",
                  textAlign: "right",
                  padding: "9px 6px",
                  margin: "0 -6px",
                  fontVariantNumeric: "tabular-nums",
                })}
              />
              <input
                className="iv-f"
                value={item.rate}
                onChange={updItem(i, "rate")}
                inputMode="decimal"
                style={field({
                  fontWeight: 500,
                  fontSize: 14,
                  lineHeight: 1.4,
                  fontFamily: "var(--num-font)",
                  color: "var(--ink)",
                  textAlign: "right",
                  padding: "9px 6px",
                  margin: "0 -6px",
                  fontVariantNumeric: "tabular-nums",
                })}
              />
              <div
                style={{
                  fontWeight: 500,
                  fontSize: 14,
                  lineHeight: 1.4,
                  fontFamily: "var(--num-font)",
                  textAlign: "right",
                  color: "var(--ink)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {fmt(num(item.qty) * num(item.rate))}
              </div>
              <button
                data-print="hide"
                onClick={() => removeItem(i)}
                title="Remove"
                className="iv-remove"
                style={{
                  width: 24,
                  height: 24,
                  border: 0,
                  background: "transparent",
                  color: "#c4c4bd",
                  cursor: "pointer",
                  borderRadius: 6,
                  fontWeight: 400,
                  fontSize: 17,
                  lineHeight: 1,
                  fontFamily: SG,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                &times;
              </button>
            </div>
          ))}

          <button
            data-print="hide"
            onClick={addItem}
            className="iv-add"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              border: "1px dashed #d6d6cf",
              background: "transparent",
              color: "var(--muted)",
              fontWeight: 500,
              fontSize: 13,
              fontFamily: "var(--body-font)",
              padding: "8px 13px",
              borderRadius: 8,
              cursor: "pointer",
              marginTop: 16,
              whiteSpace: "nowrap",
            }}
          >
            + {t.editor.addLineItem}
          </button>
        </div>

        {/* Totals */}
        <div
          style={{ display: "flex", justifyContent: "flex-end", marginTop: 30 }}
        >
          <div
            style={{
              width: 312,
              display: "flex",
              flexDirection: "column",
              gap: 11,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontWeight: 400,
                  fontSize: 14,
                  fontFamily: "var(--body-font)",
                  color: "var(--muted)",
                }}
              >
                {t.editor.subtotal}
              </span>
              <span
                style={{
                  fontWeight: 500,
                  fontSize: 14,
                  fontFamily: "var(--num-font)",
                  color: "var(--ink)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {fmt(subtotal)}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontWeight: 400,
                  fontSize: 14,
                  fontFamily: "var(--body-font)",
                  color: "var(--muted)",
                }}
              >
                {t.editor.discount}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
                <span
                  style={{
                    fontWeight: 500,
                    fontSize: 13,
                    fontFamily: "var(--num-font)",
                    color: "var(--label)",
                    whiteSpace: "nowrap",
                  }}
                >
                  &minus;{symbol}
                </span>
                <input
                  className="iv-f"
                  value={s.discount}
                  onChange={updScalar("discount")}
                  inputMode="decimal"
                  style={field({
                    width: 96,
                    fontWeight: 500,
                    fontSize: 14,
                    fontFamily: "var(--num-font)",
                    color: "var(--ink)",
                    textAlign: "right",
                    padding: "4px 6px",
                    margin: "-4px -6px",
                    fontVariantNumeric: "tabular-nums",
                  })}
                />
              </div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    fontWeight: 400,
                    fontSize: 14,
                    fontFamily: "var(--body-font)",
                    color: "var(--muted)",
                  }}
                >
                  {t.editor.tax}
                </span>
                <input
                  className="iv-f"
                  value={s.taxRate}
                  onChange={updScalar("taxRate")}
                  inputMode="decimal"
                  style={{
                    width: 44,
                    border: 0,
                    background: "var(--field-hover)",
                    fontWeight: 500,
                    fontSize: 13,
                    fontFamily: "var(--num-font)",
                    color: "var(--ink)",
                    textAlign: "right",
                    padding: "4px 6px",
                    borderRadius: 6,
                    outline: "none",
                    fontVariantNumeric: "tabular-nums",
                  }}
                />
                <span
                  style={{
                    fontWeight: 400,
                    fontSize: 13,
                    fontFamily: "var(--body-font)",
                    color: "var(--label)",
                  }}
                >
                  %
                </span>
              </div>
              <span
                style={{
                  fontWeight: 500,
                  fontSize: 14,
                  fontFamily: "var(--num-font)",
                  color: "var(--ink)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {fmt(taxVal)}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                borderTop: "var(--total-border-top, 1px solid #1a1a1a)",
                background: "var(--total-bg, transparent)",
                borderRadius: "var(--total-radius, 0)",
                padding: "var(--total-pad, 13px 0 0)",
                marginTop: 3,
              }}
            >
              <span
                style={{
                  fontWeight: 600,
                  fontSize: 15,
                  fontFamily: "var(--body-font)",
                  color: "var(--total-label, #1a1a1a)",
                  whiteSpace: "nowrap",
                }}
              >
                {t.editor.totalDue}
              </span>
              <span
                style={{
                  fontFamily: "var(--num-font)",
                  fontWeight: 600,
                  fontSize: "var(--total-value-size, 20px)",
                  color: "var(--total-value)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {fmt(total)}
              </span>
            </div>
          </div>
        </div>

        {/* Terms / Bank */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 36,
            marginTop: 48,
            paddingTop: 28,
            borderTop: "1px solid var(--line-soft, #f0f0ec)",
          }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", gap: 10 }}
          >
            <div style={{ ...colLabel, fontSize: 11, lineHeight: 1.3 }}>
              {t.editor.paymentTerms}
            </div>
            <input
              className="iv-f"
              value={s.terms}
              onChange={updScalar("terms")}
              placeholder={t.editor.ph.terms}
              style={field({
                fontWeight: 500,
                fontSize: 14,
                lineHeight: 1.4,
                fontFamily: "var(--body-font)",
                color: "var(--ink)",
                padding: "4px 6px",
                margin: "-4px -6px",
              })}
            />
            <div
              style={{
                fontWeight: 400,
                fontSize: 12,
                lineHeight: 1.6,
                fontFamily: "var(--body-font)",
                color: "var(--label)",
              }}
            >
              {t.editor.transferNote}
            </div>
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            <div style={{ ...colLabel, fontSize: 11, lineHeight: 1.3 }}>
              {t.editor.bankDetails}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px 16px",
              }}
            >
              {(
                [
                  [t.editor.bank, "name", t.editor.ph.bankName, "var(--body-font)"],
                  [t.editor.account, "account", "0000 0000", "var(--num-font)"],
                  [t.editor.routing, "routing", "000000000", "var(--num-font)"],
                  [t.editor.swift, "swift", "ABCDXX00", "var(--num-font)"],
                ] as const
              ).map(([label, key, ph, fontFamily]) => (
                <div key={key}>
                  <div
                    style={{
                      fontWeight: 500,
                      fontSize: 9,
                      lineHeight: 1.4,
                      fontFamily: "var(--label-font)",
                      letterSpacing: ".1em",
                      textTransform: "uppercase",
                      color: "var(--label)",
                      marginBottom: 1,
                    }}
                  >
                    {label}
                  </div>
                  <input
                    className="iv-f"
                    value={s.bank[key]}
                    onChange={upd("bank", key)}
                    placeholder={ph}
                    style={field({
                      fontWeight: 400,
                      fontSize: 13,
                      lineHeight: 1.4,
                      fontFamily,
                      color: "var(--ink)",
                      padding: "3px 5px",
                      margin: "-3px -5px",
                    })}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div
          style={{
            marginTop: 32,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div style={{ ...colLabel, fontSize: 11, lineHeight: 1.3 }}>{t.editor.notes}</div>
          <textarea
            className="iv-f"
            value={s.notes}
            onChange={updScalar("notes")}
            placeholder={t.editor.ph.notes}
            style={{
              width: "100%",
              border: 0,
              background: "transparent",
              fontWeight: 400,
              fontSize: 13,
              lineHeight: 1.65,
              fontFamily: "var(--body-font)",
              color: "var(--muted)",
              padding: 8,
              margin: "0 -8px",
              borderRadius: 8,
              outline: "none",
              resize: "vertical",
              minHeight: 60,
            }}
          />
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: 36,
            paddingTop: 18,
            borderTop: "1px solid var(--line-soft, #f0f0ec)",
            textAlign: "center",
            fontWeight: 400,
            fontSize: 11,
            lineHeight: 1.4,
            fontFamily: "var(--label-font)",
            letterSpacing: ".04em",
            color: "var(--label)",
          }}
        >
          {s.biz.name} &nbsp;·&nbsp; {s.biz.email}
        </div>
      </div>

      {/* Riwayat rail — saved invoices, docks into the left gutter on wide
          screens (replaces the old standalone history page). */}
      <aside data-print="hide" className="editor-rail" style={panelCard}>
        {group(
          Invoice01Icon,
          t.nav.history,
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              maxHeight: "calc(100vh - 160px)",
              overflowY: "auto",
              margin: "0 -4px",
              padding: "0 4px",
            }}
          >
            {invoices.length === 0 ? (
              <span
                style={{
                  fontFamily: JM,
                  fontSize: 11,
                  lineHeight: 1.4,
                  color: "#9a9a93",
                  padding: "2px 0",
                }}
              >
                {t.invoices.noMatch}
              </span>
            ) : (
              invoices.map((inv) => {
                const isActive = invoice?.id === inv.id;
                return (
                  <Link
                    key={inv.id}
                    href={`/invoice/${inv.id}`}
                    className="iv-menu-item"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 3,
                      textDecoration: "none",
                      padding: "8px 10px",
                      borderRadius: 8,
                      background: isActive
                        ? "var(--accent, #1a1a1a)"
                        : "transparent",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          minWidth: 0,
                          fontWeight: 600,
                          fontSize: 12.5,
                          fontFamily: SG,
                          color: isActive ? "#fff" : "#1a1a1a",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {inv.number}
                      </span>
                      <span
                        style={{
                          flexShrink: 0,
                          fontWeight: 700,
                          fontSize: 12.5,
                          fontFamily: JM,
                          color: isActive ? "#fff" : "var(--accent, #1a1a1a)",
                          whiteSpace: "nowrap",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {formatIDR(inv.totalAmount)}
                      </span>
                    </div>
                    <span
                      style={{
                        fontFamily: JM,
                        fontSize: 10.5,
                        lineHeight: 1.3,
                        color: isActive ? "rgba(255,255,255,.8)" : "#9a9a93",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {inv.recipientName} · {formatDate(inv.issueDate)}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        )}
      </aside>
      </div>
    </div>

    <Dialog
      open={!!confirmDel}
      onClose={() => setConfirmDel(null)}
      title={t.invoices.deleteTitle}
      description={t.invoices.deleteDesc(confirmDel?.number ?? "")}
    >
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setConfirmDel(null)}>
          {t.common.cancel}
        </Button>
        <Button
          variant="danger"
          onClick={() => {
            const target = confirmDel;
            setConfirmDel(null);
            if (!target) return;
            deleteInvoice.mutate(target.id);
            // If we're viewing the invoice we just deleted, return home.
            if (invoice?.id === target.id) router.push("/");
          }}
        >
          <HugeiconsIcon icon={Delete02Icon} size={16} /> {t.common.delete}
        </Button>
      </div>
    </Dialog>
    </>
  );
}
