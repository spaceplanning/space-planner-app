// ============================================================
// SPACE PLANNER STUDIO — Custom Furniture Creator Dialog
// Blueprint Dark Theme
// ============================================================

import React, { useState } from "react";
import { X, Plus } from "lucide-react";
import { FurnitureTemplate, FurnitureCategory, FURNITURE_CATEGORIES } from "@/lib/furnitureData";
import { generateId } from "@/lib/floorPlanTypes";
import { parseFeetInches } from "@/lib/floorPlanTypes";
import { notifySuccess, notifyError, notifyInfo } from "@/lib/notifications";

interface Props {
  onSave: (item: FurnitureTemplate) => void;
  onClose: () => void;
}

export default function CustomFurnitureDialog({ onSave, onClose }: Props) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<FurnitureCategory>("Custom");
  const [widthStr, setWidthStr] = useState("3'0\"");
  const [depthStr, setDepthStr] = useState("2'0\"");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required";
    const w = parseFeetInches(widthStr);
    const d = parseFeetInches(depthStr);
    if (w === null || w <= 0) errs.width = "Enter a valid width (e.g. 5'0\" or 5.5)";
    if (d === null || d <= 0) errs.depth = "Enter a valid depth (e.g. 6'8\" or 6.67)";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const w = parseFeetInches(widthStr)!;
    const d = parseFeetInches(depthStr)!;
    const item: FurnitureTemplate = {
      id: `custom-${generateId()}`,
      name: name.trim(),
      category,
      widthFt: Math.round(w * 100) / 100,
      depthFt: Math.round(d * 100) / 100,
      isCustom: true,
    };
    onSave(item);
    notifySuccess(`"${item.name}" saved to your profile`);
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    fontFamily: "'Space Mono', monospace",
    fontSize: 12,
    background: "var(--bp-navy)",
    border: "1px solid var(--bp-grid-major)",
    color: "var(--bp-text-primary)",
    padding: "7px 10px",
    outline: "none",
    width: "100%",
    transition: "border-color 160ms",
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "'Space Mono', monospace",
    fontSize: 9,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--bp-text-muted)",
    display: "block",
    marginBottom: 4,
  };

  const errorStyle: React.CSSProperties = {
    fontFamily: "'Space Mono', monospace",
    fontSize: 9,
    color: "var(--bp-red)",
    marginTop: 3,
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
              + CUSTOM FURNITURE PROFILE
            </div>
            <div
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 9,
                color: "var(--bp-text-muted)",
                marginTop: 2,
              }}
            >
              SAVED TO LOCAL PROFILE · PERSISTS ACROSS SESSIONS
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

        {/* Form */}
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Name */}
          <div>
            <label style={labelStyle}>Furniture Name</label>
            <input
              style={{
                ...inputStyle,
                borderColor: errors.name ? "var(--bp-red)" : "var(--bp-grid-major)",
              }}
                placeholder="e.g. My Queen Bed"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = "var(--bp-cyan)")}
              onBlur={(e) => (e.target.style.borderColor = errors.name ? "var(--bp-red)" : "var(--bp-grid-major)")}
            />
            {errors.name && <div style={errorStyle}>{errors.name}</div>}
          </div>

          {/* Category */}
          <div>
            <label style={labelStyle}>Category</label>
            <select
              style={{
                ...inputStyle,
                appearance: "none",
                cursor: "pointer",
              }}
              value={category}
              onChange={(e) => setCategory(e.target.value as FurnitureCategory)}
            >
              {FURNITURE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat} style={{ background: "var(--bp-navy)" }}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Dimensions */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={labelStyle}>Width</label>
              <input
                style={{
                  ...inputStyle,
                  borderColor: errors.width ? "var(--bp-red)" : "var(--bp-grid-major)",
                }}
                placeholder="5ft 0in"
                value={widthStr}
                onChange={(e) => setWidthStr(e.target.value)}
                onFocus={(e) => (e.target.style.borderColor = "var(--bp-cyan)")}
                onBlur={(e) => (e.target.style.borderColor = errors.width ? "var(--bp-red)" : "var(--bp-grid-major)")}
              />
              {errors.width && <div style={errorStyle}>{errors.width}</div>}
            </div>
            <div>
              <label style={labelStyle}>Depth</label>
              <input
                style={{
                  ...inputStyle,
                  borderColor: errors.depth ? "var(--bp-red)" : "var(--bp-grid-major)",
                }}
                placeholder="6ft 8in"
                value={depthStr}
                onChange={(e) => setDepthStr(e.target.value)}
                onFocus={(e) => (e.target.style.borderColor = "var(--bp-cyan)")}
                onBlur={(e) => (e.target.style.borderColor = errors.depth ? "var(--bp-red)" : "var(--bp-grid-major)")}
              />
              {errors.depth && <div style={errorStyle}>{errors.depth}</div>}
            </div>
          </div>

          {/* Format hint */}
          <div
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 9,
              color: "var(--bp-text-muted)",
              background: "var(--bp-navy)",
              border: "1px solid var(--bp-grid-subtle)",
              padding: "6px 10px",
              lineHeight: 1.6,
            }}
          >
            ACCEPTED FORMATS: 5ft0in · 5.5 · 66in (auto-converted)
          </div>

          {/* Preview */}
          {parseFeetInches(widthStr) && parseFeetInches(depthStr) && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "8px 10px",
                border: "1px solid var(--bp-grid-major)",
                background: "var(--bp-navy)",
              }}
            >
              <div
                style={{
                  width: Math.min(60, (parseFeetInches(widthStr) || 1) * 8),
                  height: Math.min(50, (parseFeetInches(depthStr) || 1) * 8),
                  background: "rgba(34,211,238,0.2)",
                  border: "1px solid var(--bp-cyan)",
                  flexShrink: 0,
                }}
              />
              <div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "var(--bp-text-primary)" }}>
                  {name || "UNNAMED"}
                </div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--bp-dim-yellow)" }}>
                  {parseFeetInches(widthStr)?.toFixed(2)}' × {parseFeetInches(depthStr)?.toFixed(2)}'
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button
              className="bp-btn"
              style={{ flex: 1, padding: "8px 0" }}
              onClick={onClose}
            >
              CANCEL
            </button>
            <button
              className="bp-btn bp-btn-primary"
              style={{ flex: 2, padding: "8px 0" }}
              onClick={handleSave}
            >
              <Plus size={12} style={{ display: "inline", marginRight: 4 }} />
              SAVE TO PROFILE
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scale-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
