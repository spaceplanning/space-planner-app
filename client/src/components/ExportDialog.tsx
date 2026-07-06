// ============================================================
// SPACE PLANNER STUDIO — Export Dialog
// Blueprint Dark Theme: PDF/PNG export with quality options
// ============================================================

import React, { useState } from "react";
import { X, Download, Loader2 } from "lucide-react";
import { FloorPlan } from "@/lib/floorPlanTypes";
import { exportFloorPlan } from "@/lib/exportUtils";
import { notifySuccess, notifyError, notifyLoading } from "@/lib/notifications";
import { trpc } from "@/lib/trpc";

interface Props {
  plan: FloorPlan;
  canvasElement: HTMLElement | null;
  onClose: () => void;
  planId?: string;
}

export default function ExportDialog({ plan, canvasElement, onClose, planId }: Props) {
  const [format, setFormat] = useState<"pdf" | "png" | "measurements">("pdf");
  const [quality, setQuality] = useState<1 | 2 | 3>(2);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const generateMeasurementsReport = trpc.measurements.generateReport.useMutation();

  const qualityLabels: Record<1 | 2 | 3, string> = {
    1: "Standard (96 DPI)",
    2: "High (192 DPI)",
    3: "Ultra (288 DPI)",
  };

  const handleExport = async () => {
    if (format === "measurements") {
      await handleExportMeasurements();
      return;
    }

    if (!canvasElement) {
      notifyError("Canvas not ready");
      return;
    }

    setIsExporting(true);
    const loadingId = notifyLoading(`Exporting as ${format.toUpperCase()}...`);
    try {
      await exportFloorPlan(canvasElement, plan, {
        format: format as "pdf" | "png",
        scale: quality,
        includeMetadata,
      });
      notifySuccess(`Floor plan exported as ${format.toUpperCase()}`);
      onClose();
    } catch (err) {
      notifyError((err as Error).message || "Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportMeasurements = async () => {
    if (!planId) {
      notifyError("Plan ID not available");
      return;
    }

    setIsExporting(true);
    const loadingId = notifyLoading("Generating measurements report...");
    try {
      const response = await generateMeasurementsReport.mutateAsync({ floorPlanId: planId });
      
      // Decode base64 PDF and trigger download
      const binaryString = atob(response.pdfBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = response.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      notifySuccess("Measurements report exported as PDF");
      onClose();
    } catch (err) {
      notifyError((err as Error).message || "Measurements export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    fontFamily: "'Space Mono', monospace",
    fontSize: 12,
    background: "var(--bp-navy)",
    border: "1px solid var(--bp-grid-major)",
    color: "var(--bp-text-primary)",
    padding: "7px 10px",
    outline: "none",
    cursor: "pointer",
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "'Space Mono', monospace",
    fontSize: 9,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--bp-text-muted)",
    display: "block",
    marginBottom: 6,
  };

  const optionStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 10px",
    background: "var(--bp-navy)",
    border: "1px solid var(--bp-grid-major)",
    cursor: "pointer",
    transition: "all 160ms",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10,22,40,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bp-panel)",
          border: "1px solid var(--bp-cyan)",
          width: 380,
          maxWidth: "90vw",
          animation: "scale-in 200ms cubic-bezier(0.23, 1, 0.32, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "14px 16px",
            borderBottom: "1px solid var(--bp-grid-major)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'Space Mono', monospace",
                fontWeight: 700,
                fontSize: 12,
                color: "var(--bp-cyan)",
                letterSpacing: "0.1em",
              }}
            >
              ⬇ EXPORT FLOOR PLAN
            </div>
            <div
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 9,
                color: "var(--bp-text-muted)",
                marginTop: 2,
              }}
            >
              PDF, PNG, OR MEASUREMENTS REPORT
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--bp-text-muted)",
              padding: 4,
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Plan info */}
          <div
            style={{
              background: "var(--bp-navy)",
              border: "1px solid var(--bp-grid-subtle)",
              padding: "10px 12px",
              borderRadius: 2,
            }}
          >
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "var(--bp-text-primary)", marginBottom: 3 }}>
              {plan.name}
            </div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--bp-text-muted)" }}>
              {plan.rooms.length} rooms · {plan.furniture.length} items
            </div>
          </div>

          {/* Format selection */}
          <div>
            <label style={labelStyle}>Export Format</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(["pdf", "png", "measurements"] as const).map((fmt) => (
                <label
                  key={fmt}
                  style={{
                    flex: 1,
                    minWidth: 100,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 10px",
                    background: format === fmt ? "rgba(34,211,238,0.1)" : "var(--bp-navy)",
                    border: format === fmt ? "1px solid var(--bp-cyan)" : "1px solid var(--bp-grid-major)",
                    cursor: "pointer",
                    transition: "all 160ms",
                  }}
                >
                  <input
                    type="radio"
                    name="format"
                    value={fmt}
                    checked={format === fmt}
                    onChange={(e) => setFormat(e.target.value as "pdf" | "png" | "measurements")}
                    style={{ cursor: "pointer" }}
                  />
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: format === fmt ? "var(--bp-cyan)" : "var(--bp-text-primary)" }}>
                    {fmt === "measurements" ? "REPORT" : fmt.toUpperCase()}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Quality selection - only show for PDF/PNG */}
          {format !== "measurements" && (
          <div>
            <label style={labelStyle}>Resolution Quality</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {(["1", "2", "3"] as const).map((q) => {
                const qNum = parseInt(q) as 1 | 2 | 3;
                return (
                  <label
                    key={q}
                    style={{
                      ...optionStyle,
                      background: quality === qNum ? "rgba(34,211,238,0.1)" : "var(--bp-navy)",
                      borderColor: quality === qNum ? "var(--bp-cyan)" : "var(--bp-grid-major)",
                    }}
                  >
                    <input
                      type="radio"
                      name="quality"
                      value={q}
                      checked={quality === qNum}
                      onChange={() => setQuality(qNum)}
                      style={{ cursor: "pointer" }}
                    />
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: quality === qNum ? "var(--bp-cyan)" : "var(--bp-text-primary)" }}>
                      {qualityLabels[qNum]}
                    </span>
                    {qNum === 3 && (
                      <span style={{ marginLeft: "auto", fontFamily: "'Space Mono', monospace", fontSize: 8, color: "var(--bp-dim-yellow)" }}>
                        BEST FOR PRINTING
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
          )}

          {/* Measurements info */}
          {format === "measurements" && (
          <div
            style={{
              background: "var(--bp-navy)",
              border: "1px solid var(--bp-grid-subtle)",
              padding: "10px 12px",
              borderRadius: 2,
              fontFamily: "'Space Mono', monospace",
              fontSize: 9,
              color: "var(--bp-text-primary)",
              lineHeight: 1.6,
            }}
          >
            <div style={{ marginBottom: 6 }}>📊 Detailed Measurements Report</div>
            <div style={{ fontSize: 8, color: "var(--bp-text-muted)" }}>
              Includes room areas, perimeters, and wireframe section data. Exported as PDF.
            </div>
          </div>
          )}

          {/* Metadata checkbox - only show for PDF/PNG */}
          {format !== "measurements" && (
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 10px",
              background: "var(--bp-navy)",
              border: "1px solid var(--bp-grid-subtle)",
              cursor: "pointer",
              transition: "all 160ms",
            }}
          >
            <input
              type="checkbox"
              checked={includeMetadata}
              onChange={(e) => setIncludeMetadata(e.target.checked)}
              style={{ cursor: "pointer" }}
            />
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "var(--bp-text-primary)" }}>
              Include metadata (plan name, dimensions, export date)
            </span>
          </label>
          )}

          {/* File size estimate - only show for PDF/PNG */}
          {format !== "measurements" && (
          <div
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 8,
              color: "var(--bp-text-muted)",
              background: "var(--bp-navy)",
              border: "1px solid var(--bp-grid-subtle)",
              padding: "6px 10px",
              lineHeight: 1.6,
            }}
          >
            {quality === 1 && "Standard quality: ~2-3 MB"}
            {quality === 2 && "High quality: ~4-6 MB (recommended)"}
            {quality === 3 && "Ultra quality: ~8-12 MB (best for printing)"}
          </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button
              className="bp-btn"
              style={{ flex: 1, padding: "8px 0" }}
              onClick={onClose}
              disabled={isExporting}
            >
              CANCEL
            </button>
            <button
              className="bp-btn bp-btn-primary"
              style={{ flex: 2, padding: "8px 0" }}
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 size={12} style={{ display: "inline", marginRight: 4, animation: "spin 1s linear infinite" }} />
                  EXPORTING...
                </>
              ) : (
                <>
                  <Download size={12} style={{ display: "inline", marginRight: 4 }} />
                  EXPORT {format === "measurements" ? "REPORT" : format.toUpperCase()}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scale-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
