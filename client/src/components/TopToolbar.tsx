// ============================================================
// SPACE PLANNER STUDIO — Top Toolbar
// Blueprint Dark Theme: plan management, room focus, dimensions, export
// ============================================================

import React, { useState } from "react";
import {
  Menu,
  Save,
  FolderOpen,
  Plus,
  Trash2,
  ChevronDown,
  Eye,
  Maximize2,
  Settings,
  Download,
  Share2,
  Trash,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { FloorPlan, formatFeetInches, parseFeetInches, generateId } from "@/lib/floorPlanTypes";
import ExportDialog from "./ExportDialog";
import ShareDialog from "./ShareDialog";
import { notifySuccess, notifyError, notifyInfo } from "@/lib/notifications";

interface Props {
  plan: FloorPlan;
  allPlans: FloorPlan[];
  focusedRoomId: string | null;
  onPlanChange: (plan: FloorPlan) => void;
  onSelectPlan: (id: string) => void;
  onNewPlan: () => void;
  onDeletePlan: (id: string) => void;
  onFocusRoom: (roomId: string | null) => void;
  canvasElement?: HTMLElement | null;
  gridSnap?: number;
  onGridSnapChange?: (snap: number) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  showLabels?: boolean;
  onToggleLabels?: (show: boolean) => void;
  isMobile?: boolean;
  onToggleMobilePanel?: () => void;
  selectedPlanIds?: Set<string>;
  onTogglePlanSelection?: (id: string) => void;
  onBulkDelete?: () => void;
  selectMode?: boolean;
  onToggleSelectMode?: () => void;
}

export default function TopToolbar({
  plan,
  allPlans,
  focusedRoomId,
  onPlanChange,
  onSelectPlan,
  onNewPlan,
  onDeletePlan,
  onFocusRoom,
  canvasElement,
  gridSnap = 12,
  onGridSnapChange,
  canUndo = false,
  canRedo = false,
  selectedPlanIds = new Set(),
  onTogglePlanSelection,
  onBulkDelete,
  selectMode = false,
  onToggleSelectMode,
  onUndo,
  onRedo,
  showLabels = true,
  onToggleLabels,
  isMobile = false,
  onToggleMobilePanel,
}: Props) {
  const [showPlansMenu, setShowPlansMenu] = useState(false);
  const [showRoomMenu, setShowRoomMenu] = useState(false);
  const [showDimensions, setShowDimensions] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showGridMenu, setShowGridMenu] = useState(false);
  const [editWidth, setEditWidth] = useState("");
  const [editHeight, setEditHeight] = useState("");
  const [editName, setEditName] = useState("");

  const focusedRoom = plan.rooms.find((r) => r.id === focusedRoomId);

  const handleSaveDimensions = () => {
    const w = parseFeetInches(editWidth);
    const h = parseFeetInches(editHeight);
    if (w === null || h === null || w <= 0 || h <= 0) {
      notifyError("Invalid dimensions. Use format like 30 or 30'6\"");
      return;
    }
    onPlanChange({ ...plan, totalWidth: w, totalHeight: h, updatedAt: Date.now() });
    notifySuccess("Dimensions updated");
    setShowDimensions(false);
  };

  const handleRenamePlan = () => {
    if (!editName.trim()) return;
    onPlanChange({ ...plan, name: editName.trim(), updatedAt: Date.now() });
    setEditName("");
  };

  const closeAllMenus = () => {
    setShowPlansMenu(false);
    setShowRoomMenu(false);
    setShowDimensions(false);
    setShowExport(false);
  };

  return (
    <>
      <div
        style={{
          height: 48,
          background: "var(--bp-navy)",
          borderBottom: "1px solid var(--bp-grid-major)",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: 8,
          flexShrink: 0,
          position: "relative",
          zIndex: 100,
        }}
      >
        {/* Mobile menu button */}
        {isMobile && (
          <button
            className="bp-btn"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px" }}
            onClick={onToggleMobilePanel}
            title="Toggle furniture panel"
          >
            <Menu size={14} />
          </button>
        )}

        {/* Plan selector */}
        <div style={{ position: "relative" }}>
          <button
            className="bp-btn"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px" }}
            onClick={() => { setShowPlansMenu(!showPlansMenu); setShowRoomMenu(false); setShowDimensions(false); setShowExport(false); }}
          >
            <FolderOpen size={12} />
            <span style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {plan.name || "Untitled Plan"}
            </span>
            <ChevronDown size={10} />
          </button>

          {showPlansMenu && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                marginTop: 4,
                background: "var(--bp-panel)",
                border: "1px solid var(--bp-grid-major)",
                minWidth: 220,
                zIndex: 200,
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              }}
            >
              <div style={{ padding: "6px 10px", borderBottom: "1px solid var(--bp-grid-subtle)" }}>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--bp-text-muted)", letterSpacing: "0.1em" }}>
                  SAVED PLANS
                </div>
              </div>
              {allPlans.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "7px 10px",
                    cursor: "pointer",
                    background: p.id === plan.id ? "rgba(34,211,238,0.07)" : "transparent",
                    borderLeft: p.id === plan.id ? "2px solid var(--bp-cyan)" : "2px solid transparent",
                    transition: "background 160ms",
                  }}
                  onMouseEnter={(e) => { if (p.id !== plan.id) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }}
                  onMouseLeave={(e) => { if (p.id !== plan.id) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  {selectedPlanIds && selectedPlanIds.size > 0 && (
                    <Checkbox
                      checked={selectedPlanIds.has(p.id)}
                      onCheckedChange={() => onTogglePlanSelection?.(p.id)}
                      className="mr-2"
                    />
                  )}
                  <div
                    style={{ flex: 1 }}
                    onClick={() => { onSelectPlan(p.id); setShowPlansMenu(false); }}
                  >
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: p.id === plan.id ? "var(--bp-cyan)" : "var(--bp-text-primary)" }}>
                      {p.name}
                    </div>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "var(--bp-text-muted)" }}>
                      {p.rooms.length} rooms · {p.furniture.length} items
                    </div>
                  </div>
                  {allPlans.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeletePlan(p.id); }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--bp-text-muted)", padding: 4 }}
                    >
                      <Trash2 size={10} />
                    </button>
                  )}
                </div>
              ))}
              <div style={{ padding: 8, borderTop: "1px solid var(--bp-grid-subtle)" }}>
                <button
                  className="bp-btn"
                  style={{ width: "100%", fontSize: 10, padding: "5px 0" }}
                  onClick={() => { onNewPlan(); setShowPlansMenu(false); }}
                >
                  <Plus size={10} style={{ display: "inline", marginRight: 4 }} />
                  NEW PLAN
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Rename input */}
        <input
          className="bp-input"
          style={{ width: 140, fontSize: 11, padding: "4px 8px" }}
          placeholder="Rename plan..."
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleRenamePlan(); }}
          onBlur={handleRenamePlan}
        />

        <div style={{ width: 1, height: 24, background: "var(--bp-grid-subtle)", margin: "0 4px" }} />

        {/* Room focus dropdown */}
        <div style={{ position: "relative" }}>
          <button
            className="bp-btn"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              borderColor: focusedRoomId ? "var(--bp-cyan)" : "var(--bp-grid-major)",
              color: focusedRoomId ? "var(--bp-cyan)" : "var(--bp-text-secondary)",
            }}
            onClick={() => { setShowRoomMenu(!showRoomMenu); setShowPlansMenu(false); setShowDimensions(false); setShowExport(false); }}
          >
            <Eye size={12} />
            {focusedRoom ? focusedRoom.name : "GLOBAL VIEW"}
            <ChevronDown size={10} />
          </button>

          {showRoomMenu && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                marginTop: 4,
                background: "var(--bp-panel)",
                border: "1px solid var(--bp-grid-major)",
                minWidth: 200,
                zIndex: 200,
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              }}
            >
              <div
                style={{
                  padding: "7px 10px",
                  cursor: "pointer",
                  borderLeft: !focusedRoomId ? "2px solid var(--bp-cyan)" : "2px solid transparent",
                  background: !focusedRoomId ? "rgba(34,211,238,0.07)" : "transparent",
                }}
                onClick={() => { onFocusRoom(null); setShowRoomMenu(false); }}
              >
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: !focusedRoomId ? "var(--bp-cyan)" : "var(--bp-text-primary)" }}>
                  ⊞ GLOBAL VIEW
                </div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "var(--bp-text-muted)" }}>
                  All rooms visible
                </div>
              </div>
              {plan.rooms.map((room) => (
                <div
                  key={room.id}
                  style={{
                    padding: "7px 10px",
                    cursor: "pointer",
                    borderLeft: focusedRoomId === room.id ? "2px solid var(--bp-cyan)" : "2px solid transparent",
                    background: focusedRoomId === room.id ? "rgba(34,211,238,0.07)" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                  onClick={() => { onFocusRoom(room.id); setShowRoomMenu(false); }}
                >
                  <span style={{ width: 8, height: 8, background: room.color || "#1a2a3a", border: "1px solid var(--bp-wall-dim)", flexShrink: 0 }} />
                  <div>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: focusedRoomId === room.id ? "var(--bp-cyan)" : "var(--bp-text-primary)" }}>
                      {room.name}
                    </div>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "var(--bp-dim-yellow)" }}>
                      {formatFeetInches(room.width)} × {formatFeetInches(room.height)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dimensions editor */}
        <div style={{ position: "relative" }}>
          <button
            className="bp-btn"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px" }}
            onClick={() => {
              setEditWidth(plan.totalWidth ? String(plan.totalWidth) : "");
              setEditHeight(plan.totalHeight ? String(plan.totalHeight) : "");
              setShowDimensions(!showDimensions);
              setShowPlansMenu(false);
              setShowRoomMenu(false);
              setShowExport(false);
            }}
          >
            <Maximize2 size={12} />
            {plan.totalWidth > 0
              ? `${formatFeetInches(plan.totalWidth)} × ${formatFeetInches(plan.totalHeight)}`
              : "SET DIMENSIONS"}
          </button>

          {showDimensions && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                marginTop: 4,
                background: "var(--bp-panel)",
                border: "1px solid var(--bp-grid-major)",
                padding: 12,
                zIndex: 200,
                width: 260,
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              }}
            >
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--bp-text-muted)", marginBottom: 10, letterSpacing: "0.1em" }}>
                OVERRIDE FLOOR PLAN DIMENSIONS
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                <div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--bp-text-muted)", marginBottom: 3 }}>WIDTH (ft)</div>
                  <input
                    className="bp-input"
                    style={{ width: "100%" }}
                    placeholder="e.g. 30"
                    value={editWidth}
                    onChange={(e) => setEditWidth(e.target.value)}
                  />
                </div>
                <div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--bp-text-muted)", marginBottom: 3 }}>DEPTH (ft)</div>
                  <input
                    className="bp-input"
                    style={{ width: "100%" }}
                    placeholder="e.g. 24"
                    value={editHeight}
                    onChange={(e) => setEditHeight(e.target.value)}
                  />
                </div>
              </div>
              <button
                className="bp-btn bp-btn-primary"
                style={{ width: "100%", padding: "6px 0", fontSize: 10 }}
                onClick={handleSaveDimensions}
              >
                APPLY DIMENSIONS
              </button>
            </div>
          )}
        </div>

        {/* Export button */}
        <button
          className="bp-btn"
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px" }}
          onClick={() => { setShowExport(true); setShowPlansMenu(false); setShowRoomMenu(false); setShowDimensions(false); }}
          title="Export floor plan as PDF or PNG"
          disabled={plan.totalWidth === 0}
        >
          <Download size={12} />
          EXPORT
        </button>

        {/* Grid snap dropdown */}
        <div style={{ position: "relative" }}>
          <button
            className="bp-btn"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              borderColor: "var(--bp-grid-major)",
              color: "var(--bp-text-secondary)",
            }}
            onClick={() => { setShowGridMenu(!showGridMenu); setShowPlansMenu(false); setShowRoomMenu(false); setShowDimensions(false); setShowExport(false); }}
            title="Grid snap size"
          >
            <Settings size={12} />
            GRID: {gridSnap}\" 
            <ChevronDown size={10} />
          </button>

          {showGridMenu && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                marginTop: 4,
                background: "var(--bp-panel)",
                border: "1px solid var(--bp-grid-major)",
                minWidth: 120,
                zIndex: 200,
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              }}
            >
              {[1, 3, 6].map((snap) => (
                <div
                  key={snap}
                  style={{
                    padding: "7px 10px",
                    cursor: "pointer",
                    borderLeft: gridSnap === snap ? "2px solid var(--bp-cyan)" : "2px solid transparent",
                    background: gridSnap === snap ? "rgba(34,211,238,0.07)" : "transparent",
                  }}
                  onClick={() => {
                    onGridSnapChange?.(snap);
                    setShowGridMenu(false);
                  }}
                >
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: gridSnap === snap ? "var(--bp-cyan)" : "var(--bp-text-primary)" }}>
                    {snap}\" SNAP
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Undo/Redo buttons */}
        <button
          className="bp-btn"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            opacity: canUndo ? 1 : 0.4,
            cursor: canUndo ? "pointer" : "not-allowed",
          }}
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          ↶ UNDO
        </button>

        <button
          className="bp-btn"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            opacity: canRedo ? 1 : 0.4,
            cursor: canRedo ? "pointer" : "not-allowed",
          }}
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
        >
          ↷ REDO
        </button>

        {/* Labels toggle */}
        <button
          className="bp-btn"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            borderColor: showLabels ? "var(--bp-cyan)" : "var(--bp-grid-major)",
            color: showLabels ? "var(--bp-cyan)" : "var(--bp-text-secondary)",
          }}
          onClick={() => onToggleLabels?.(!showLabels)}
          title="Toggle dimension labels (Ctrl+L)"
        >
          <Eye size={12} />
          LABELS
        </button>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Plan stats */}
        {plan.totalWidth > 0 && (
          <div
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 9,
              color: "var(--bp-text-muted)",
              display: "flex",
              gap: 16,
            }}
          >
            <span>{plan.rooms.length} ROOMS</span>
            <span>{plan.furniture.length} ITEMS</span>
            <span style={{ color: "var(--bp-dim-yellow)" }}>
              {(plan.totalWidth * plan.totalHeight).toFixed(0)} SQ FT
            </span>
          </div>
        )}

        {/* Share button */}
        <button
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            background: "transparent",
            border: "1px solid var(--bp-grid-major)",
            borderRadius: 4,
            cursor: "pointer",
            color: "var(--bp-text-secondary)",
            fontFamily: "'Space Mono', monospace",
            fontSize: 10,
            transition: "all 150ms ease-out",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--bp-cyan)";
            e.currentTarget.style.color = "var(--bp-cyan)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--bp-grid-major)";
            e.currentTarget.style.color = "var(--bp-text-secondary)";
          }}
          onClick={() => { setShowShare(true); closeAllMenus(); }}
        >
          <Share2 size={12} />
          SHARE
        </button>

        {/* Close menus on outside click */}
        {(showPlansMenu || showRoomMenu || showDimensions || showExport) && (
          <div
            style={{ position: "fixed", inset: 0, zIndex: 150 }}
            onClick={closeAllMenus}
          />
        )}
      </div>

      {/* Export dialog */}
      {showExport && canvasElement && (
        <ExportDialog
          plan={plan}
          canvasElement={canvasElement}
          planId={plan.id}
          onClose={() => setShowExport(false)}
        />
      )}

      {/* Share dialog */}
      {showShare && (
        <ShareDialog
          floorPlanId={plan.id}
          floorPlanName={plan.name}
          onClose={() => setShowShare(false)}
        />
      )}
    </>
  );
}
