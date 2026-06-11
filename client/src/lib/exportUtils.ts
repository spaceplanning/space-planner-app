// ============================================================
// SPACE PLANNER STUDIO — Export Utilities
// Blueprint Dark Theme: PDF and PNG export with high resolution
// ============================================================

import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { FloorPlan, formatFeetInches } from "./floorPlanTypes";

export interface ExportOptions {
  format: "pdf" | "png" | "editable-pdf";
  scale: number; // 1 = 96 DPI, 2 = 192 DPI, 3 = 288 DPI
  includeMetadata: boolean;
}

const DEFAULT_OPTIONS: ExportOptions = {
  format: "pdf",
  scale: 2,
  includeMetadata: true,
};

function buildPlanSummary(plan: FloorPlan): string[] {
  const rooms = plan.rooms.map((room) => `${room.name} (${formatFeetInches(room.width)} × ${formatFeetInches(room.height)})`).join("; ");
  const furniture = plan.furniture.slice(0, 8).map((item) => `${item.name} (${formatFeetInches(item.width)} × ${formatFeetInches(item.depth)})`).join("; ");

  return [
    `Plan: ${plan.name}`,
    `Dimensions: ${formatFeetInches(plan.totalWidth)} × ${formatFeetInches(plan.totalHeight)}`,
    `Rooms: ${rooms || "None"}`,
    `Furniture: ${furniture || "None"}`,
    `Exported: ${new Date().toLocaleString()}`,
  ];
}

function createEditablePdf(plan: FloorPlan): jsPDF {
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 40;
  const lineHeight = 18;
  let y = 52;

  pdf.setFillColor(9, 22, 40);
  pdf.rect(0, 0, pageWidth, 42, "F");
  pdf.setTextColor(224, 242, 254);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text(plan.name || "Finished Floor Plan", margin, 24);

  pdf.setFontSize(10);
  pdf.setTextColor(148, 163, 184);
  pdf.text("Editable PDF export for collaboration and sharing", margin, 38);

  pdf.setTextColor(15, 23, 42);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);

  buildPlanSummary(plan).forEach((line) => {
    pdf.text(line, margin, y);
    y += lineHeight;
  });

  if (plan.rooms.length > 0) {
    y += 8;
    pdf.setFont("helvetica", "bold");
    pdf.text("Room breakdown", margin, y);
    y += lineHeight;
    pdf.setFont("helvetica", "normal");

    plan.rooms.forEach((room) => {
      pdf.text(`• ${room.name} — ${formatFeetInches(room.width)} × ${formatFeetInches(room.height)}`, margin + 10, y);
      y += lineHeight;
    });
  }

  if (plan.furniture.length > 0) {
    y += 8;
    pdf.setFont("helvetica", "bold");
    pdf.text("Furniture summary", margin, y);
    y += lineHeight;
    pdf.setFont("helvetica", "normal");

    plan.furniture.forEach((item) => {
      pdf.text(`• ${item.name} — ${formatFeetInches(item.width)} × ${formatFeetInches(item.depth)} @ ${item.rotation}°`, margin + 10, y);
      y += lineHeight;
    });
  }

  return pdf;
}

async function captureCanvas(element: HTMLElement, scale: number): Promise<HTMLCanvasElement> {
  return html2canvas(element, {
    scale,
    backgroundColor: "#0a1628",
    useCORS: true,
    allowTaint: true,
    logging: false,
    imageTimeout: 0,
  });
}

export async function exportFloorPlan(
  canvasElement: HTMLElement,
  plan: FloorPlan,
  options: Partial<ExportOptions> = {}
): Promise<void> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    // Capture the canvas at high resolution
    const canvas = await captureCanvas(canvasElement, opts.scale);
    const imageData = canvas.toDataURL("image/png");

    if (opts.format === "png") {
      // Direct PNG download
      const link = document.createElement("a");
      link.href = imageData;
      link.download = `${plan.name || "floor-plan"}-${new Date().toISOString().split("T")[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (opts.format === "editable-pdf") {
      const pdf = createEditablePdf(plan);
      pdf.save(`${plan.name || "floor-plan"}-${new Date().toISOString().split("T")[0]}-editable.pdf`);
    } else if (opts.format === "pdf") {
      // Convert to PDF
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // Calculate PDF dimensions (maintain aspect ratio)
      const pdfWidth = 11; // inches (letter width)
      const pdfHeight = (imgHeight / imgWidth) * pdfWidth;

      const pdf = new jsPDF({
        orientation: pdfHeight > pdfWidth ? "portrait" : "landscape",
        unit: "in",
        format: [pdfWidth, pdfHeight],
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Add image to PDF
      pdf.addImage(imageData, "PNG", 0, 0, pageWidth, pageHeight);

      // Add metadata if requested
      if (opts.includeMetadata) {
        const fontSize = 8;
        const lineHeight = fontSize / 72; // Convert to inches
        const margin = 0.25;
        const y = pageHeight - margin - lineHeight * 3;

        pdf.setFontSize(fontSize);
        pdf.setTextColor(100, 100, 100);

        const timestamp = new Date().toLocaleString();
        const dimensions = `${formatFeetInches(plan.totalWidth)} × ${formatFeetInches(plan.totalHeight)}`;
        const info = `${plan.name} | ${plan.rooms.length} rooms | ${plan.furniture.length} items | ${dimensions} | Exported: ${timestamp}`;

        pdf.text(info, margin, y, { maxWidth: pageWidth - margin * 2 });
      }

      pdf.save(`${plan.name || "floor-plan"}-${new Date().toISOString().split("T")[0]}.pdf`);
    }
  } catch (error) {
    console.error("Export failed:", error);
    throw new Error(`Failed to export floor plan: ${(error as Error).message}`);
  }
}

export function emailPlan(plan: FloorPlan): void {
  const lines = buildPlanSummary(plan);
  const subject = `Floor plan export: ${plan.name}`;
  const body = [
    "Hi,",
    "",
    "Here is the finished floor plan summary for review:",
    "",
    ...lines,
    "",
    "You can open the plan in Space Planner and export an editable PDF from the export dialog.",
  ].join("\n");

  window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// Batch export multiple plans
export async function exportMultiplePlans(
  plans: FloorPlan[],
  canvasElements: Map<string, HTMLElement>,
  options: Partial<ExportOptions> = {}
): Promise<void> {
  for (const plan of plans) {
    const element = canvasElements.get(plan.id);
    if (element) {
      await exportFloorPlan(element, plan, options);
      // Small delay between exports to avoid browser throttling
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
}
