// ============================================================
// SPACE PLANNER STUDIO — Furniture SVG Symbols
// Architectural floor plan style symbols for furniture
// ============================================================

export const FURNITURE_SYMBOLS: Record<string, string> = {
  // BEDS
  bed_twin: `
    <svg viewBox="0 0 96 48" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="8" width="80" height="32" fill="none" stroke="currentColor" stroke-width="2"/>
      <line x1="8" y1="20" x2="88" y2="20" stroke="currentColor" stroke-width="1"/>
      <circle cx="16" cy="12" r="3" fill="currentColor"/>
      <circle cx="80" cy="12" r="3" fill="currentColor"/>
    </svg>
  `,
  
  bed_full: `
    <svg viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="8" width="104" height="44" fill="none" stroke="currentColor" stroke-width="2"/>
      <line x1="8" y1="24" x2="112" y2="24" stroke="currentColor" stroke-width="1"/>
      <circle cx="16" cy="12" r="3" fill="currentColor"/>
      <circle cx="104" cy="12" r="3" fill="currentColor"/>
    </svg>
  `,
  
  bed_queen: `
    <svg viewBox="0 0 144 72" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="8" width="128" height="56" fill="none" stroke="currentColor" stroke-width="2"/>
      <line x1="8" y1="28" x2="136" y2="28" stroke="currentColor" stroke-width="1"/>
      <circle cx="16" cy="12" r="3" fill="currentColor"/>
      <circle cx="128" cy="12" r="3" fill="currentColor"/>
    </svg>
  `,
  
  bed_king: `
    <svg viewBox="0 0 168 84" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="8" width="152" height="68" fill="none" stroke="currentColor" stroke-width="2"/>
      <line x1="8" y1="32" x2="160" y2="32" stroke="currentColor" stroke-width="1"/>
      <circle cx="16" cy="12" r="3" fill="currentColor"/>
      <circle cx="152" cy="12" r="3" fill="currentColor"/>
    </svg>
  `,

  // SOFAS & COUCHES
  sofa_2seat: `
    <svg viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="16" width="104" height="36" fill="none" stroke="currentColor" stroke-width="2" rx="4"/>
      <line x1="8" y1="28" x2="112" y2="28" stroke="currentColor" stroke-width="1"/>
      <line x1="60" y1="16" x2="60" y2="52" stroke="currentColor" stroke-width="1"/>
      <rect x="4" y="20" width="4" height="28" fill="currentColor"/>
      <rect x="112" y="20" width="4" height="28" fill="currentColor"/>
    </svg>
  `,
  
  sofa_3seat: `
    <svg viewBox="0 0 160 60" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="16" width="144" height="36" fill="none" stroke="currentColor" stroke-width="2" rx="4"/>
      <line x1="8" y1="28" x2="152" y2="28" stroke="currentColor" stroke-width="1"/>
      <line x1="56" y1="16" x2="56" y2="52" stroke="currentColor" stroke-width="1"/>
      <line x1="104" y1="16" x2="104" y2="52" stroke="currentColor" stroke-width="1"/>
      <rect x="4" y="20" width="4" height="28" fill="currentColor"/>
      <rect x="152" y="20" width="4" height="28" fill="currentColor"/>
    </svg>
  `,
  
  sofa_4seat: `
    <svg viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="16" width="184" height="36" fill="none" stroke="currentColor" stroke-width="2" rx="4"/>
      <line x1="8" y1="28" x2="192" y2="28" stroke="currentColor" stroke-width="1"/>
      <line x1="56" y1="16" x2="56" y2="52" stroke="currentColor" stroke-width="1"/>
      <line x1="104" y1="16" x2="104" y2="52" stroke="currentColor" stroke-width="1"/>
      <line x1="152" y1="16" x2="152" y2="52" stroke="currentColor" stroke-width="1"/>
      <rect x="4" y="20" width="4" height="28" fill="currentColor"/>
      <rect x="192" y="20" width="4" height="28" fill="currentColor"/>
    </svg>
  `,

  // CHAIRS
  chair_armchair: `
    <svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="16" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2" rx="2"/>
      <rect x="8" y="20" width="4" height="28" fill="currentColor"/>
      <rect x="48" y="20" width="4" height="28" fill="currentColor"/>
      <circle cx="30" cy="30" r="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
    </svg>
  `,
  
  chair_accent: `
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <polygon points="24,8 40,40 8,40" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="24" cy="28" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/>
    </svg>
  `,
  
  chair_dining: `
    <svg viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="12" width="24" height="20" fill="none" stroke="currentColor" stroke-width="2" rx="2"/>
      <line x1="12" y1="32" x2="12" y2="44" stroke="currentColor" stroke-width="2"/>
      <line x1="28" y1="32" x2="28" y2="44" stroke="currentColor" stroke-width="2"/>
      <rect x="10" y="42" width="20" height="2" fill="currentColor"/>
    </svg>
  `,

  // TABLES
  table_coffee: `
    <svg viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="12" width="76" height="36" fill="none" stroke="currentColor" stroke-width="2" rx="4"/>
      <line x1="12" y1="24" x2="88" y2="24" stroke="currentColor" stroke-width="1" opacity="0.5"/>
    </svg>
  `,
  
  table_end: `
    <svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="12" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2" rx="2"/>
      <circle cx="30" cy="30" r="3" fill="currentColor"/>
    </svg>
  `,
  
  table_dining: `
    <svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="60" cy="40" rx="52" ry="32" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="60" cy="40" r="4" fill="currentColor"/>
    </svg>
  `,
  
  table_console: `
    <svg viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="8" width="84" height="24" fill="none" stroke="currentColor" stroke-width="2" rx="2"/>
      <line x1="8" y1="16" x2="92" y2="16" stroke="currentColor" stroke-width="1" opacity="0.5"/>
    </svg>
  `,

  // ENTERTAINMENT CENTER
  entertainment_center: `
    <svg viewBox="0 0 140 80" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="12" width="124" height="56" fill="none" stroke="currentColor" stroke-width="2" rx="2"/>
      <rect x="16" y="20" width="28" height="40" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <rect x="48" y="20" width="44" height="40" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <rect x="96" y="20" width="28" height="40" fill="none" stroke="currentColor" stroke-width="1.5"/>
    </svg>
  `,

  // DRESSER
  dresser_3drawer: `
    <svg viewBox="0 0 80 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="8" width="64" height="84" fill="none" stroke="currentColor" stroke-width="2" rx="2"/>
      <line x1="8" y1="36" x2="72" y2="36" stroke="currentColor" stroke-width="1"/>
      <line x1="8" y1="64" x2="72" y2="64" stroke="currentColor" stroke-width="1"/>
      <circle cx="40" cy="22" r="2" fill="currentColor"/>
      <circle cx="40" cy="50" r="2" fill="currentColor"/>
      <circle cx="40" cy="78" r="2" fill="currentColor"/>
    </svg>
  `,
  
  dresser_6drawer: `
    <svg viewBox="0 0 80 120" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="8" width="64" height="104" fill="none" stroke="currentColor" stroke-width="2" rx="2"/>
      <line x1="8" y1="28" x2="72" y2="28" stroke="currentColor" stroke-width="1"/>
      <line x1="8" y1="48" x2="72" y2="48" stroke="currentColor" stroke-width="1"/>
      <line x1="8" y1="68" x2="72" y2="68" stroke="currentColor" stroke-width="1"/>
      <line x1="8" y1="88" x2="72" y2="88" stroke="currentColor" stroke-width="1"/>
      <circle cx="40" cy="18" r="2" fill="currentColor"/>
      <circle cx="40" cy="38" r="2" fill="currentColor"/>
      <circle cx="40" cy="58" r="2" fill="currentColor"/>
      <circle cx="40" cy="78" r="2" fill="currentColor"/>
      <circle cx="40" cy="98" r="2" fill="currentColor"/>
    </svg>
  `,

  // NIGHTSTAND
  nightstand: `
    <svg viewBox="0 0 50 60" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="12" width="34" height="40" fill="none" stroke="currentColor" stroke-width="2" rx="2"/>
      <line x1="8" y1="32" x2="42" y2="32" stroke="currentColor" stroke-width="1"/>
      <circle cx="25" cy="22" r="2" fill="currentColor"/>
      <circle cx="25" cy="42" r="2" fill="currentColor"/>
    </svg>
  `,

  // POTTED PLANT
  plant_small: `
    <svg viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
      <path d="M 12 40 L 10 50 L 30 50 L 28 40 Z" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="20" cy="28" r="12" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M 12 28 Q 8 20 12 12" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <path d="M 28 28 Q 32 20 28 12" fill="none" stroke="currentColor" stroke-width="1.5"/>
    </svg>
  `,
  
  plant_medium: `
    <svg viewBox="0 0 50 60" xmlns="http://www.w3.org/2000/svg">
      <path d="M 14 48 L 12 60 L 38 60 L 36 48 Z" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="25" cy="32" r="16" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M 14 32 Q 8 20 14 10" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <path d="M 36 32 Q 42 20 36 10" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <path d="M 25 16 Q 20 8 25 2" fill="none" stroke="currentColor" stroke-width="1.5"/>
    </svg>
  `,
  
  plant_large: `
    <svg viewBox="0 0 60 70" xmlns="http://www.w3.org/2000/svg">
      <path d="M 16 56 L 14 70 L 46 70 L 44 56 Z" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="30" cy="36" r="20" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M 14 36 Q 6 22 14 8" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <path d="M 46 36 Q 54 22 46 8" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <path d="M 30 16 Q 22 6 30 2" fill="none" stroke="currentColor" stroke-width="1.5"/>
    </svg>
  `,

  // DOOR (swing)
  door_swing_left: `
    <svg viewBox="0 0 80 20" xmlns="http://www.w3.org/2000/svg">
      <line x1="10" y1="2" x2="10" y2="18" stroke="currentColor" stroke-width="2"/>
      <path d="M 10 10 Q 40 10 70 10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3,3"/>
      <circle cx="70" cy="10" r="2" fill="currentColor"/>
    </svg>
  `,
  
  door_swing_right: `
    <svg viewBox="0 0 80 20" xmlns="http://www.w3.org/2000/svg">
      <line x1="70" y1="2" x2="70" y2="18" stroke="currentColor" stroke-width="2"/>
      <path d="M 70 10 Q 40 10 10 10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3,3"/>
      <circle cx="10" cy="10" r="2" fill="currentColor"/>
    </svg>
  `,

  // WINDOW
  window: `
    <svg viewBox="0 0 80 20" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="2" width="60" height="16" fill="none" stroke="currentColor" stroke-width="2"/>
      <line x1="40" y1="2" x2="40" y2="18" stroke="currentColor" stroke-width="1"/>
      <line x1="10" y1="10" x2="70" y2="10" stroke="currentColor" stroke-width="1"/>
    </svg>
  `,
};

// Map furniture IDs to symbol types
const FURNITURE_ID_TO_SYMBOL: Record<string, string> = {
  // Beds
  "twin-bed": "bed_twin",
  "full-bed": "bed_full",
  "queen-bed": "bed_queen",
  "king-bed": "bed_king",
  // Sofas
  "sofa-2seat": "sofa_2seat",
  "sofa-3seat": "sofa_3seat",
  "sofa-4seat": "sofa_4seat",
  "sectional-l-small": "sofa_3seat",
  "sectional-l-large": "sofa_4seat",
  "sectional-u": "sofa_4seat",
  // Chairs
  "armchair-std": "chair_armchair",
  "armchair-large": "chair_armchair",
  "accent-chair": "chair_accent",
  "wingback-chair": "chair_armchair",
  "recliner": "chair_armchair",
  "rocker": "chair_accent",
  "dining-chair": "chair_dining",
  "office-chair": "chair_accent",
  // Tables
  "coffee-table-small": "table_coffee",
  "coffee-table-std": "table_coffee",
  "coffee-table-large": "table_coffee",
  "coffee-table-round": "table_coffee",
  "end-table-small": "table_end",
  "end-table-std": "table_end",
  "end-table-large": "table_end",
  "end-table-round": "table_end",
  "dining-table-4": "table_dining",
  "dining-table-6": "table_dining",
  "dining-table-8": "table_dining",
  "console-table": "table_console",
  "desk-small": "table_console",
  "desk-std": "table_console",
  "desk-large": "table_console",
  // Entertainment
  "tv-stand-small": "entertainment_center",
  "tv-stand-std": "entertainment_center",
  "tv-stand-large": "entertainment_center",
  "entertainment-center": "entertainment_center",
  "entertainment-center-med": "entertainment_center",
  "entertainment-center-large": "entertainment_center",
  "bookshelf-narrow": "entertainment_center",
  "bookshelf-std": "entertainment_center",
  "bookshelf-wide": "entertainment_center",
  "bookshelf-office": "entertainment_center",
  "cabinet": "entertainment_center",
  // Dressers
  "dresser-3drawer": "dresser_3drawer",
  "dresser-5drawer": "dresser_3drawer",
  "dresser-6drawer": "dresser_6drawer",
  "dresser-wide": "dresser_6drawer",
  // Nightstands
  "nightstand-small": "nightstand",
  "nightstand-std": "nightstand",
  "nightstand-large": "nightstand",
  // Plants
  "plant-small": "plant_small",
  "plant-medium": "plant_medium",
  "plant-large": "plant_large",
  // Kitchen
  "fridge": "entertainment_center",
  "stove": "entertainment_center",
  "kitchen-island": "table_console",
  "kitchen-counter": "table_console",
  "microwave": "entertainment_center",
  "dishwasher": "entertainment_center",
  // Bathroom
  "toilet": "entertainment_center",
  "sink": "table_console",
  "bathtub": "entertainment_center",
  "shower": "entertainment_center",
  // Decor
  "mirror": "entertainment_center",
  "lamp-floor": "plant_small",
  "lamp-table": "plant_small",
  "rug-small": "table_coffee",
  "rug-medium": "table_coffee",
  "rug-large": "table_coffee",
  // Other
  "wardrobe": "entertainment_center",
  "bench-bed": "table_console",
};

export function getFurnitureSymbol(furnitureId: string): string {
  const symbolType = FURNITURE_ID_TO_SYMBOL[furnitureId] || "chair_dining";
  return FURNITURE_SYMBOLS[symbolType] || FURNITURE_SYMBOLS.chair_dining;
}

export function renderFurnitureSymbol(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  furnitureType: string,
  color: string = "#00D9FF"
): void {
  // Save context state
  ctx.save();
  
  // Translate to furniture position
  ctx.translate(x, y);
  
  // Set color
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.5;
  
  // Draw based on furniture type
  switch (furnitureType) {
    case "bed_twin":
      drawBed(ctx, width, height, 0.4);
      break;
    case "bed_full":
      drawBed(ctx, width, height, 0.5);
      break;
    case "bed_queen":
      drawBed(ctx, width, height, 0.6);
      break;
    case "bed_king":
      drawBed(ctx, width, height, 0.7);
      break;
    case "sofa_2seat":
      drawSofa(ctx, width, height, 2);
      break;
    case "sofa_3seat":
      drawSofa(ctx, width, height, 3);
      break;
    case "sofa_4seat":
      drawSofa(ctx, width, height, 4);
      break;
    case "table_coffee":
      drawTable(ctx, width, height);
      break;
    case "plant_small":
      drawPlant(ctx, width, height, 0.6);
      break;
    case "plant_medium":
      drawPlant(ctx, width, height, 0.8);
      break;
    case "plant_large":
      drawPlant(ctx, width, height, 1.0);
      break;
    default:
      drawRectangle(ctx, width, height);
  }
  
  // Restore context state
  ctx.restore();
}

function drawBed(ctx: CanvasRenderingContext2D, w: number, h: number, headboardRatio: number): void {
  ctx.strokeRect(0, 0, w, h);
  ctx.beginPath();
  ctx.moveTo(0, h * headboardRatio);
  ctx.lineTo(w, h * headboardRatio);
  ctx.stroke();
}

function drawSofa(ctx: CanvasRenderingContext2D, w: number, h: number, seats: number): void {
  ctx.strokeRect(0, 0, w, h);
  const seatWidth = w / seats;
  for (let i = 1; i < seats; i++) {
    ctx.beginPath();
    ctx.moveTo(i * seatWidth, 0);
    ctx.lineTo(i * seatWidth, h);
    ctx.stroke();
  }
}

function drawTable(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.strokeRect(w * 0.1, h * 0.1, w * 0.8, h * 0.8);
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, Math.min(w, h) * 0.15, 0, Math.PI * 2);
  ctx.stroke();
}

function drawPlant(ctx: CanvasRenderingContext2D, w: number, h: number, scale: number): void {
  const centerX = w / 2;
  const centerY = h / 2;
  const radius = Math.min(w, h) * 0.3 * scale;
  
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();
  
  // Pot
  ctx.beginPath();
  ctx.moveTo(centerX - radius * 0.6, centerY + radius);
  ctx.lineTo(centerX - radius * 0.5, centerY + radius * 1.3);
  ctx.lineTo(centerX + radius * 0.5, centerY + radius * 1.3);
  ctx.lineTo(centerX + radius * 0.6, centerY + radius);
  ctx.stroke();
}

function drawRectangle(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.strokeRect(0, 0, w, h);
}
