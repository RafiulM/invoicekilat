import { InvoiceEditor } from "@/components/invoice-editor";

// Home is the blank invoice editor. The control panel lists saved invoices;
// clicking one opens /invoice/[id], which renders this same editor prefilled.
export default function Home() {
  return <InvoiceEditor />;
}
