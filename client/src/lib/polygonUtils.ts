/**
 * Polygon rendering utilities for complex room shapes
 * Handles L-shaped, angled, and irregular polygons
 */

export interface Point {
  x: number;
  y: number;
}

/**
 * Convert polygon points to SVG path string
 * Handles closed polygons with proper formatting
 */
export function pointsToSVGPath(points: Point[]): string {
  if (points.length < 3) return "";

  const pathParts: string[] = [];

  // Move to first point
  pathParts.push(`M ${points[0].x} ${points[0].y}`);

  // Line to each subsequent point
  for (let i = 1; i < points.length; i++) {
    pathParts.push(`L ${points[i].x} ${points[i].y}`);
  }

  // Close the path
  pathParts.push("Z");

  return pathParts.join(" ");
}

/**
 * Calculate the centroid (center) of a polygon
 * Useful for label positioning
 */
export function calculatePolygonCentroid(points: Point[]): Point {
  if (points.length === 0) return { x: 0, y: 0 };

  let sumX = 0;
  let sumY = 0;

  for (const point of points) {
    sumX += point.x;
    sumY += point.y;
  }

  return {
    x: sumX / points.length,
    y: sumY / points.length,
  };
}

/**
 * Calculate the area of a polygon using the Shoelace formula
 */
export function calculatePolygonArea(points: Point[]): number {
  if (points.length < 3) return 0;

  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    area += current.x * next.y - next.x * current.y;
  }
  return Math.abs(area) / 2;
}

/**
 * Calculate the perimeter of a polygon
 */
export function calculatePolygonPerimeter(points: Point[]): number {
  if (points.length < 2) return 0;

  let perimeter = 0;
  for (let i = 0; i < points.length; i++) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    const dx = next.x - current.x;
    const dy = next.y - current.y;
    perimeter += Math.sqrt(dx * dx + dy * dy);
  }
  return perimeter;
}

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
export function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Get the bounding box of a polygon
 */
export function getPolygonBounds(points: Point[]): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
} {
  if (points.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }

  let minX = points[0].x;
  let maxX = points[0].x;
  let minY = points[0].y;
  let maxY = points[0].y;

  for (const point of points) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }

  return { minX, maxX, minY, maxY };
}

/**
 * Simplify polygon by removing collinear points
 * Useful for reducing complexity while preserving shape
 */
export function simplifyPolygon(
  points: Point[],
  tolerance: number = 0.1
): Point[] {
  if (points.length <= 3) return points;

  const simplified: Point[] = [];

  for (let i = 0; i < points.length; i++) {
    const prev = points[(i - 1 + points.length) % points.length];
    const curr = points[i];
    const next = points[(i + 1) % points.length];

    // Calculate cross product to detect collinearity
    const crossProduct =
      (curr.x - prev.x) * (next.y - curr.y) -
      (curr.y - prev.y) * (next.x - curr.x);

    // If cross product is above tolerance, point is not collinear
    if (Math.abs(crossProduct) > tolerance) {
      simplified.push(curr);
    }
  }

  return simplified.length >= 3 ? simplified : points;
}

/**
 * Offset polygon outward by a given distance
 * Useful for creating borders or expanded areas
 */
export function offsetPolygon(points: Point[], distance: number): Point[] {
  if (points.length < 3) return points;

  const offsetPoints: Point[] = [];

  for (let i = 0; i < points.length; i++) {
    const prev = points[(i - 1 + points.length) % points.length];
    const curr = points[i];
    const next = points[(i + 1) % points.length];

    // Calculate vectors
    const v1 = { x: curr.x - prev.x, y: curr.y - prev.y };
    const v2 = { x: next.x - curr.x, y: next.y - curr.y };

    // Normalize vectors
    const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

    const n1 = { x: -v1.y / len1, y: v1.x / len1 };
    const n2 = { x: -v2.y / len2, y: v2.x / len2 };

    // Average normals
    const n = {
      x: (n1.x + n2.x) / 2,
      y: (n1.y + n2.y) / 2,
    };

    // Normalize average normal
    const nLen = Math.sqrt(n.x * n.x + n.y * n.y);
    const nNorm = { x: n.x / nLen, y: n.y / nLen };

    // Offset point
    offsetPoints.push({
      x: curr.x + nNorm.x * distance,
      y: curr.y + nNorm.y * distance,
    });
  }

  return offsetPoints;
}

/**
 * Check if polygon is clockwise or counter-clockwise
 * Returns true if clockwise, false if counter-clockwise
 */
export function isPolygonClockwise(points: Point[]): boolean {
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const curr = points[i];
    const next = points[(i + 1) % points.length];
    sum += (next.x - curr.x) * (next.y + curr.y);
  }
  return sum > 0;
}

/**
 * Reverse polygon winding order
 * Converts between clockwise and counter-clockwise
 */
export function reversePolygonWinding(points: Point[]): Point[] {
  return [...points].reverse();
}

/**
 * Format polygon points as a readable string for display
 */
export function formatPolygonPoints(points: Point[]): string {
  return points.map((p) => `(${p.x.toFixed(1)}, ${p.y.toFixed(1)})`).join(" → ");
}

/**
 * Calculate the distance between two points
 */
export function distanceBetweenPoints(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Find the closest point on a polygon to a given point
 */
export function findClosestPointOnPolygon(
  point: Point,
  polygon: Point[]
): { point: Point; distance: number; edgeIndex: number } {
  let minDistance = Infinity;
  let closestPoint: Point = point;
  let closestEdgeIndex = 0;

  for (let i = 0; i < polygon.length; i++) {
    const p1 = polygon[i];
    const p2 = polygon[(i + 1) % polygon.length];

    // Find closest point on edge
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const lengthSq = dx * dx + dy * dy;

    if (lengthSq === 0) {
      // Edge is a point
      const dist = distanceBetweenPoints(point, p1);
      if (dist < minDistance) {
        minDistance = dist;
        closestPoint = p1;
        closestEdgeIndex = i;
      }
    } else {
      // Project point onto edge
      let t = ((point.x - p1.x) * dx + (point.y - p1.y) * dy) / lengthSq;
      t = Math.max(0, Math.min(1, t));

      const projectedPoint = {
        x: p1.x + t * dx,
        y: p1.y + t * dy,
      };

      const dist = distanceBetweenPoints(point, projectedPoint);
      if (dist < minDistance) {
        minDistance = dist;
        closestPoint = projectedPoint;
        closestEdgeIndex = i;
      }
    }
  }

  return { point: closestPoint, distance: minDistance, edgeIndex: closestEdgeIndex };
}
