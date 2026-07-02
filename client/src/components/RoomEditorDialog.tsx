// ============================================================
// SPACE PLANNER STUDIO — Room Editor Dialog
// Blueprint Dark Theme: edit room name, position, dimensions
// ============================================================

import React, { useState } from "react";
import { X, Check } from "lucide-react";
import { Room, parseFeetInches, formatFeetInches } from "@/lib/floorPlanTypes";
import { notifySuccess, notifyError, notifyInfo } from "@/lib/notifications";

interface Props {
  room: Room;
  onSave: (room: Room) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export default function RoomEditorDialog({ room, onSave, onDelete, onClose }: Props) {
  const [name, setName] = useState(room.name);
  const [xStr, setXStr] = useState(String(room.x));
  const [yStr, setYStr] = useState(String(room.y));
  const [wStr, setWStr] = useState(String(room.width));
  const [hStr, setHStr] = useState(String(room.height));

  const handleSave = () => {
    const x = parseFeetInches(xStr);
    const y = parseFeetInches(yStr);
    const w = parseFeetInches(wStr);
    const h = parseFeetInches(hStr);
    if (x === null || y === null || w === null || h === null || w <= 0 || h <= 0) {
      notifyError("Invalid dimensions");
      return;
    }
    onSave({ ...room, name: name.trim().toUpperCase() || room.name, x, y, width: w, height: h });
    notifySuccess("Room updated");
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    fontFamily: "'Space Mono', monospace",
    fontSize: 12,
    background: "var(--bp-navy)",
    border: "1px solid var(--bp-grid-major)",
    color: "var(--bp-text-primary)",
    padding: "6px 8px",
    outline: "none",
    width: "100%",
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "'Space Mono', monospace",
    fontSize: 9,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    color: "var(--bp-text-muted)",
    display: "block",
    marginBottom: 3,
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10,22,40,0.8)",
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
          border: "1px solid var(--bp-grid-major)",
          width: 340,
          maxWidth: "90vw",
          animation: "scale-in 200ms cubic-bezier(0.23, 1, 0.32, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "12px 14px",
            borderBottom: "1px solid var(--bp-grid-major)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "var(--bp-cyan)", fontWeight: 700, letterSpacing: "0.1em" }}>
            EDIT ROOM
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--bp-text-muted)", padding: 2 }}>
            <X size={12} />
          </button>
        </div>

        <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={labelStyle}>Room Name</label>
            <input
              style={inputStyle}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = "var(--bp-cyan)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--bp-grid-major)")}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <label style={labelStyle}>Width (ft)</label>
              <input style={inputStyle} value={wStr} onChange={(e) => setWStr(e.target.value)}
                onFocus={(e) => (e.target.style.borderColor = "var(--bp-cyan)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--bp-grid-major)")} />
            </div>
            <div>
              <label style={labelStyle}>Height (ft)</label>
              <input style={inputStyle} value={hStr} onChange={(e) => setHStr(e.target.value)}
                onFocus={(e) => (e.target.style.borderColor = "var(--bp-cyan)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--bp-grid-major)")} />
            </div>
            <div>
              <label style={labelStyle}>X Position (ft)</label>
              <input style={inputStyle} value={xStr} onChange={(e) => setXStr(e.target.value)}
                onFocus={(e) => (e.target.style.borderColor = "var(--bp-cyan)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--bp-grid-major)")} />
            </div>
            <div>
              <label style={labelStyle}>Y Position (ft)</label>
              <input style={inputStyle} value={yStr} onChange={(e) => setYStr(e.target.value)}
                onFocus={(e) => (e.target.style.borderColor = "var(--bp-cyan)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--bp-grid-major)")} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              style={{
                flex: 1,
                padding: "7px 0",
                fontFamily: "'Space Mono', monospace",
                fontSize: 10,
                background: "none",
                border: "1px solid var(--bp-red)",
                color: "var(--bp-red)",
                cursor: "pointer",
                transition: "all 160ms",
              }}
              onClick={() => { onDelete(room.id); onClose(); }}
            >
              DELETE ROOM
            </button>
            <button
              style={{
                flex: 2,
                padding: "7px 0",
                fontFamily: "'Space Mono', monospace",
                fontSize: 10,
                background: "var(--bp-cyan-dim)",
                border: "1px solid var(--bp-cyan)",
                color: "var(--bp-navy)",
                cursor: "pointer",
                fontWeight: 600,
                transition: "all 160ms",
              }}
              onClick={handleSave}
            >
              <Check size={11} style={{ display: "inline", marginRight: 4 }} />
              SAVE CHANGES
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
