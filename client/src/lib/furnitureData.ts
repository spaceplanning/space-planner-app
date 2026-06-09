// ============================================================
// SPACE PLANNER STUDIO — Furniture Data
// Blueprint Dark Theme: comprehensive furniture library with standard sizes
// ============================================================

export interface FurnitureTemplate {
  id: string;
  name: string;
  category: FurnitureCategory;
  widthFt: number;   // feet
  depthFt: number;   // feet
  color?: string;
  isCustom?: boolean;
  baseId?: string;   // Reference to original template for customizations
}

export type FurnitureCategory =
  | "Bedroom"
  | "Living Room"
  | "Kitchen"
  | "Dining"
  | "Bathroom"
  | "Office"
  | "Decor"
  | "Custom";

export const DEFAULT_FURNITURE: FurnitureTemplate[] = [
  // ============================================================
  // BEDROOM
  // ============================================================
  { id: "twin-bed", name: "Twin Bed", category: "Bedroom", widthFt: 3.25, depthFt: 6.25 },
  { id: "full-bed", name: "Full Bed", category: "Bedroom", widthFt: 4.5, depthFt: 6.25 },
  { id: "queen-bed", name: "Queen Bed", category: "Bedroom", widthFt: 5, depthFt: 6.67 },
  { id: "king-bed", name: "King Bed", category: "Bedroom", widthFt: 6.33, depthFt: 6.67 },

  // Dressers - Standard Sizes
  { id: "dresser-3drawer", name: "3-Drawer Dresser", category: "Bedroom", widthFt: 2.75, depthFt: 1.5 },
  { id: "dresser-5drawer", name: "5-Drawer Dresser", category: "Bedroom", widthFt: 3.5, depthFt: 1.5 },
  { id: "dresser-6drawer", name: "6-Drawer Dresser", category: "Bedroom", widthFt: 4, depthFt: 1.75 },
  { id: "dresser-wide", name: "Wide Dresser (8-Drawer)", category: "Bedroom", widthFt: 5, depthFt: 1.75 },

  // Nightstands
  { id: "nightstand-small", name: "Small Nightstand", category: "Bedroom", widthFt: 1.25, depthFt: 1.25 },
  { id: "nightstand-std", name: "Standard Nightstand", category: "Bedroom", widthFt: 1.5, depthFt: 1.5 },
  { id: "nightstand-large", name: "Large Nightstand", category: "Bedroom", widthFt: 2, depthFt: 1.75 },

  // Other Bedroom
  { id: "wardrobe", name: "Wardrobe", category: "Bedroom", widthFt: 4, depthFt: 2 },
  { id: "bench-bed", name: "Bed Bench", category: "Bedroom", widthFt: 4.5, depthFt: 1.25 },

  // ============================================================
  // LIVING ROOM - COUCHES & SEATING
  // ============================================================
  { id: "sofa-2seat", name: "2-Seat Sofa (Loveseat)", category: "Living Room", widthFt: 5, depthFt: 3 },
  { id: "sofa-3seat", name: "3-Seat Sofa", category: "Living Room", widthFt: 7, depthFt: 3 },
  { id: "sofa-4seat", name: "4-Seat Sofa", category: "Living Room", widthFt: 8.5, depthFt: 3 },
  { id: "sectional-l-small", name: "Small L-Sectional", category: "Living Room", widthFt: 6, depthFt: 6 },
  { id: "sectional-l-large", name: "Large L-Sectional", category: "Living Room", widthFt: 8, depthFt: 8 },
  { id: "sectional-u", name: "U-Shaped Sectional", category: "Living Room", widthFt: 9, depthFt: 9 },

  // Chairs
  { id: "armchair-std", name: "Standard Armchair", category: "Living Room", widthFt: 2.75, depthFt: 2.75 },
  { id: "armchair-large", name: "Large Armchair", category: "Living Room", widthFt: 3.5, depthFt: 3.5 },
  { id: "accent-chair", name: "Accent Chair", category: "Living Room", widthFt: 2.5, depthFt: 2.5 },
  { id: "wingback-chair", name: "Wingback Chair", category: "Living Room", widthFt: 3, depthFt: 3 },
  { id: "recliner", name: "Recliner", category: "Living Room", widthFt: 3.25, depthFt: 3.5 },
  { id: "rocker", name: "Rocking Chair", category: "Living Room", widthFt: 2.5, depthFt: 2.75 },

  // Tables
  { id: "coffee-table-small", name: "Small Coffee Table", category: "Living Room", widthFt: 3, depthFt: 1.5 },
  { id: "coffee-table-std", name: "Standard Coffee Table", category: "Living Room", widthFt: 4, depthFt: 2 },
  { id: "coffee-table-large", name: "Large Coffee Table", category: "Living Room", widthFt: 5, depthFt: 2.5 },
  { id: "coffee-table-round", name: "Round Coffee Table", category: "Living Room", widthFt: 3.5, depthFt: 3.5 },

  // End Tables
  { id: "end-table-small", name: "Small End Table", category: "Living Room", widthFt: 1.5, depthFt: 1.5 },
  { id: "end-table-std", name: "Standard End Table", category: "Living Room", widthFt: 2, depthFt: 2 },
  { id: "end-table-large", name: "Large End Table", category: "Living Room", widthFt: 2.5, depthFt: 2.5 },
  { id: "end-table-round", name: "Round End Table", category: "Living Room", widthFt: 2, depthFt: 2 },

  // Entertainment
  { id: "tv-stand-small", name: "Small TV Stand", category: "Living Room", widthFt: 3.5, depthFt: 1.5 },
  { id: "tv-stand-std", name: "Standard TV Stand", category: "Living Room", widthFt: 5, depthFt: 1.5 },
  { id: "tv-stand-large", name: "Large TV Stand", category: "Living Room", widthFt: 6.5, depthFt: 1.75 },
  { id: "entertainment-center", name: "Entertainment Center (Small)", category: "Living Room", widthFt: 5, depthFt: 2 },
  { id: "entertainment-center-med", name: "Entertainment Center (Medium)", category: "Living Room", widthFt: 7, depthFt: 2.25 },
  { id: "entertainment-center-large", name: "Entertainment Center (Large)", category: "Living Room", widthFt: 8.5, depthFt: 2.5 },

  // Storage
  { id: "bookshelf-narrow", name: "Narrow Bookshelf", category: "Living Room", widthFt: 2, depthFt: 1 },
  { id: "bookshelf-std", name: "Standard Bookshelf", category: "Living Room", widthFt: 3, depthFt: 1 },
  { id: "bookshelf-wide", name: "Wide Bookshelf", category: "Living Room", widthFt: 4, depthFt: 1 },
  { id: "cabinet", name: "Cabinet", category: "Living Room", widthFt: 3, depthFt: 1.5 },
  { id: "console-table", name: "Console Table", category: "Living Room", widthFt: 4, depthFt: 1 },

  // ============================================================
  // KITCHEN
  // ============================================================
  { id: "fridge", name: "Refrigerator", category: "Kitchen", widthFt: 2.75, depthFt: 2.75 },
  { id: "stove", name: "Stove/Range", category: "Kitchen", widthFt: 2.5, depthFt: 2 },
  { id: "dishwasher", name: "Dishwasher", category: "Kitchen", widthFt: 2, depthFt: 2 },
  { id: "kitchen-island", name: "Kitchen Island", category: "Kitchen", widthFt: 4, depthFt: 2 },
  { id: "sink", name: "Sink", category: "Kitchen", widthFt: 2, depthFt: 1.5 },

  // ============================================================
  // DINING
  // ============================================================
  { id: "dining-table-2", name: "Dining Table (2)", category: "Dining", widthFt: 2.5, depthFt: 2.5 },
  { id: "dining-table-4", name: "Dining Table (4)", category: "Dining", widthFt: 4, depthFt: 3 },
  { id: "dining-table-6", name: "Dining Table (6)", category: "Dining", widthFt: 6, depthFt: 3 },
  { id: "dining-table-8", name: "Dining Table (8)", category: "Dining", widthFt: 8, depthFt: 3.5 },
  { id: "dining-table-round-4", name: "Round Dining Table (4)", category: "Dining", widthFt: 3.5, depthFt: 3.5 },
  { id: "dining-table-round-6", name: "Round Dining Table (6)", category: "Dining", widthFt: 4.5, depthFt: 4.5 },
  { id: "dining-chair", name: "Dining Chair", category: "Dining", widthFt: 1.5, depthFt: 1.5 },
  { id: "dining-bench", name: "Dining Bench", category: "Dining", widthFt: 4, depthFt: 1.5 },

  // ============================================================
  // BATHROOM
  // ============================================================
  { id: "toilet", name: "Toilet", category: "Bathroom", widthFt: 1.5, depthFt: 2.5 },
  { id: "bathtub", name: "Bathtub", category: "Bathroom", widthFt: 2.5, depthFt: 5 },
  { id: "shower", name: "Shower Stall", category: "Bathroom", widthFt: 3, depthFt: 3 },
  { id: "vanity", name: "Vanity/Sink", category: "Bathroom", widthFt: 2, depthFt: 1.5 },

  // ============================================================
  // OFFICE
  // ============================================================
  { id: "desk-small", name: "Small Desk", category: "Office", widthFt: 3, depthFt: 1.5 },
  { id: "desk-std", name: "Standard Desk", category: "Office", widthFt: 4, depthFt: 2 },
  { id: "desk-large", name: "Large Desk", category: "Office", widthFt: 5, depthFt: 2.5 },
  { id: "office-chair", name: "Office Chair", category: "Office", widthFt: 2, depthFt: 2 },
  { id: "filing-cabinet", name: "Filing Cabinet", category: "Office", widthFt: 1.5, depthFt: 2 },

  // ============================================================
  // DECOR - PLANTS & ACCESSORIES
  // ============================================================
  { id: "potted-plant-small", name: "Small Potted Plant", category: "Decor", widthFt: 0.75, depthFt: 0.75 },
  { id: "potted-plant-med", name: "Medium Potted Plant", category: "Decor", widthFt: 1, depthFt: 1 },
  { id: "potted-plant-large", name: "Large Potted Plant", category: "Decor", widthFt: 1.5, depthFt: 1.5 },
  { id: "floor-lamp", name: "Floor Lamp", category: "Decor", widthFt: 0.5, depthFt: 0.5 },
  { id: "table-lamp", name: "Table Lamp", category: "Decor", widthFt: 0.5, depthFt: 0.5 },
  { id: "mirror", name: "Wall Mirror", category: "Decor", widthFt: 2, depthFt: 0.25 },
  { id: "artwork", name: "Artwork/Picture", category: "Decor", widthFt: 1.5, depthFt: 0.25 },
];

export const FURNITURE_CATEGORIES: FurnitureCategory[] = [
  "Bedroom",
  "Living Room",
  "Kitchen",
  "Dining",
  "Bathroom",
  "Office",
  "Decor",
  "Custom",
];

export const CATEGORY_COLORS: Record<FurnitureCategory, string> = {
  Bedroom: "#7dd3fc",
  "Living Room": "#86efac",
  Kitchen: "#fca5a5",
  Dining: "#fdba74",
  Bathroom: "#c4b5fd",
  Office: "#fde68a",
  Decor: "#f472b6",
  Custom: "#22d3ee",
};

/**
 * Create a customized copy of a furniture template
 */
export function createCustomFurniture(
  baseTemplate: FurnitureTemplate,
  customName: string,
  customWidth?: number,
  customDepth?: number
): FurnitureTemplate {
  return {
    id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: customName,
    category: "Custom",
    widthFt: customWidth ?? baseTemplate.widthFt,
    depthFt: customDepth ?? baseTemplate.depthFt,
    isCustom: true,
    baseId: baseTemplate.id,
  };
}

/**
 * Get all variations of a furniture type (standard + any custom versions)
 */
export function getFurnitureVariations(
  baseId: string,
  allFurniture: FurnitureTemplate[]
): FurnitureTemplate[] {
  const base = allFurniture.find((f) => f.id === baseId);
  if (!base) return [];
  const variations = [base];
  const customVersions = allFurniture.filter((f) => f.baseId === baseId);
  return [...variations, ...customVersions];
}

/**
 * Get furniture by category
 */
export function getFurnitureByCategory(
  category: FurnitureCategory,
  furniture: FurnitureTemplate[]
): FurnitureTemplate[] {
  return furniture.filter((f) => f.category === category);
}
