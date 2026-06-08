// ============================================================
// SPACE PLANNER STUDIO — Furniture Data
// Blueprint Dark Theme
// ============================================================

export interface FurnitureTemplate {
  id: string;
  name: string;
  category: FurnitureCategory;
  widthFt: number;   // feet
  depthFt: number;   // feet
  color?: string;
  isCustom?: boolean;
}

export type FurnitureCategory =
  | "Bedroom"
  | "Living Room"
  | "Kitchen"
  | "Dining"
  | "Bathroom"
  | "Office"
  | "Custom";

export const DEFAULT_FURNITURE: FurnitureTemplate[] = [
  // Bedroom
  { id: "twin-bed", name: "Twin Bed", category: "Bedroom", widthFt: 3.25, depthFt: 6.25 },
  { id: "full-bed", name: "Full Bed", category: "Bedroom", widthFt: 4.5, depthFt: 6.25 },
  { id: "queen-bed", name: "Queen Bed", category: "Bedroom", widthFt: 5, depthFt: 6.67 },
  { id: "king-bed", name: "King Bed", category: "Bedroom", widthFt: 6.33, depthFt: 6.67 },
  { id: "dresser", name: "Dresser", category: "Bedroom", widthFt: 3.5, depthFt: 1.5 },
  { id: "nightstand", name: "Nightstand", category: "Bedroom", widthFt: 1.5, depthFt: 1.5 },
  { id: "wardrobe", name: "Wardrobe", category: "Bedroom", widthFt: 4, depthFt: 2 },

  // Living Room
  { id: "sofa-3", name: "3-Seat Sofa", category: "Living Room", widthFt: 7, depthFt: 3 },
  { id: "sofa-2", name: "Loveseat", category: "Living Room", widthFt: 5, depthFt: 3 },
  { id: "armchair", name: "Armchair", category: "Living Room", widthFt: 2.75, depthFt: 2.75 },
  { id: "coffee-table", name: "Coffee Table", category: "Living Room", widthFt: 4, depthFt: 2 },
  { id: "tv-stand", name: "TV Stand", category: "Living Room", widthFt: 5, depthFt: 1.5 },
  { id: "bookshelf", name: "Bookshelf", category: "Living Room", widthFt: 3, depthFt: 1 },

  // Kitchen
  { id: "fridge", name: "Refrigerator", category: "Kitchen", widthFt: 2.75, depthFt: 2.75 },
  { id: "stove", name: "Stove/Range", category: "Kitchen", widthFt: 2.5, depthFt: 2 },
  { id: "dishwasher", name: "Dishwasher", category: "Kitchen", widthFt: 2, depthFt: 2 },
  { id: "kitchen-island", name: "Kitchen Island", category: "Kitchen", widthFt: 4, depthFt: 2 },
  { id: "sink", name: "Sink", category: "Kitchen", widthFt: 2, depthFt: 1.5 },

  // Dining
  { id: "dining-4", name: "Dining Table (4)", category: "Dining", widthFt: 4, depthFt: 3 },
  { id: "dining-6", name: "Dining Table (6)", category: "Dining", widthFt: 6, depthFt: 3 },
  { id: "dining-chair", name: "Dining Chair", category: "Dining", widthFt: 1.5, depthFt: 1.5 },

  // Bathroom
  { id: "toilet", name: "Toilet", category: "Bathroom", widthFt: 1.5, depthFt: 2.5 },
  { id: "bathtub", name: "Bathtub", category: "Bathroom", widthFt: 2.5, depthFt: 5 },
  { id: "shower", name: "Shower Stall", category: "Bathroom", widthFt: 3, depthFt: 3 },
  { id: "vanity", name: "Vanity/Sink", category: "Bathroom", widthFt: 2, depthFt: 1.5 },

  // Office
  { id: "desk", name: "Desk", category: "Office", widthFt: 4, depthFt: 2 },
  { id: "office-chair", name: "Office Chair", category: "Office", widthFt: 2, depthFt: 2 },
  { id: "filing-cabinet", name: "Filing Cabinet", category: "Office", widthFt: 1.5, depthFt: 2 },
];

export const FURNITURE_CATEGORIES: FurnitureCategory[] = [
  "Bedroom",
  "Living Room",
  "Kitchen",
  "Dining",
  "Bathroom",
  "Office",
  "Custom",
];

export const CATEGORY_COLORS: Record<FurnitureCategory, string> = {
  Bedroom: "#7dd3fc",
  "Living Room": "#86efac",
  Kitchen: "#fca5a5",
  Dining: "#fdba74",
  Bathroom: "#c4b5fd",
  Office: "#fde68a",
  Custom: "#22d3ee",
};
