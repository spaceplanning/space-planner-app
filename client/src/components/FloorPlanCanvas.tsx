// ============================================================
// SPACE PLANNER STUDIO — Floor Plan Canvas
// Blueprint Dark Theme: navy bg, cyan grid, yellow dims
// Interactive SVG canvas with drag-and-drop furniture
// ============================================================

import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import {
  FloorPlan,
  PlacedFurniture,
  Room,
  feetToPx,
  formatFeetInches,
  generateId,
} from "@/lib/floorPlanTypes";
import { FurnitureTemplate, CATEGORY_COLORS } from "@/lib/furnitureData";
import { FURNITURE_SYMBOLS } from "@/lib/furnitureSymbols";
import { RotateCw, Trash2, Move, Edit3, Ruler } from "lucide-react";
import RoomEditorDialog from "./RoomEditorDialog";
import MeasurementPanel from "./MeasurementPanel";

const GRID_FT = 1;
const MIN_SCALE = 8;
const MAX_SCALE = 80;
const DEFAULT_SCALE = 20;

interface Props {
  plan: FloorPlan;
  focusedRoomId: string | null;
  onPlanChange: (plan: FloorPlan) => void;
  draggedFurniture: FurnitureTemplate | null;
  onDragEnd: () => void;
}

interface DragState {
  furnitureId: string;
  startMouseX: number;
  startMouseY: number;
  startItemX: number;
  startItemY: number;
}

interface DrawState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

interface MeasurementPoint {
  x: number;
  y: number;
}

export default function FloorPlanCanvas({
  plan,
  focusedRoomId,
  onPlanChange,
  draggedFurniture,
  onDragEnd,
}: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(DEFAULT_SCALE);
  const [offset, setOffset] = useState({ x: 40, y: 40 });
  const [selectedFurnitureId, setSelectedFurnitureId] = useState<string | null>(null);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0, ox: 0, oy: 0 });
  const [hoveredFurnitureId, setHoveredFurnitureId] = useState<string | null>(null);
  const [dropPreview, setDropPreview] = useState<{ x: number; y: number } | null>(null);
  const [drawMode, setDrawMode] = useState(false);
  const [drawState, setDrawState] = useState<DrawState | null>(null);
  const [measureMode, setMeasureMode] = useState(false);
  const [measurePoints, setMeasurePoints] = useState<MeasurementPoint[]>([]);

  const focusedRoom = useMemo(
    () => (focusedRoomId ? plan.rooms.find((r) => r.id === focusedRoomId) : null),
    [focusedRoomId, plan.rooms]
  );

  // Auto-fit when plan changes
  useEffect(() => {
    if (!canvasRef.current || plan.totalWidth === 0) return;
    const container = canvasRef.current;
    const cw = container.clientWidth - 80;
    const ch = container.clientHeight - 80;
    const scaleX = cw / plan.totalWidth;
    const scaleY = ch / plan.totalHeight;
    const newScale = Math.min(Math.max(Math.min(scaleX, scaleY), MIN_SCALE), MAX_SCALE);
    setScale(newScale);
    setOffset({ x: 40, y: 40 });
  }, [plan.totalWidth, plan.totalHeight]);

  // Auto-zoom to focused room
  useEffect(() => {
    if (!focusedRoom || !canvasRef.current) return;
    const container = canvasRef.current;
    const cw = container.clientWidth - 80;
    const ch = container.clientHeight - 80;
    const scaleX = cw / focusedRoom.width;
    const scaleY = ch / focusedRoom.height;
    const newScale = Math.min(Math.max(Math.min(scaleX, scaleY), MIN_SCALE), MAX_SCALE);
    setScale(newScale);
    setOffset({
      x: 40 - focusedRoom.x * newScale,
      y: 40 - focusedRoom.y * newScale,
    });
  }, [focusedRoom]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((s) => Math.min(Math.max(s * delta, MIN_SCALE), MAX_SCALE));
  }, []);

  const getCanvasPos = useCallback(
    (e: React.MouseEvent) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const xPx = e.clientX - rect.left - offset.x;
      const yPx = e.clientY - rect.top - offset.y;
      const xFt = Math.round((xPx / scale) * 2) / 2;
      const yFt = Math.round((yPx / scale) * 2) / 2;
      return { xFt, yFt };
    },
    [offset, scale]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 1 || e.altKey) {
        e.preventDefault();
        setIsPanning(true);
        setPanStart({ x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y });
        return;
      }
      if (measureMode && e.button === 0) {
        const { xFt, yFt } = getCanvasPos(e);
        setMeasurePoints((prev) => [...prev, { x: xFt, y: yFt }]);
        return;
      }
      if (drawMode && e.button === 0) {
        const { xFt, yFt } = getCanvasPos(e);
        setDrawState({ startX: xFt, startY: yFt, currentX: xFt, currentY: yFt });
      }
    },
    [offset, drawMode, measureMode, getCanvasPos]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        setOffset({
          x: panStart.ox + (e.clientX - panStart.x),
          y: panStart.oy + (e.clientY - panStart.y),
        });
        return;
      }

      if (dragState) {
        const dx = e.clientX - dragState.startMouseX;
        const dy = e.clientY - dragState.startMouseY;
        const newXFt = Math.round((dragState.startItemX + dx / scale) * 2) / 2;
        const newYFt = Math.round((dragState.startItemY + dy / scale) * 2) / 2;
        onPlanChange({
          ...plan,
          furniture: plan.furniture.map((f) =>
            f.id === dragState.furnitureId
              ? { ...f, x: Math.max(0, newXFt), y: Math.max(0, newYFt) }
              : f
          ),
          updatedAt: Date.now(),
        });
        return;
      }

      if (drawState) {
        const { xFt, yFt } = getCanvasPos(e);
        setDrawState((d) => d ? { ...d, currentX: xFt, currentY: yFt } : null);
        return;
      }

      if (draggedFurniture && canvasRef.current) {
        const { xFt, yFt } = getCanvasPos(e);
        setDropPreview({ x: xFt, y: yFt });
      }
    },
    [isPanning, panStart, dragState, scale, plan, onPlanChange, drawState, getCanvasPos, draggedFurniture]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      setIsPanning(false);
      setDragState(null);

      // Finish drawing a room
      if (drawState) {
        const x = Math.min(drawState.startX, drawState.currentX);
        const y = Math.min(drawState.startY, drawState.currentY);
        const w = Math.abs(drawState.currentX - drawState.startX);
        const h = Math.abs(drawState.currentY - drawState.startY);
        if (w >= 2 && h >= 2) {
          const newRoom: Room = {
            id: generateId(),
            name: `ROOM ${plan.rooms.length + 1}`,
            x,
            y,
            width: w,
            height: h,
            color: "#1a2a3a",
          };
          onPlanChange({
            ...plan,
            rooms: [...plan.rooms, newRoom],
            totalWidth: Math.max(plan.totalWidth, x + w + 2),
            totalHeight: Math.max(plan.totalHeight, y + h + 2),
            updatedAt: Date.now(),
          });
        }
        setDrawState(null);
        return;
      }

      // Drop furniture from sidebar
      if (draggedFurniture && canvasRef.current) {
        const { xFt, yFt } = getCanvasPos(e);
        const newItem: PlacedFurniture = {
          id: generateId(),
          furnitureId: draggedFurniture.id,
          name: draggedFurniture.name,
          x: Math.max(0, xFt),
          y: Math.max(0, yFt),
          width: draggedFurniture.widthFt,
          depth: draggedFurniture.depthFt,
          rotation: 0,
          color: CATEGORY_COLORS[draggedFurniture.category] || "#22d3ee",
          category: draggedFurniture.category,
          furnitureType: draggedFurniture.id, // Use furniture ID as the symbol type
        };
        onPlanChange({
          ...plan,
          furniture: [...plan.furniture, newItem],
          updatedAt: Date.now(),
        });
        onDragEnd();
        setDropPreview(null);
      }
    },
    [drawState, plan, onPlanChange, draggedFurniture, getCanvasPos, onDragEnd]
  );

  const handleMouseLeave = useCallback(() => {
    setIsPanning(false);
    setDragState(null);
    setDropPreview(null);
    if (drawState) setDrawState(null);
  }, [drawState]);

  const handleMeasureClear = useCallback(() => {
    setMeasurePoints([]);
  }, []);

  const handleMeasureUndo = useCallback(() => {
    setMeasurePoints((prev) => prev.slice(0, -1));
  }, []);

  const handleMeasureClose = useCallback(() => {
    setMeasureMode(false);
    setMeasurePoints([]);
  }, []);

  const startFurnitureDrag = useCallback(
    (e: React.MouseEvent, item: PlacedFurniture) => {
      e.stopPropagation();
      e.preventDefault();
      setSelectedFurnitureId(item.id);
      setDragState({
        furnitureId: item.id,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startItemX: item.x,
        startItemY: item.y,
      });
    },
    []
  );

  const rotateFurniture = useCallback(
    (id: string, degrees: 45 | 90) => {
      onPlanChange({
        ...plan,
        furniture: plan.furniture.map((f) =>
          f.id === id ? { ...f, rotation: (f.rotation + degrees) % 360 } : f
        ),
        updatedAt: Date.now(),
      });
    },
    [plan, onPlanChange]
  );

  const deleteFurniture = useCallback(
    (id: string) => {
      onPlanChange({
        ...plan,
        furniture: plan.furniture.filter((f) => f.id !== id),
        updatedAt: Date.now(),
      });
      setSelectedFurnitureId(null);
    },
    [plan, onPlanChange]
  );

  const handleRoomSave = useCallback(
    (updated: Room) => {
      onPlanChange({
        ...plan,
        rooms: plan.rooms.map((r) => (r.id === updated.id ? updated : r)),
        updatedAt: Date.now(),
      });
    },
    [plan, onPlanChange]
  );

  const handleRoomDelete = useCallback(
    (id: string) => {
      onPlanChange({
        ...plan,
        rooms: plan.rooms.filter((r) => r.id !== id),
        updatedAt: Date.now(),
      });
    },
    [plan, onPlanChange]
  );

  const totalWidthPx = feetToPx(plan.totalWidth, scale);
  const totalHeightPx = feetToPx(plan.totalHeight, scale);

  // Render rooms
  const renderRooms = () =>
    plan.rooms.map((room) => {
      const isHidden = focusedRoomId && room.id !== focusedRoomId;
      const rx = feetToPx(room.x, scale);
      const ry = feetToPx(room.y, scale);
      const rw = feetToPx(room.width, scale);
      const rh = feetToPx(room.height, scale);

      return (
        <g
          key={room.id}
          opacity={isHidden ? 0.08 : 1}
          style={{ transition: "opacity 300ms", cursor: "pointer" }}
          onDoubleClick={(e) => { e.stopPropagation(); setEditingRoom(room); }}
        >
          <rect x={rx} y={ry} width={rw} height={rh} fill={room.color || "#1a2a3a"} fillOpacity={0.6} />
          <rect x={rx} y={ry} width={rw} height={rh} fill="none" stroke="#e0f2fe" strokeWidth={2.5} />
          {!isHidden && (
            <>
              <text
                x={rx + rw / 2}
                y={ry + rh / 2 - 8}
                textAnchor="middle"
                fill="#e0f2fe"
                fontSize={Math.max(10, Math.min(14, rw / 8))}
                fontFamily="'Space Mono', monospace"
                fontWeight="700"
                letterSpacing="0.08em"
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {room.name}
              </text>
              <text
                x={rx + rw / 2}
                y={ry + rh / 2 + 10}
                textAnchor="middle"
                fill="#facc15"
                fontSize={Math.max(8, Math.min(11, rw / 10))}
                fontFamily="'Space Mono', monospace"
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {formatFeetInches(room.width)} × {formatFeetInches(room.height)}
              </text>
            </>
          )}
          {/* Dimension lines */}
          {!isHidden && scale >= 16 && (
            <>
              <line x1={rx} y1={ry - 12} x2={rx + rw} y2={ry - 12} stroke="#facc15" strokeWidth={1} />
              <line x1={rx} y1={ry - 16} x2={rx} y2={ry - 8} stroke="#facc15" strokeWidth={1} />
              <line x1={rx + rw} y1={ry - 16} x2={rx + rw} y2={ry - 8} stroke="#facc15" strokeWidth={1} />
              <line x1={rx - 12} y1={ry} x2={rx - 12} y2={ry + rh} stroke="#facc15" strokeWidth={1} />
              <line x1={rx - 16} y1={ry} x2={rx - 8} y2={ry} stroke="#facc15" strokeWidth={1} />
              <line x1={rx - 16} y1={ry + rh} x2={rx - 8} y2={ry + rh} stroke="#facc15" strokeWidth={1} />
            </>
          )}
        </g>
      );
    });

  // Render placed furniture
  const renderFurniture = () =>
    plan.furniture.map((item) => {
      const isSelected = selectedFurnitureId === item.id;
      const isHovered = hoveredFurnitureId === item.id;
      const cx = feetToPx(item.x + item.width / 2, scale);
      const cy = feetToPx(item.y + item.depth / 2, scale);
      const fw = feetToPx(item.width, scale);
      const fh = feetToPx(item.depth, scale);

      const isInFocusArea = !focusedRoomId || (() => {
        const room = plan.rooms.find((r) => r.id === focusedRoomId);
        if (!room) return true;
        return (
          item.x >= room.x - 1 &&
          item.y >= room.y - 1 &&
          item.x + item.width <= room.x + room.width + 1 &&
          item.y + item.depth <= room.y + room.height + 1
        );
      })();

      return (
        <g
          key={item.id}
          transform={`rotate(${item.rotation}, ${cx}, ${cy})`}
          opacity={isInFocusArea ? 1 : 0.15}
          style={{ transition: "opacity 300ms", cursor: "grab" }}
          onMouseDown={(e) => startFurnitureDrag(e, item)}
          onMouseEnter={() => setHoveredFurnitureId(item.id)}
          onMouseLeave={() => setHoveredFurnitureId(null)}
          onClick={(e) => { e.stopPropagation(); setSelectedFurnitureId(item.id); }}
        >
          {isSelected && (
            <rect
              x={feetToPx(item.x, scale) - 3}
              y={feetToPx(item.y, scale) - 3}
              width={fw + 6}
              height={fh + 6}
              fill="none"
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="4 2"
              className="selection-glow"
            />
          )}
          {/* Furniture symbol */}
          <g
            x={feetToPx(item.x, scale)}
            y={feetToPx(item.y, scale)}
            style={{
              color: isSelected ? "#3b82f6" : isHovered ? "#22d3ee" : item.color,
            }}
          >
            <svg
              x={feetToPx(item.x, scale)}
              y={feetToPx(item.y, scale)}
              width={fw}
              height={fh}
              viewBox="0 0 100 100"
              style={{ overflow: "visible" }}
              dangerouslySetInnerHTML={{
                __html: (item.furnitureType && FURNITURE_SYMBOLS[item.furnitureType]) || FURNITURE_SYMBOLS.chair_dining,
              }}
            />
          </g>
          {/* Fallback rectangle for selection */}
          <rect
            x={feetToPx(item.x, scale)}
            y={feetToPx(item.y, scale)}
            width={fw}
            height={fh}
            fill="none"
            stroke={isSelected ? "#3b82f6" : isHovered ? "#22d3ee" : item.color}
            strokeWidth={isSelected ? 2 : 1.5}
            opacity={0.3}
          />
          {fw > 30 && fh > 20 && (
            <text
              x={cx}
              y={cy + 4}
              textAnchor="middle"
              fill={item.color}
              fontSize={Math.max(8, Math.min(11, fw / 6))}
              fontFamily="'Space Mono', monospace"
              style={{ pointerEvents: "none", userSelect: "none" }}
            >
              {item.name}
            </text>
          )}
          {isSelected && fw > 40 && (
            <text
              x={cx}
              y={feetToPx(item.y, scale) + fh + 14}
              textAnchor="middle"
              fill="#facc15"
              fontSize={9}
              fontFamily="'Space Mono', monospace"
              style={{ pointerEvents: "none" }}
            >
              {formatFeetInches(item.width)} × {formatFeetInches(item.depth)}
            </text>
          )}
        </g>
      );
    });

  // Drop preview ghost
  const renderDropPreview = () => {
    if (!draggedFurniture || !dropPreview) return null;
    const px = feetToPx(dropPreview.x, scale);
    const py = feetToPx(dropPreview.y, scale);
    const pw = feetToPx(draggedFurniture.widthFt, scale);
    const ph = feetToPx(draggedFurniture.depthFt, scale);
    return (
      <g opacity={0.6}>
        <rect x={px} y={py} width={pw} height={ph} fill="#22d3ee" fillOpacity={0.2} stroke="#22d3ee" strokeWidth={1.5} strokeDasharray="4 2" />
        <text x={px + pw / 2} y={py + ph / 2 + 4} textAnchor="middle" fill="#22d3ee" fontSize={10} fontFamily="'Space Mono', monospace">
          {draggedFurniture.name}
        </text>
      </g>
    );
  };

  // Draw preview
  const renderDrawPreview = () => {
    if (!drawState) return null;
    const x = Math.min(drawState.startX, drawState.currentX);
    const y = Math.min(drawState.startY, drawState.currentY);
    const w = Math.abs(drawState.currentX - drawState.startX);
    const h = Math.abs(drawState.currentY - drawState.startY);
    return (
      <g>
        <rect
          x={feetToPx(x, scale)}
          y={feetToPx(y, scale)}
          width={feetToPx(w, scale)}
          height={feetToPx(h, scale)}
          fill="rgba(34,211,238,0.1)"
          stroke="#22d3ee"
          strokeWidth={1.5}
          strokeDasharray="6 3"
        />
        <text
          x={feetToPx(x + w / 2, scale)}
          y={feetToPx(y + h / 2, scale) + 4}
          textAnchor="middle"
          fill="#22d3ee"
          fontSize={10}
          fontFamily="'Space Mono', monospace"
        >
          {w.toFixed(1)}' × {h.toFixed(1)}'
        </text>
      </g>
    );
  };

  // Overall dimension labels
  const renderOverallDimensions = () => (
    <g>
      <line x1={0} y1={totalHeightPx + 24} x2={totalWidthPx} y2={totalHeightPx + 24} stroke="#facc15" strokeWidth={1} />
      <line x1={0} y1={totalHeightPx + 20} x2={0} y2={totalHeightPx + 28} stroke="#facc15" strokeWidth={1} />
      <line x1={totalWidthPx} y1={totalHeightPx + 20} x2={totalWidthPx} y2={totalHeightPx + 28} stroke="#facc15" strokeWidth={1} />
      <text x={totalWidthPx / 2} y={totalHeightPx + 38} textAnchor="middle" fill="#facc15" fontSize={11} fontFamily="'Space Mono', monospace">
        {formatFeetInches(plan.totalWidth)}
      </text>
      <line x1={totalWidthPx + 24} y1={0} x2={totalWidthPx + 24} y2={totalHeightPx} stroke="#facc15" strokeWidth={1} />
      <line x1={totalWidthPx + 20} y1={0} x2={totalWidthPx + 28} y2={0} stroke="#facc15" strokeWidth={1} />
      <line x1={totalWidthPx + 20} y1={totalHeightPx} x2={totalWidthPx + 28} y2={totalHeightPx} stroke="#facc15" strokeWidth={1} />
      <text
        x={totalWidthPx + 38}
        y={totalHeightPx / 2 + 4}
        textAnchor="middle"
        fill="#facc15"
        fontSize={11}
        fontFamily="'Space Mono', monospace"
        transform={`rotate(90, ${totalWidthPx + 38}, ${totalHeightPx / 2 + 4})`}
      >
        {formatFeetInches(plan.totalHeight)}
      </text>
    </g>
  );

  const selectedItem = plan.furniture.find((f) => f.id === selectedFurnitureId);

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: "var(--bp-navy)" }}>
      {/* Canvas area */}
      <div
        ref={canvasRef}
        className="w-full h-full overflow-auto select-none"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClick={() => { setSelectedFurnitureId(null); }}
        style={{
          cursor: measureMode
            ? "crosshair"
            : drawMode
            ? "crosshair"
            : draggedFurniture
            ? "copy"
            : isPanning
            ? "grabbing"
            : dragState
            ? "grabbing"
            : "default",
        }}
      >
        <div
          style={{
            position: "relative",
            width: Math.max(totalWidthPx + offset.x + 120, 800),
            height: Math.max(totalHeightPx + offset.y + 120, 600),
            minWidth: "100%",
            minHeight: "100%",
          }}
        >
          {/* Background grid SVG */}
          <svg
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}
          >
            <defs>
              <pattern id="smallGrid" width={scale} height={scale} patternUnits="userSpaceOnUse">
                <path d={`M ${scale} 0 L 0 0 0 ${scale}`} fill="none" stroke="#1a3a6b" strokeWidth="0.4" />
              </pattern>
              <pattern id="largeGrid" width={scale * 5} height={scale * 5} patternUnits="userSpaceOnUse">
                <rect width={scale * 5} height={scale * 5} fill="url(#smallGrid)" />
                <path d={`M ${scale * 5} 0 L 0 0 0 ${scale * 5}`} fill="none" stroke="#1e4a8a" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#largeGrid)" />
          </svg>

          {/* Floor plan SVG */}
          <svg
            style={{ position: "absolute", top: offset.y, left: offset.x, overflow: "visible" }}
            width={totalWidthPx + 100}
            height={totalHeightPx + 100}
          >
            {renderRooms()}
            {renderFurniture()}
            {renderDropPreview()}
            {renderDrawPreview()}
            {plan.totalWidth > 0 && renderOverallDimensions()}
          </svg>
        </div>
      </div>

      {/* Draw mode and measurement toggles */}
      <div
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          display: "flex",
          gap: 4,
        }}
      >
        <button
          className="bp-btn"
          style={{
            padding: "5px 10px",
            fontSize: 10,
            borderColor: measureMode ? "var(--bp-dim-yellow)" : "var(--bp-grid-major)",
            color: measureMode ? "var(--bp-dim-yellow)" : "var(--bp-text-muted)",
            background: measureMode ? "rgba(250,204,21,0.08)" : "var(--bp-panel)",
          }}
          onClick={() => { setMeasureMode(!measureMode); setDrawMode(false); }}
          title="Measurement Tool: click points to measure distance or area"
        >
          <Ruler size={10} style={{ display: "inline", marginRight: 4 }} />
          {measureMode ? "MEASURING..." : "MEASURE"}
        </button>
        <button
          className="bp-btn"
          style={{
            padding: "5px 10px",
            fontSize: 10,
            borderColor: drawMode ? "var(--bp-cyan)" : "var(--bp-grid-major)",
            color: drawMode ? "var(--bp-cyan)" : "var(--bp-text-muted)",
            background: drawMode ? "rgba(34,211,238,0.08)" : "var(--bp-panel)",
          }}
          onClick={() => { setDrawMode(!drawMode); setMeasureMode(false); }}
          title="Draw Room Mode: click and drag to draw a new room"
        >
          <Edit3 size={10} style={{ display: "inline", marginRight: 4 }} />
          {drawMode ? "DRAWING..." : "DRAW ROOM"}
        </button>
      </div>

      {/* Zoom controls */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          right: 16,
          display: "flex",
          flexDirection: "column",
          gap: 4,
          background: "var(--bp-panel)",
          border: "1px solid var(--bp-grid-major)",
          padding: 4,
        }}
      >
        <button
          className="bp-btn"
          style={{ width: 32, height: 32, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}
          onClick={() => setScale((s) => Math.min(s * 1.2, MAX_SCALE))}
          title="Zoom In"
        >
          +
        </button>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--bp-text-muted)", textAlign: "center", padding: "2px 0" }}>
          {Math.round((scale / DEFAULT_SCALE) * 100)}%
        </div>
        <button
          className="bp-btn"
          style={{ width: 32, height: 32, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}
          onClick={() => setScale((s) => Math.max(s / 1.2, MIN_SCALE))}
          title="Zoom Out"
        >
          −
        </button>
        <button
          className="bp-btn"
          style={{ width: 32, height: 32, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}
          onClick={() => { setScale(DEFAULT_SCALE); setOffset({ x: 40, y: 40 }); }}
          title="Reset View"
        >
          ⊡
        </button>
      </div>

      {/* Status bar */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          fontFamily: "'Space Mono', monospace",
          fontSize: 10,
          color: "var(--bp-text-muted)",
          background: "var(--bp-panel)",
          border: "1px solid var(--bp-grid-subtle)",
          padding: "4px 8px",
        }}
      >
        {plan.totalWidth > 0
          ? `${formatFeetInches(plan.totalWidth)} × ${formatFeetInches(plan.totalHeight)} · ${plan.furniture.length} items · DBL-CLICK ROOM TO EDIT`
          : "UPLOAD BLUEPRINT OR LOAD DEMO · ALT+DRAG TO PAN · SCROLL TO ZOOM"}
      </div>

      {/* Selected furniture controls */}
      {selectedItem && (
        <div
          style={{
            position: "absolute",
            top: 16,
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--bp-panel)",
            border: "1px solid var(--bp-cyan)",
            padding: "6px 12px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontFamily: "'Space Mono', monospace",
            fontSize: 11,
            color: "var(--bp-text-primary)",
            zIndex: 50,
          }}
        >
          <Move size={12} style={{ color: "var(--bp-cyan)" }} />
          <span style={{ color: "var(--bp-cyan)" }}>{selectedItem.name}</span>
          <span style={{ color: "var(--bp-text-muted)" }}>
            {formatFeetInches(selectedItem.width)} × {formatFeetInches(selectedItem.depth)}
          </span>
          <button
            className="bp-btn"
            style={{ padding: "2px 8px", fontSize: 10 }}
            onClick={() => rotateFurniture(selectedItem.id, 45)}
            title="Rotate 45°"
          >
            <RotateCw size={12} style={{ display: "inline", marginRight: 4 }} />
            45°
          </button>
          <button
            className="bp-btn"
            style={{ padding: "2px 8px", fontSize: 10 }}
            onClick={() => rotateFurniture(selectedItem.id, 90)}
            title="Rotate 90°"
          >
            <RotateCw size={12} style={{ display: "inline", marginRight: 4 }} />
            90°
          </button>
          <button
            className="bp-btn"
            style={{ padding: "2px 8px", fontSize: 10, borderColor: "var(--bp-red)", color: "var(--bp-red)" }}
            onClick={() => deleteFurniture(selectedItem.id)}
            title="Delete"
          >
            <Trash2 size={12} style={{ display: "inline", marginRight: 4 }} />
            Delete
          </button>
        </div>
      )}

      {/* Empty state */}
      {plan.totalWidth === 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 13,
              color: "var(--bp-text-muted)",
              textAlign: "center",
              border: "1px dashed var(--bp-grid-major)",
              padding: "32px 48px",
              maxWidth: 420,
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 12, color: "var(--bp-grid-major)" }}>⊞</div>
            <div style={{ marginBottom: 8, color: "var(--bp-text-secondary)", letterSpacing: "0.1em" }}>
              NO FLOOR PLAN LOADED
            </div>
            <div style={{ fontSize: 11, color: "var(--bp-text-muted)", lineHeight: 1.7 }}>
              Upload a blueprint image or PDF using the panel on the left.
              <br />
              Or click <span style={{ color: "var(--bp-cyan)" }}>LOAD DEMO FLOOR PLAN</span> to start immediately.
              <br /><br />
              <span style={{ color: "var(--bp-dim-yellow)" }}>TIP:</span> Use DRAW ROOM mode to manually sketch a layout.
            </div>
          </div>
        </div>
      )}

      {/* Measurement visualization */}
      {measureMode && measurePoints.length > 0 && (
        <svg
          style={{ position: "absolute", top: offset.y, left: offset.x, overflow: "visible", pointerEvents: "none" }}
          width={feetToPx(plan.totalWidth || 100, scale) + 100}
          height={feetToPx(plan.totalHeight || 100, scale) + 100}
        >
          {/* Lines between points */}
          {measurePoints.length > 1 && (
            <g>
              {measurePoints.map((p, i) => {
                if (i === measurePoints.length - 1) return null;
                const nextP = measurePoints[i + 1];
                return (
                  <line
                    key={`line-${i}`}
                    x1={feetToPx(p.x, scale)}
                    y1={feetToPx(p.y, scale)}
                    x2={feetToPx(nextP.x, scale)}
                    y2={feetToPx(nextP.y, scale)}
                    stroke="#facc15"
                    strokeWidth={2}
                    strokeDasharray="4 2"
                  />
                );
              })}
              {/* Close polygon if 3+ points */}
              {measurePoints.length >= 3 && (
                <line
                  x1={feetToPx(measurePoints[measurePoints.length - 1].x, scale)}
                  y1={feetToPx(measurePoints[measurePoints.length - 1].y, scale)}
                  x2={feetToPx(measurePoints[0].x, scale)}
                  y2={feetToPx(measurePoints[0].y, scale)}
                  stroke="#facc15"
                  strokeWidth={2}
                  strokeDasharray="4 2"
                />
              )}
            </g>
          )}
          {/* Point markers */}
          {measurePoints.map((p, i) => (
            <g key={`point-${i}`}>
              <circle
                cx={feetToPx(p.x, scale)}
                cy={feetToPx(p.y, scale)}
                r={6}
                fill="#facc15"
                opacity={0.8}
              />
              <circle
                cx={feetToPx(p.x, scale)}
                cy={feetToPx(p.y, scale)}
                r={6}
                fill="none"
                stroke="#facc15"
                strokeWidth={2}
              />
              <text
                x={feetToPx(p.x, scale)}
                y={feetToPx(p.y, scale) - 10}
                textAnchor="middle"
                fill="#facc15"
                fontSize={11}
                fontFamily="'Space Mono', monospace"
                fontWeight="700"
              >
                {String.fromCharCode(65 + i)}
              </text>
            </g>
          ))}
        </svg>
      )}

      {/* Measurement panel */}
      {measureMode && (
        <MeasurementPanel
          points={measurePoints}
          onClear={handleMeasureClear}
          onUndo={handleMeasureUndo}
          onClose={handleMeasureClose}
        />
      )}

      {/* Room editor dialog */}
      {editingRoom && (
        <RoomEditorDialog
          room={editingRoom}
          onSave={handleRoomSave}
          onDelete={handleRoomDelete}
          onClose={() => setEditingRoom(null)}
        />
      )}
    </div>
  );
}
