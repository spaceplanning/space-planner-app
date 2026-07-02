// ============================================================
// SPACE PLANNER STUDIO — Furniture Customize Dialog
// Blueprint Dark Theme: customize existing furniture with new name and dimensions
// ============================================================

import React, { useState } from "react";
import { X, Copy } from "lucide-react";
import { FurnitureTemplate, createCustomFurniture } from "@/lib/furnitureData";
import { notifySuccess, notifyError, notifyInfo } from "@/lib/notifications";

interface Props {
  furniture: FurnitureTemplate;
  onSave: (customFurniture: FurnitureTemplate) => void;
  onClose: () => void;
}

export default function FurnitureCustomizeDialog({ furniture, onSave, onClose }: Props) {
  const [customName, setCustomName] = useState(`${furniture.name} (Custom)`);
  const [customWidth, setCustomWidth] = useState(furniture.widthFt.toString());
  const [customDepth, setCustomDepth] = useState(furniture.depthFt.toString());

  const handleSave = () => {
    if (!customName.trim()) {
      notifyError("Please enter a name");
      return;
    }

    const w = parseFloat(customWidth);
    const d = parseFloat(customDepth);

    if (isNaN(w) || isNaN(d) || w <= 0 || d <= 0) {
      notifyError("Dimensions must be positive numbers");
      return;
    }

    const custom = createCustomFurniture(furniture, customName.trim(), w, d);
    onSave(custom);
    notifySuccess(`Created custom furniture: ${customName}`);
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 300,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bp-panel)",
          border: "1px solid var(--bp-cyan)",
          borderRadius: 2,
          padding: 20,
          maxWidth: 420,
          width: "90%",
          boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
            paddingBottom: 12,
            borderBottom: "1px solid var(--bp-grid-subtle)",
          }}
        >
          <div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700, color: "var(--bp-cyan)", letterSpacing: "0.1em" }}>
              CUSTOMIZE FURNITURE
            </div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--bp-text-muted)", marginTop: 4 }}>
              Based on: {furniture.name}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--bp-text-muted)", padding: 4 }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Original dimensions */}
        <div
          style={{
            background: "var(--bp-navy)",
            border: "1px solid var(--bp-grid-subtle)",
            padding: 10,
            marginBottom: 16,
            borderRadius: 2,
          }}
        >
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "var(--bp-text-muted)", marginBottom: 6, letterSpacing: "0.1em" }}>
            ORIGINAL DIMENSIONS
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "var(--bp-text-muted)", marginBottom: 3 }}>WIDTH</div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 700, color: "var(--bp-dim-yellow)" }}>
                {furniture.widthFt.toFixed(2)}'
              </div>
            </div>
            <div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "var(--bp-text-muted)", marginBottom: 3 }}>DEPTH</div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 700, color: "var(--bp-dim-yellow)" }}>
                {furniture.depthFt.toFixed(2)}'
              </div>
            </div>
          </div>
        </div>

        {/* Custom name */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--bp-text-muted)", display: "block", marginBottom: 6, letterSpacing: "0.1em" }}>
            CUSTOM NAME
          </label>
          <input
            className="bp-input"
            style={{ width: "100%", padding: "8px 10px", fontSize: 11 }}
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="e.g., My Oversized Couch"
          />
        </div>

        {/* Custom dimensions */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--bp-text-muted)", display: "block", marginBottom: 6, letterSpacing: "0.1em" }}>
            CUSTOM DIMENSIONS (feet)
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "var(--bp-text-muted)", marginBottom: 4 }}>WIDTH</div>
              <input
                className="bp-input"
                type="number"
                step="0.25"
                min="0.5"
                max="20"
                style={{ width: "100%", padding: "6px 8px", fontSize: 10 }}
                value={customWidth}
                onChange={(e) => setCustomWidth(e.target.value)}
              />
            </div>
            <div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "var(--bp-text-muted)", marginBottom: 4 }}>DEPTH</div>
              <input
                className="bp-input"
                type="number"
                step="0.25"
                min="0.5"
                max="20"
                style={{ width: "100%", padding: "6px 8px", fontSize: 10 }}
                value={customDepth}
                onChange={(e) => setCustomDepth(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div
          style={{
            background: "var(--bp-navy)",
            border: "1px solid var(--bp-grid-subtle)",
            padding: 10,
            marginBottom: 16,
            borderRadius: 2,
          }}
        >
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "var(--bp-text-muted)", marginBottom: 6, letterSpacing: "0.1em" }}>
            PREVIEW
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "var(--bp-text-muted)", marginBottom: 3 }}>NEW WIDTH</div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 700, color: "var(--bp-cyan)" }}>
                {parseFloat(customWidth).toFixed(2)}'
              </div>
            </div>
            <div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "var(--bp-text-muted)", marginBottom: 3 }}>NEW DEPTH</div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 700, color: "var(--bp-cyan)" }}>
                {parseFloat(customDepth).toFixed(2)}'
              </div>
            </div>
          </div>
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--bp-grid-subtle)" }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "var(--bp-text-muted)", marginBottom: 3 }}>AREA</div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700, color: "var(--bp-dim-yellow)" }}>
              {(parseFloat(customWidth) * parseFloat(customDepth)).toFixed(2)} sq ft
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="bp-btn"
            style={{ flex: 1, padding: "8px 0", fontSize: 10 }}
            onClick={onClose}
          >
            CANCEL
          </button>
          <button
            className="bp-btn bp-btn-primary"
            style={{ flex: 1, padding: "8px 0", fontSize: 10 }}
            onClick={handleSave}
          >
            <Copy size={10} style={{ display: "inline", marginRight: 4 }} />
            SAVE AS CUSTOM
          </button>
        </div>

        {/* Info */}
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "var(--bp-text-muted)", marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--bp-grid-subtle)" }}>
          Custom furniture will be saved to your library and available for future projects.
        </div>
      </div>
    </div>
  );
}
