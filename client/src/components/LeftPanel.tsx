// ============================================================
// SPACE PLANNER STUDIO — Left Control Panel
// Blueprint Dark Theme: upload, room nav, furniture library
// ============================================================

import React, { useRef, useState, useCallback } from "react";
import {
  Upload,
  Layers,
  Package,
  Plus,
  ChevronDown,
  ChevronRight,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Trash2,
  LayoutGrid,
} from "lucide-react";
import { FloorPlan, Room } from "@/lib/floorPlanTypes";
import {
  FurnitureTemplate,
  FurnitureCategory,
  FURNITURE_CATEGORIES,
  CATEGORY_COLORS,
} from "@/lib/furnitureData";
import { parseFloorPlanImage, generateDemoFloorPlan, ParseProgress } from "@/lib/imageParsing";
import { toast } from "sonner";

interface Props {
  plan: FloorPlan;
  allFurniture: FurnitureTemplate[];
  focusedRoomId: string | null;
  onPlanChange: (plan: FloorPlan) => void;
  onFocusRoom: (roomId: string | null) => void;
  onDragFurniture: (item: FurnitureTemplate) => void;
  onAddCustomFurniture: () => void;
  onDeleteCustomFurniture: (id: string) => void;
}

export default function LeftPanel({
  plan,
  allFurniture,
  focusedRoomId,
  onPlanChange,
  onFocusRoom,
  onDragFurniture,
  onAddCustomFurniture,
  onDeleteCustomFurniture,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [parseProgress, setParseProgress] = useState<ParseProgress | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    upload: true,
    rooms: true,
    library: true,
  });
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    Bedroom: true,
    "Living Room": true,
  });
  const [activeTab, setActiveTab] = useState<"library" | "rooms">("library");
  const [librarySearch, setLibrarySearch] = useState("");

  const toggleSection = (key: string) =>
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  const toggleCategory = (cat: string) =>
    setExpandedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));

  const processFile = useCallback(
    async (file: File) => {
      const allowed = ["image/png", "image/jpeg", "image/jpg", "application/pdf"];
      if (!allowed.includes(file.type)) {
        toast.error("Unsupported file type. Please upload PNG, JPEG, or PDF.");
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        toast.error("File too large. Maximum 20MB.");
        return;
      }

      try {
        const result = await parseFloorPlanImage(file, (progress) => {
          setParseProgress(progress);
        });

        const newPlan: FloorPlan = {
          ...plan,
          totalWidth: result.totalWidth,
          totalHeight: result.totalHeight,
          rooms: result.rooms,
          updatedAt: Date.now(),
        };
        onPlanChange(newPlan);
        toast.success(`Floor plan parsed: ${result.rooms.length} rooms detected`);
        setTimeout(() => setParseProgress(null), 2000);
      } catch (err) {
        setParseProgress({ stage: "error", message: (err as Error).message, progress: 0 });
        toast.error((err as Error).message);
        setTimeout(() => setParseProgress(null), 4000);
      }
    },
    [plan, onPlanChange]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const loadDemo = () => {
    const demo = generateDemoFloorPlan();
    onPlanChange({
      ...plan,
      totalWidth: demo.totalWidth,
      totalHeight: demo.totalHeight,
      rooms: demo.rooms,
      updatedAt: Date.now(),
    });
    toast.success("Demo floor plan loaded");
  };

  const filteredFurniture = allFurniture.filter((f) =>
    librarySearch === "" ||
    f.name.toLowerCase().includes(librarySearch.toLowerCase()) ||
    f.category.toLowerCase().includes(librarySearch.toLowerCase())
  );

  const grouped = FURNITURE_CATEGORIES.reduce<Record<string, FurnitureTemplate[]>>(
    (acc, cat) => {
      acc[cat] = filteredFurniture.filter((f) => f.category === cat);
      return acc;
    },
    {}
  );

  const progressColor =
    parseProgress?.stage === "error"
      ? "var(--bp-red)"
      : parseProgress?.stage === "complete"
      ? "var(--bp-green)"
      : "var(--bp-cyan)";

  return (
    <div
      style={{
        width: 280,
        minWidth: 280,
        height: "100%",
        background: "var(--bp-panel)",
        borderRight: "1px solid var(--bp-grid-major)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* App header */}
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid var(--bp-grid-major)",
          background: "var(--bp-navy)",
        }}
      >
        <div
          style={{
            fontFamily: "'Space Mono', monospace",
            fontWeight: 700,
            fontSize: 13,
            color: "var(--bp-cyan)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          ⊞ Space Planner
        </div>
        <div
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 9,
            color: "var(--bp-text-muted)",
            letterSpacing: "0.1em",
            marginTop: 2,
          }}
        >
          STUDIO v1.0 — BLUEPRINT MODE
        </div>
      </div>

      {/* Upload section */}
      <div style={{ borderBottom: "1px solid var(--bp-grid-subtle)" }}>
        <button
          className="bp-section-header"
          style={{ width: "100%", background: "none", border: "none", cursor: "pointer" }}
          onClick={() => toggleSection("upload")}
        >
          <Upload size={10} style={{ color: "var(--bp-cyan)" }} />
          BLUEPRINT UPLOAD
          <span style={{ marginLeft: "auto" }}>
            {expandedSections.upload ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          </span>
        </button>

        {expandedSections.upload && (
          <div style={{ padding: "8px 12px 12px" }}>
            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
              onDragLeave={() => setIsDraggingFile(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `1px dashed ${isDraggingFile ? "var(--bp-cyan)" : "var(--bp-grid-major)"}`,
                background: isDraggingFile ? "rgba(34,211,238,0.05)" : "var(--bp-navy)",
                padding: "16px 12px",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 200ms",
                marginBottom: 8,
              }}
            >
              <Upload
                size={20}
                style={{ color: isDraggingFile ? "var(--bp-cyan)" : "var(--bp-text-muted)", margin: "0 auto 8px" }}
              />
              <div
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 10,
                  color: isDraggingFile ? "var(--bp-cyan)" : "var(--bp-text-muted)",
                  lineHeight: 1.5,
                }}
              >
                DROP BLUEPRINT HERE
                <br />
                <span style={{ fontSize: 9, opacity: 0.7 }}>PDF · PNG · JPEG</span>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              style={{ display: "none" }}
              onChange={handleFileInput}
            />

            {/* Progress indicator */}
            {parseProgress && (
              <div style={{ marginBottom: 8 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 4,
                  }}
                >
                  {parseProgress.stage === "error" ? (
                    <AlertCircle size={12} style={{ color: "var(--bp-red)" }} />
                  ) : parseProgress.stage === "complete" ? (
                    <CheckCircle size={12} style={{ color: "var(--bp-green)" }} />
                  ) : (
                    <Loader2 size={12} style={{ color: "var(--bp-cyan)", animation: "spin 1s linear infinite" }} />
                  )}
                  <span
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 9,
                      color: progressColor,
                    }}
                  >
                    {parseProgress.message}
                  </span>
                </div>
                <div
                  style={{
                    height: 2,
                    background: "var(--bp-grid-subtle)",
                    borderRadius: 1,
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${parseProgress.progress}%`,
                      background: progressColor,
                      transition: "width 300ms",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Demo button */}
            <button
              className="bp-btn"
              style={{ width: "100%", fontSize: 10, padding: "5px 0" }}
              onClick={loadDemo}
            >
              <LayoutGrid size={10} style={{ display: "inline", marginRight: 4 }} />
              LOAD DEMO FLOOR PLAN
            </button>
          </div>
        )}
      </div>

      {/* Tab switcher */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--bp-grid-major)",
        }}
      >
        {(["library", "rooms"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: "8px 0",
              fontFamily: "'Space Mono', monospace",
              fontSize: 9,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              background: "none",
              border: "none",
              borderBottom: activeTab === tab ? "2px solid var(--bp-cyan)" : "2px solid transparent",
              color: activeTab === tab ? "var(--bp-cyan)" : "var(--bp-text-muted)",
              cursor: "pointer",
              transition: "all 160ms",
            }}
          >
            {tab === "library" ? (
              <>
                <Package size={10} style={{ display: "inline", marginRight: 4 }} />
                FURNITURE
              </>
            ) : (
              <>
                <Layers size={10} style={{ display: "inline", marginRight: 4 }} />
                ROOMS
              </>
            )}
          </button>
        ))}
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        {/* Furniture Library Tab */}
        {activeTab === "library" && (
          <div>
            {/* Search */}
            <div style={{ padding: "8px 12px" }}>
              <input
                className="bp-input"
                style={{ width: "100%", fontSize: 11 }}
                placeholder="Search furniture..."
                value={librarySearch}
                onChange={(e) => setLibrarySearch(e.target.value)}
              />
            </div>

            {/* Add custom */}
            <div style={{ padding: "0 12px 8px" }}>
              <button
                className="bp-btn bp-btn-primary"
                style={{ width: "100%", fontSize: 10, padding: "5px 0" }}
                onClick={onAddCustomFurniture}
              >
                <Plus size={10} style={{ display: "inline", marginRight: 4 }} />
                ADD CUSTOM FURNITURE
              </button>
            </div>

            {/* Categories */}
            {FURNITURE_CATEGORIES.map((cat) => {
              const items = grouped[cat] || [];
              if (items.length === 0) return null;
              const catColor = CATEGORY_COLORS[cat] || "#22d3ee";
              return (
                <div key={cat} style={{ borderBottom: "1px solid var(--bp-grid-subtle)" }}>
                  <button
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 12px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 9,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: catColor,
                    }}
                    onClick={() => toggleCategory(cat)}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        background: catColor,
                        flexShrink: 0,
                        opacity: 0.7,
                      }}
                    />
                    {cat}
                    <span style={{ marginLeft: "auto", color: "var(--bp-text-muted)" }}>
                      {items.length}
                      {expandedCategories[cat] ? (
                        <ChevronDown size={10} style={{ display: "inline", marginLeft: 4 }} />
                      ) : (
                        <ChevronRight size={10} style={{ display: "inline", marginLeft: 4 }} />
                      )}
                    </span>
                  </button>

                  {expandedCategories[cat] && (
                    <div style={{ padding: "0 12px 8px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="furniture-item"
                          draggable
                          onDragStart={() => onDragFurniture(item)}
                          title={`${item.name}\n${item.widthFt}' × ${item.depthFt}'`}
                        >
                          {/* Mini preview */}
                          <div
                            style={{
                              width: "100%",
                              aspectRatio: `${item.widthFt} / ${item.depthFt}`,
                              maxHeight: 40,
                              background: catColor,
                              opacity: 0.25,
                              border: `1px solid ${catColor}`,
                              marginBottom: 4,
                            }}
                          />
                          <div
                            style={{
                              fontFamily: "'Space Mono', monospace",
                              fontSize: 9,
                              color: "var(--bp-text-primary)",
                              lineHeight: 1.3,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.name}
                          </div>
                          <div
                            style={{
                              fontFamily: "'Space Mono', monospace",
                              fontSize: 8,
                              color: "var(--bp-text-muted)",
                            }}
                          >
                            {item.widthFt}' × {item.depthFt}'
                          </div>
                          {item.isCustom && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteCustomFurniture(item.id);
                              }}
                              style={{
                                position: "absolute",
                                top: 2,
                                right: 2,
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: "var(--bp-red)",
                                padding: 2,
                              }}
                              title="Delete custom item"
                            >
                              <Trash2 size={8} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Rooms Tab */}
        {activeTab === "rooms" && (
          <div>
            <div style={{ padding: "8px 12px" }}>
              <button
                className="bp-btn"
                style={{
                  width: "100%",
                  fontSize: 10,
                  padding: "5px 0",
                  borderColor: focusedRoomId ? "var(--bp-cyan)" : "var(--bp-grid-major)",
                  color: focusedRoomId ? "var(--bp-cyan)" : "var(--bp-text-muted)",
                }}
                onClick={() => onFocusRoom(null)}
              >
                <Eye size={10} style={{ display: "inline", marginRight: 4 }} />
                GLOBAL VIEW (ALL ROOMS)
              </button>
            </div>

            {plan.rooms.length === 0 ? (
              <div
                style={{
                  padding: "24px 16px",
                  textAlign: "center",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 10,
                  color: "var(--bp-text-muted)",
                  lineHeight: 1.6,
                }}
              >
                No rooms detected.
                <br />
                Upload a floor plan to begin.
              </div>
            ) : (
              <div style={{ padding: "0 12px 12px" }}>
                {plan.rooms.map((room) => {
                  const isFocused = focusedRoomId === room.id;
                  return (
                    <div
                      key={room.id}
                      onClick={() => onFocusRoom(isFocused ? null : room.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "7px 10px",
                        marginBottom: 3,
                        border: `1px solid ${isFocused ? "var(--bp-cyan)" : "var(--bp-grid-subtle)"}`,
                        background: isFocused ? "rgba(34,211,238,0.07)" : "var(--bp-navy)",
                        cursor: "pointer",
                        transition: "all 160ms",
                      }}
                    >
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          background: room.color || "#1a2a3a",
                          border: `1px solid ${isFocused ? "var(--bp-cyan)" : "var(--bp-wall-dim)"}`,
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontFamily: "'Space Mono', monospace",
                            fontSize: 10,
                            color: isFocused ? "var(--bp-cyan)" : "var(--bp-text-primary)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {room.name}
                        </div>
                        <div
                          style={{
                            fontFamily: "'Space Mono', monospace",
                            fontSize: 8,
                            color: "var(--bp-dim-yellow)",
                          }}
                        >
                          {room.width.toFixed(1)}' × {room.height.toFixed(1)}'
                        </div>
                      </div>
                      {isFocused ? (
                        <Eye size={10} style={{ color: "var(--bp-cyan)", flexShrink: 0 }} />
                      ) : (
                        <EyeOff size={10} style={{ color: "var(--bp-text-muted)", flexShrink: 0 }} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "8px 12px",
          borderTop: "1px solid var(--bp-grid-subtle)",
          fontFamily: "'Space Mono', monospace",
          fontSize: 8,
          color: "var(--bp-text-muted)",
          lineHeight: 1.5,
        }}
      >
        DRAG FURNITURE ONTO CANVAS
        <br />
        ALT+DRAG TO PAN · SCROLL TO ZOOM
      </div>
    </div>
  );
}
