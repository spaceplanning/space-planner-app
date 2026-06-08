// ============================================================
// SPACE PLANNER STUDIO — Export Utilities
// Blueprint Dark Theme: PDF and PNG export with high resolution
// ============================================================

import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { FloorPlan, formatFeetInches } from "./floorPlanTypes";

export interface ExportOptions {
  format: "pdf" | "png";
  scale: number; // 1 = 96 DPI, 2 = 192 DPI, 3 = 288 DPI
  includeMetadata: boolean;
}

const DEFAULT_OPTIONS: ExportOptions = {
  format: "pdf",
  scale: 2,
  includeMetadata: true,
};

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
