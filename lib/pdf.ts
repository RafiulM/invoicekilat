"use client";

import { jsPDF } from "jspdf";
import html2canvas from "html2canvas-pro";

/** Capture a DOM node and download it as an A4 PDF. Frontend-only, no server. */
export async function downloadElementAsPdf(
  el: HTMLElement,
  filename: string
): Promise<void> {
  const canvas = await html2canvas(el, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
  });

  const img = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const imgH = (canvas.height * pageW) / canvas.width;

  let remaining = imgH;
  let position = 0;
  // paginate if the content is taller than one A4 page
  while (remaining > 0) {
    pdf.addImage(img, "PNG", 0, position, pageW, imgH);
    remaining -= pageH;
    if (remaining > 0) {
      pdf.addPage();
      position -= pageH;
    }
  }

  pdf.save(filename);
}
