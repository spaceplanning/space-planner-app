// ============================================================
// SPACE PLANNER STUDIO — Floor Plan Data Types
// Blueprint Dark Theme
// ============================================================

export interface Point {
  x: number; // in feet
  y: number; // in feet
}

export interface Room {
  id: string;
  name: string;
  x: number;      // top-left x in feet
  y: number;      // top-left y in feet
  width: number;  // in feet
  height: number; // in feet
  color?: string;
}

export interface PlacedFurniture {
  id: string;
  furnitureId: string;
  name: string;
  x: number;       // top-left x in feet (snapped to grid)
  y: number;       // top-left y in feet
  width: number;   // in feet
  depth: number;   // in feet
  rotation: number; // 0, 45, 90, 135, 180, 225, 270, 315
  color: string;
  category: string;
}

export interface FloorPlan {
  id: string;
  name: string;
  totalWidth: number;  // in feet
  totalHeight: number; // in feet
  rooms: Room[];
  furniture: PlacedFurniture[];
  createdAt: number;
  updatedAt: number;
}

export const ROOM_COLORS: Record<string, string> = {
  BEDROOM: "#1e3a5f",
  LIVING: "#1a3d2e",
  KITCHEN: "#3d1e1e",
  BATHROOM: "#2a1e3d",
  DINING: "#3d2e1a",
  OFFICE: "#1e2a3d",
  HALLWAY: "#2a2a2a",
  CLOSET: "#1e1e2a",
  DEFAULT: "#1a2a3a",
};

export const ROOM_LABEL_COLORS: Record<string, string> = {
  BEDROOM: "#7dd3fc",
  LIVING: "#86efac",
  KITCHEN: "#fca5a5",
  BATHROOM: "#c4b5fd",
  DINING: "#fdba74",
  OFFICE: "#fde68a",
  HALLWAY: "#d1d5db",
  CLOSET: "#9ca3af",
  DEFAULT: "#e0f2fe",
};

// Storage utilities
const STORAGE_KEY_PLANS = "spaceplanner_plans";
const STORAGE_KEY_CUSTOM_FURNITURE = "spaceplanner_custom_furniture";
const STORAGE_KEY_ACTIVE_PLAN = "spaceplanner_active_plan";

export function savePlans(plans: FloorPlan[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_PLANS, JSON.stringify(plans));
  } catch (e) {
    console.error("Failed to save plans:", e);
  }
}

export function loadPlans(): FloorPlan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PLANS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomFurniture(items: import("./furnitureData").FurnitureTemplate[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOM_FURNITURE, JSON.stringify(items));
  } catch (e) {
    console.error("Failed to save custom furniture:", e);
  }
}

export function loadCustomFurniture(): import("./furnitureData").FurnitureTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_FURNITURE);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveActivePlanId(id: string | null): void {
  if (id) {
    localStorage.setItem(STORAGE_KEY_ACTIVE_PLAN, id);
  } else {
    localStorage.removeItem(STORAGE_KEY_ACTIVE_PLAN);
  }
}

export function loadActivePlanId(): string | null {
  return localStorage.getItem(STORAGE_KEY_ACTIVE_PLAN);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// Convert feet to pixels at a given scale
export function feetToPx(feet: number, scale: number): number {
  return feet * scale;
}

// Convert pixels to feet at a given scale
export function pxToFeet(px: number, scale: number): number {
  return px / scale;
}

// Snap a pixel value to the nearest grid increment (in feet)
export function snapToGrid(pxValue: number, scale: number, gridFt: number = 0.5): number {
  const feet = pxToFeet(pxValue, scale);
  const snapped = Math.round(feet / gridFt) * gridFt;
  return feetToPx(snapped, scale);
}

// Format feet as feet'inches" string
export function formatFeetInches(feet: number): string {
  const wholeFeet = Math.floor(feet);
  const inches = Math.round((feet - wholeFeet) * 12);
  if (inches === 0) return `${wholeFeet}'0"`;
  if (inches === 12) return `${wholeFeet + 1}'0"`;
  return `${wholeFeet}'${inches}"`;
}

// Parse feet'inches" string to decimal feet
export function parseFeetInches(str: string): number | null {
  // Matches: 12'6", 12'6, 12.5, 12
  const matchFtIn = str.match(/^(\d+)'(\d+)"?$/);
  if (matchFtIn) {
    return parseInt(matchFtIn[1]) + parseInt(matchFtIn[2]) / 12;
  }
  const matchFt = str.match(/^(\d+(?:\.\d+)?)'?$/);
  if (matchFt) {
    return parseFloat(matchFt[1]);
  }
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}
