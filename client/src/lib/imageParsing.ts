// SPACE PLANNER STUDIO — Image Parsing Engine
// Blueprint Dark Theme
// Uses server-side tRPC procedure for AI vision parsing (fixes 401 auth issue)
// ============================================================

import { Room, Point, generateId } from "./floorPlanTypes";

export interface WireframeSection {
  id: string;
  name: string;
  boundary: Point[];
  squareFeet?: number;
}

export interface ParsedFloorPlan {
  rooms: Room[];  // Keep for backward compatibility
  totalWidth: number;
  totalHeight: number;
  wireframe?: Point[];  // Complete wireframe polygon
  sections?: WireframeSection[];  // Classified room sections
  perimeter?: Point[];  // Outer boundary
  totalSquareFeet?: number;
  rawText: string;
}

export interface ParseProgress {
  stage: "uploading" | "analyzing" | "generating" | "complete" | "error";
  message: string;
  progress: number; // 0-100
}

// Convert file to base64
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Convert PDF page to image using canvas
async function pdfPageToBase64(file: File): Promise<string> {
  // For PDF we'll use the file as-is and let the AI handle it
  return fileToBase64(file);
}

const ROOM_COLORS_MAP: Record<string, string> = {
  BEDROOM: "#1e3a5f",
  "MASTER BEDROOM": "#1e3a5f",
  "BED ROOM": "#1e3a5f",
  LIVING: "#1a3d2e",
  "LIVING ROOM": "#1a3d2e",
  "GREAT ROOM": "#1a3d2e",
  KITCHEN: "#3d1e1e",
  BATHROOM: "#2a1e3d",
  BATH: "#2a1e3d",
  DINING: "#3d2e1a",
  "DINING ROOM": "#3d2e1a",
  OFFICE: "#1e2a3d",
  STUDY: "#1e2a3d",
  HALLWAY: "#2a2a2a",
  HALL: "#2a2a2a",
  CLOSET: "#1e1e2a",
  GARAGE: "#2a2a1e",
  LAUNDRY: "#1e2a2a",
  DEFAULT: "#1a2a3a",
};

function getRoomColor(name: string): string {
  const upper = name.toUpperCase();
  for (const key of Object.keys(ROOM_COLORS_MAP)) {
    if (upper.includes(key)) return ROOM_COLORS_MAP[key];
  }
  return ROOM_COLORS_MAP.DEFAULT;
}

/**
 * Parse a floor plan image using server-side vision AI
 * Requires a mutation function from useParseFloorPlan hook
 */
export async function parseFloorPlanImage(
  file: File,
  onProgress: (p: ParseProgress) => void,
  mutate: (input: { base64: string; fileType: string }) => Promise<{
    totalWidth: number;
    totalHeight: number;
    totalSquareFeet?: number;
    wireframe?: Array<{ x: number; y: number }>;
    sections?: Array<{
      id: string;
      name: string;
      boundary: Array<{ x: number; y: number }>;
      squareFeet?: number;
      dimensions?: string;
    }>;
    dimensionNotes?: string;
  }>
): Promise<ParsedFloorPlan> {
  onProgress({ stage: "uploading", message: "Reading image file...", progress: 10 });

  let base64: string;
  try {
    if (file.type === "application/pdf") {
      base64 = await pdfPageToBase64(file);
    } else {
      base64 = await fileToBase64(file);
    }
  } catch (e) {
    throw new Error("Failed to read file. Please try again.");
  }

  onProgress({ stage: "analyzing", message: "AI scanning for rooms and dimensions...", progress: 30 });

  let parsed: {
    totalWidth: number;
    totalHeight: number;
    totalSquareFeet?: number;
    wireframe?: Array<{ x: number; y: number }>;
    sections?: Array<{
      id: string;
      name: string;
      boundary: Array<{ x: number; y: number }>;
      squareFeet?: number;
    }>;
    perimeter?: Array<{ x: number; y: number }>;
    rooms?: Array<{
      name: string;
      widthFt: number;
      heightFt: number;
      xFt: number;
      yFt: number;
    }>;
  };

  try {
    parsed = await mutate({
      base64,
      fileType: file.type,
    });
  } catch (e) {
    throw new Error(`Vision analysis failed: ${(e as Error).message}`);
  }

  onProgress({ stage: "generating", message: "Generating digital floor plan...", progress: 70 });

  // Validate and normalize
  const totalWidth = Math.max(parsed.totalWidth || 30, 10);
  const totalHeight = Math.max(parsed.totalHeight || 20, 10);

  // Convert wireframe sections to rooms for rendering
  const rooms: Room[] = (parsed.sections || []).map((section) => {
    // Calculate bounding box of section boundary
    const xs = section.boundary.map((p) => p.x);
    const ys = section.boundary.map((p) => p.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);
    const width = maxX - minX;
    const height = maxY - minY;

    return {
      id: section.id || generateId(),
      name: section.name || "ROOM",
      x: minX,
      y: minY,
      width: Math.max(width, 4),
      height: Math.max(height, 4),
      color: getRoomColor(section.name || ""),
    };
  });

  // Fallback: if no sections, use old room format
  if (rooms.length === 0 && parsed.rooms) {
    rooms.push(...parsed.rooms.map((r) => ({
      id: generateId(),
      name: r.name || "ROOM",
      x: Math.max(0, r.xFt || 0),
      y: Math.max(0, r.yFt || 0),
      width: Math.max(r.widthFt || 10, 4),
      height: Math.max(r.heightFt || 8, 4),
      color: getRoomColor(r.name || ""),
    })));
  }

  onProgress({ stage: "complete", message: "Floor plan generated successfully!", progress: 100 });

  return {
    rooms,
    totalWidth,
    totalHeight,
    wireframe: parsed.wireframe,
    sections: parsed.sections,
    perimeter: parsed.perimeter,
    totalSquareFeet: parsed.totalSquareFeet,
    rawText: JSON.stringify(parsed),
  };
}


