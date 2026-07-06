/**
 * PDF generation for measurements reports
 * Uses jsPDF to create professional measurement reports
 */

import jsPDF from "jspdf";
import type { MeasurementsReport, RoomMeasurements, SectionMeasurements } from "./measurements";

/**
 * Generate a PDF report from measurements data
 */
export function generateMeasurementsPdf(report: MeasurementsReport): Buffer {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "in",
    format: "letter",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 0.5;
  const contentWidth = pageWidth - 2 * margin;
  let yPos = margin;

  // Set up fonts
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(30, 58, 95); // Blueprint dark blue

  // Title
  doc.text("MEASUREMENTS REPORT", margin, yPos);
  yPos += 0.3;

  // Plan name and date
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(`Plan: ${report.planName}`, margin, yPos);
  yPos += 0.2;

  const reportDate = new Date(report.generatedAt).toLocaleDateString();
  doc.text(`Generated: ${reportDate}`, margin, yPos);
  yPos += 0.3;

  // Summary section
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(30, 58, 95);
  doc.text("SUMMARY", margin, yPos);
  yPos += 0.2;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  const summaryLines = [
    `Total Area: ${Math.round(report.totalArea)} sq ft`,
    `Total Perimeter: ${Math.round(report.totalPerimeter * 10) / 10}'`,
    `Number of Rooms: ${report.roomCount}`,
    ...(report.sectionCount > 0 ? [`Number of Sections: ${report.sectionCount}`] : []),
  ];

  for (const line of summaryLines) {
    doc.text(line, margin + 0.2, yPos);
    yPos += 0.2;
  }

  yPos += 0.2;

  // Rooms section
  if (report.rooms.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(30, 58, 95);
    doc.text("ROOM MEASUREMENTS", margin, yPos);
    yPos += 0.25;

    // Table header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(30, 58, 95);

    const colX = [margin, margin + 1.5, margin + 2.5, margin + 3.5, margin + 4.5];
    const colLabels = ["Room", "Dimensions", "Area", "Perimeter", ""];
    const colWidths = [1.4, 0.9, 0.9, 0.9, 0.3];

    for (let i = 0; i < colLabels.length; i++) {
      doc.rect(colX[i], yPos - 0.15, colWidths[i], 0.2, "F");
      doc.text(colLabels[i], colX[i] + 0.05, yPos - 0.03);
    }

    yPos += 0.25;

    // Table rows
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);

    for (const room of report.rooms) {
      // Check if we need a new page
      if (yPos > pageHeight - 0.5) {
        doc.addPage();
        yPos = margin;
      }

      const dimensions = `${room.widthFormatted} × ${room.heightFormatted}`;
      doc.text(room.name, colX[0] + 0.05, yPos);
      doc.text(dimensions, colX[1] + 0.05, yPos);
      doc.text(room.areaFormatted, colX[2] + 0.05, yPos);
      doc.text(room.perimeterFormatted, colX[3] + 0.05, yPos);

      yPos += 0.22;
    }

    yPos += 0.15;
  }

  // Sections section
  if (report.sections.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(30, 58, 95);
    doc.text("WIREFRAME SECTIONS", margin, yPos);
    yPos += 0.25;

    // Table header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(30, 58, 95);

    const colX = [margin, margin + 1.5, margin + 3, margin + 4.2];
    const colLabels = ["Section", "Area", "Perimeter", "Vertices"];
    const colWidths = [1.4, 1.4, 1.1, 0.8];

    for (let i = 0; i < colLabels.length; i++) {
      doc.rect(colX[i], yPos - 0.15, colWidths[i], 0.2, "F");
      doc.text(colLabels[i], colX[i] + 0.05, yPos - 0.03);
    }

    yPos += 0.25;

    // Table rows
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);

    for (const section of report.sections) {
      // Check if we need a new page
      if (yPos > pageHeight - 0.5) {
        doc.addPage();
        yPos = margin;
      }

      doc.text(section.name, colX[0] + 0.05, yPos);
      doc.text(section.areaFormatted, colX[1] + 0.05, yPos);
      doc.text(section.perimeterFormatted, colX[2] + 0.05, yPos);
      doc.text(section.boundaryPoints.toString(), colX[3] + 0.05, yPos);

      yPos += 0.22;
    }

    yPos += 0.15;
  }

  // Footer
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(
    "Space Planner Studio - Professional Floor Plan Analysis",
    pageWidth / 2,
    pageHeight - 0.3,
    { align: "center" }
  );

  // Return as buffer
  return Buffer.from(doc.output("arraybuffer"));
}

/**
 * Generate a CSV export of measurements
 */
export function generateMeasurementsCsv(report: MeasurementsReport): string {
  const lines: string[] = [];

  // Header
  lines.push("Space Planner Studio - Measurements Report");
  lines.push(`Plan: ${report.planName}`);
  lines.push(`Generated: ${new Date(report.generatedAt).toLocaleString()}`);
  lines.push("");

  // Summary
  lines.push("SUMMARY");
  lines.push(`Total Area,${Math.round(report.totalArea)} sq ft`);
  lines.push(`Total Perimeter,${Math.round(report.totalPerimeter * 10) / 10}'`);
  lines.push(`Number of Rooms,${report.roomCount}`);
  if (report.sectionCount > 0) {
    lines.push(`Number of Sections,${report.sectionCount}`);
  }
  lines.push("");

  // Rooms
  if (report.rooms.length > 0) {
    lines.push("ROOM MEASUREMENTS");
    lines.push("Room,Width,Height,Area,Perimeter");
    for (const room of report.rooms) {
      lines.push(
        `${room.name},${room.widthFormatted},${room.heightFormatted},${room.areaFormatted},${room.perimeterFormatted}`
      );
    }
    lines.push("");
  }

  // Sections
  if (report.sections.length > 0) {
    lines.push("WIREFRAME SECTIONS");
    lines.push("Section,Area,Perimeter,Vertices");
    for (const section of report.sections) {
      lines.push(
        `${section.name},${section.areaFormatted},${section.perimeterFormatted},${section.boundaryPoints}`
      );
    }
  }

  return lines.join("\n");
}
