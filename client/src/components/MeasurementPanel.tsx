// ============================================================
// SPACE PLANNER STUDIO — Measurement Panel
// Blueprint Dark Theme: display measurement results and controls
// ============================================================

import React from "react";
import { X, Trash2, Copy } from "lucide-react";
import {
  calculateDistance,
  calculateArea,
  calculatePerimeter,
  formatMeasurement,
  MeasurementResult,
} from "@/lib/measurementUtils";
import { notifySuccess, notifyError, notifyInfo } from "@/lib/notifications";

interface Props {
  points: Array<{ x: number; y: number }>;
  onClear: () => void;
  onUndo: () => void;
  onClose: () => void;
}

export default function MeasurementPanel({ points, onClear, onUndo, onClose }: Props) {
  let result: MeasurementResult | null = null;

  if (points.length === 2) {
    const dist = calculateDistance(points[0].x, points[0].y, points[1].x, points[1].y);
    result = {
      type: "distance",
      value: dist,
      unit: "ft",
      points: [
        { x: points[0].x, y: points[0].y, label: "A" },
        { x: points[1].x, y: points[1].y, label: "B" },
      ],
    };
  } else if (points.length >= 3) {
    const area = calculateArea(points);
    const perimeter = calculatePerimeter(points);
    result = {
      type: "area",
      value: area,
      unit: "sq ft",
      points: points.map((p, i) => ({
        x: p.x,
        y: p.y,
        label: String.fromCharCode(65 + i),
      })),
      perimeter,
    };
  }

  const handleCopyResult = () => {
    if (!result) return;
    let text = "";
    if (result.type === "distance") {
      text = `Distance: ${formatMeasurement(result.value)}`;
    } else {
      text = `Area: ${result.value.toFixed(1)} sq ft\nPerimeter: ${formatMeasurement(result.perimeter || 0)}`;
    }
    navigator.clipboard.writeText(text);
    notifySuccess("Copied to clipboard");
  };

  return (
    <div
      style={{
        position: "absolute",
        bottom: 16,
        left: 16,
        background: "var(--bp-panel)",
        border: "1px solid var(--bp-cyan)",
        borderRadius: 2,
        padding: 12,
        minWidth: 280,
        maxWidth: 320,
        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        zIndex: 50,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
          paddingBottom: 8,
          borderBottom: "1px solid var(--bp-grid-subtle)",
        }}
      >
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700, color: "var(--bp-cyan)", letterSpacing: "0.1em" }}>
          📏 MEASUREMENT TOOL
        </div>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--bp-text-muted)", padding: 2 }}
        >
          <X size={12} />
        </button>
      </div>

      {/* Instructions */}
      {points.length === 0 && (
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--bp-text-muted)", lineHeight: 1.6 }}>
          <span style={{ color: "var(--bp-cyan)" }}>CLICK 2 POINTS</span> to measure distance
          <br />
          <span style={{ color: "var(--bp-dim-yellow)" }}>CLICK 3+ POINTS</span> to measure area
          <br />
          <span style={{ color: "var(--bp-text-muted)", fontSize: 8 }}>Press ESC to cancel</span>
        </div>
      )}

      {/* Points list */}
      {points.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "var(--bp-text-muted)", marginBottom: 6, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            POINTS ({points.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {points.map((p, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "4px 6px",
                  background: "var(--bp-navy)",
                  border: "1px solid var(--bp-grid-subtle)",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 9,
                }}
              >
                <span
                  style={{
                    width: 18,
                    height: 18,
                    background: "var(--bp-cyan)",
                    color: "var(--bp-navy)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 8,
                    flexShrink: 0,
                  }}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span style={{ color: "var(--bp-text-primary)" }}>
                  {p.x.toFixed(1)}' × {p.y.toFixed(1)}'
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div
          style={{
            background: "var(--bp-navy)",
            border: "1px solid var(--bp-cyan)",
            padding: 10,
            marginBottom: 10,
            borderRadius: 2,
          }}
        >
          {result.type === "distance" && (
            <>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "var(--bp-text-muted)", marginBottom: 4, letterSpacing: "0.1em" }}>
                DISTANCE (A → B)
              </div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 18, fontWeight: 700, color: "var(--bp-cyan)", marginBottom: 4 }}>
                {formatMeasurement(result.value)}
              </div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "var(--bp-text-muted)" }}>
                {result.value.toFixed(2)} feet
              </div>
            </>
          )}

          {result.type === "area" && (
            <>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "var(--bp-text-muted)", marginBottom: 4, letterSpacing: "0.1em" }}>
                AREA
              </div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 18, fontWeight: 700, color: "var(--bp-cyan)", marginBottom: 6 }}>
                {result.value.toFixed(1)} sq ft
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 6,
                  paddingTop: 6,
                  borderTop: "1px solid var(--bp-grid-subtle)",
                }}
              >
                <div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 7, color: "var(--bp-text-muted)", marginBottom: 2 }}>
                    PERIMETER
                  </div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700, color: "var(--bp-dim-yellow)" }}>
                    {formatMeasurement(result.perimeter || 0)}
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 7, color: "var(--bp-text-muted)", marginBottom: 2 }}>
                    POINTS
                  </div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700, color: "var(--bp-dim-yellow)" }}>
                    {points.length}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 6 }}>
        {result && (
          <button
            className="bp-btn"
            style={{ flex: 1, padding: "5px 0", fontSize: 9 }}
            onClick={handleCopyResult}
            title="Copy result to clipboard"
          >
            <Copy size={10} style={{ display: "inline", marginRight: 3 }} />
            COPY
          </button>
        )}
        {points.length > 0 && (
          <button
            className="bp-btn"
            style={{ flex: 1, padding: "5px 0", fontSize: 9 }}
            onClick={onUndo}
            title="Remove last point"
          >
            ↶ UNDO
          </button>
        )}
        {points.length > 0 && (
          <button
            className="bp-btn"
            style={{ flex: 1, padding: "5px 0", fontSize: 9, borderColor: "var(--bp-red)", color: "var(--bp-red)" }}
            onClick={onClear}
            title="Clear all points"
          >
            <Trash2 size={10} style={{ display: "inline", marginRight: 3 }} />
            CLEAR
          </button>
        )}
      </div>

      {/* Hint */}
      {points.length > 0 && (
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 7, color: "var(--bp-text-muted)", marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--bp-grid-subtle)" }}>
          {points.length === 1 && "Click another point to measure distance"}
          {points.length === 2 && "Click more points to measure area, or CLEAR to start over"}
          {points.length >= 3 && "Click more points to add to polygon, or CLEAR to start over"}
        </div>
      )}
    </div>
  );
}
