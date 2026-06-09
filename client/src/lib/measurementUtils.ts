// ============================================================
// SPACE PLANNER STUDIO — Measurement Utilities
// Blueprint Dark Theme: distance and area calculations
// ============================================================

export interface MeasurementPoint {
  x: number;
  y: number;
  label: string;
}

export interface MeasurementResult {
  type: "distance" | "area";
  value: number;
  unit: "ft" | "sq ft";
  points: MeasurementPoint[];
  perimeter?: number;
}

/**
 * Calculate distance between two points in feet
 */
export function calculateDistance(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate area using the Shoelace formula (works for any polygon)
 * Points should be in order (clockwise or counterclockwise)
 */
export function calculateArea(points: Array<{ x: number; y: number }>): number {
  if (points.length < 3) return 0;

  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
}

/**
 * Calculate perimeter of a polygon
 */
export function calculatePerimeter(points: Array<{ x: number; y: number }>): number {
  if (points.length < 2) return 0;

  let perimeter = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    perimeter += calculateDistance(points[i].x, points[i].y, points[j].x, points[j].y);
  }
  return perimeter;
}

/**
 * Format feet to feet and inches notation
 */
export function formatMeasurement(feet: number): string {
  const wholeF = Math.floor(feet);
  const inches = Math.round((feet - wholeF) * 12);
  if (inches === 0) return `${wholeF}'`;
  if (wholeF === 0) return `${inches}"`;
  return `${wholeF}'${inches}"`;
}

/**
 * Get angle between three points (in degrees)
 */
export function getAngle(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number
): number {
  const angle1 = Math.atan2(y1 - y2, x1 - x2);
  const angle2 = Math.atan2(y3 - y2, x3 - x2);
  let angle = (angle2 - angle1) * (180 / Math.PI);
  if (angle < 0) angle += 360;
  return angle;
}

/**
 * Check if point is inside polygon (ray casting algorithm)
 */
export function isPointInPolygon(
  x: number,
  y: number,
  points: Array<{ x: number; y: number }>
): boolean {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].x;
    const yi = points[i].y;
    const xj = points[j].x;
    const yj = points[j].y;

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
