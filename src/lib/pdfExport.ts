import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export type PdfRow = {
  Metric: string;
  Value: string | number | null | undefined;
};

type DocWithAutoTable = jsPDF & {
  lastAutoTable?: { finalY: number };
};

export type PdfReportOptions = {
  /** File saved as `${filename}.pdf` */
  filename: string;
  /** Big heading under the letterhead, e.g. "Austin, TX → Denver, CO" */
  title: string;
  /** Optional line under the title, e.g. verdict + monthly flexibility */
  subtitle?: string;
  /** Metric/Value pairs rendered as a table */
  rows: PdfRow[];
  /** Optional small print at the bottom, e.g. a disclaimer */
  footerNote?: string;
};

const SLATE_900: [number, number, number] = [15, 23, 42];
const SLATE_600: [number, number, number] = [71, 85, 105];
const SLATE_500: [number, number, number] = [100, 116, 139];
const SLATE_400: [number, number, number] = [148, 163, 184];
const SLATE_200: [number, number, number] = [226, 232, 240];
const SLATE_50: [number, number, number] = [248, 250, 252];
const WHITE: [number, number, number] = [255, 255, 255];

/**
 * Builds and downloads a branded one-page PDF report from a list of
 * Metric/Value rows. Runs entirely client-side (no server round trip).
 */
export function downloadPdfReport({ filename, title, subtitle, rows, footerNote }: PdfReportOptions): void {
  const doc = new jsPDF({ unit: "pt", format: "letter" }) as DocWithAutoTable;
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 40;

  // ── Letterhead ──────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...SLATE_900);
  doc.text("Relocation by Numbers", marginX, 46);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...SLATE_500);
  doc.text("relocationbynumbers.com", marginX, 62);

  doc.setDrawColor(...SLATE_200);
  doc.setLineWidth(1);
  doc.line(marginX, 74, pageWidth - marginX, 74);

  // ── Title / subtitle ────────────────────────────────────────────────────
  let cursorY = 100;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...SLATE_900);
  doc.text(title, marginX, cursorY);

  if (subtitle) {
    cursorY += 18;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(...SLATE_600);
    doc.text(subtitle, marginX, cursorY);
  }

  cursorY += 16;
  const generatedOn = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...SLATE_400);
  doc.text(`Generated ${generatedOn}`, marginX, cursorY);

  // ── Table ───────────────────────────────────────────────────────────────
  autoTable(doc, {
    startY: cursorY + 16,
    head: [["Metric", "Value"]],
    body: rows.map((r) => [
      String(r.Metric ?? ""),
      r.Value === null || r.Value === undefined || r.Value === "" ? "—" : String(r.Value),
    ]),
    margin: { left: marginX, right: marginX },
    styles: { fontSize: 10, cellPadding: 7, textColor: [30, 41, 59] },
    headStyles: { fillColor: SLATE_900, textColor: WHITE, fontStyle: "bold" },
    alternateRowStyles: { fillColor: SLATE_50 },
    columnStyles: { 0: { cellWidth: 270 }, 1: { halign: "right" } },
  });

  // ── Footer note ─────────────────────────────────────────────────────────
  if (footerNote) {
    const finalY = doc.lastAutoTable?.finalY ?? cursorY + 16;
    const wrapped = doc.splitTextToSize(footerNote, pageWidth - marginX * 2) as string[];
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...SLATE_400);
    doc.text(wrapped, marginX, finalY + 22);
  }

  doc.save(`${filename}.pdf`);
}
