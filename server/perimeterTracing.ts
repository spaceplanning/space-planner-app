/**
 * Perimeter Tracing Utilities
 * Ensures extracted wireframes match the exact floor plan geometry
 */

import type { Point } from "../client/src/lib/polygonUtils";

export interface PerimeterValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  perimeter: {
    length: number;
    area: number;
    isClockwise: boolean;
  };
}

/**
 * Validate that wireframe perimeter matches expected floor plan outline
 */
export function validatePerimeter(
  wireframe: Point[],
  totalSquareFeet: number,
  tolerance: number = 0.05
): PerimeterValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check minimum vertices for a valid polygon
  if (!wireframe || wireframe.length < 3) {
    errors.push(
      `Wireframe must have at least 3 vertices, got ${wireframe?.length || 0}`
    );
    return { isValid: false, errors, warnings, perimeter: { length: 0, area: 0, isClockwise: false } };
  }

  // Calculate perimeter length
  let perimeterLength = 0;
  for (let i = 0; i < wireframe.length; i++) {
    const p1 = wireframe[i];
    const p2 = wireframe[(i + 1) % wireframe.length];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    perimeterLength += Math.sqrt(dx * dx + dy * dy);
  }

  // Calculate area using shoelace formula
  let area = 0;
  for (let i = 0; i < wireframe.length; i++) {
    const p1 = wireframe[i];
    const p2 = wireframe[(i + 1) % wireframe.length];
    area += (p1.x * p2.y - p2.x * p1.y);
  }
  area = Math.abs(area) / 2;

  // Check if area matches total square footage
  const expectedArea = totalSquareFeet;
  const areaError = Math.abs(area - expectedArea) / expectedArea;
  if (areaError > tolerance) {
    warnings.push(
      `Wireframe area (${area.toFixed(1)} sq ft) differs from expected (${expectedArea.toFixed(1)} sq ft) by ${(areaError * 100).toFixed(1)}%`
    );
  }

  // Check for self-intersections
  if (hasSelfIntersection(wireframe)) {
    errors.push("Wireframe has self-intersecting edges");
  }

  // Check for duplicate consecutive vertices
  for (let i = 0; i < wireframe.length; i++) {
    const p1 = wireframe[i];
    const p2 = wireframe[(i + 1) % wireframe.length];
    if (p1.x === p2.x && p1.y === p2.y) {
      errors.push(`Duplicate consecutive vertices at index ${i} and ${i + 1}`);
    }
  }

  // Determine if polygon is clockwise or counter-clockwise
  let sum = 0;
  for (let i = 0; i < wireframe.length; i++) {
    const p1 = wireframe[i];
    const p2 = wireframe[(i + 1) % wireframe.length];
    sum += (p2.x - p1.x) * (p2.y + p1.y);
  }
  const isClockwise = sum > 0;

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    perimeter: {
      length: perimeterLength,
      area,
      isClockwise,
    },
  };
}

/**
 * Check if polygon has self-intersecting edges
 */
function hasSelfIntersection(polygon: Point[]): boolean {
  for (let i = 0; i < polygon.length; i++) {
    const p1 = polygon[i];
    const p2 = polygon[(i + 1) % polygon.length];

    // Check against all non-adjacent edges
    for (let j = i + 2; j < polygon.length; j++) {
      if (j === polygon.length - 1 && i === 0) continue; // Skip adjacent edges

      const p3 = polygon[j];
      const p4 = polygon[(j + 1) % polygon.length];

      if (segmentsIntersect(p1, p2, p3, p4)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Check if two line segments intersect
 */
function segmentsIntersect(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
  const ccw = (A: Point, B: Point, C: Point) => {
    return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
  };

  return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
}

/**
 * Ensure wireframe is in clockwise order (standard for floor plans)
 */
export function ensureClockwise(polygon: Point[]): Point[] {
  let sum = 0;
  for (let i = 0; i < polygon.length; i++) {
    const p1 = polygon[i];
    const p2 = polygon[(i + 1) % polygon.length];
    sum += (p2.x - p1.x) * (p2.y + p1.y);
  }

  // If counter-clockwise (sum < 0), reverse
  if (sum < 0) {
    return [...polygon].reverse();
  }

  return polygon;
}

/**
 * Simplify wireframe by removing collinear points (optional)
 * This preserves the exact shape while removing redundant vertices
 */
export function simplifyWireframe(polygon: Point[], tolerance: number = 0.01): Point[] {
  if (polygon.length <= 3) return polygon;

  const simplified: Point[] = [];

  for (let i = 0; i < polygon.length; i++) {
    const p1 = polygon[i];
    const p2 = polygon[(i + 1) % polygon.length];
    const p3 = polygon[(i + 2) % polygon.length];

    // Check if p2 is collinear with p1 and p3
    const cross = (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);

    if (Math.abs(cross) > tolerance) {
      // Not collinear, keep the point
      simplified.push(p2);
    }
  }

  return simplified.length >= 3 ? simplified : polygon;
}

/**
 * Validate that sections fit within the wireframe perimeter
 */
export function validateSectionsWithinPerimeter(
  wireframe: Point[],
  sections: Array<{ boundary: Point[] }>
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const section of sections) {
    for (const vertex of section.boundary) {
      if (!isPointInPolygon(vertex, wireframe)) {
        errors.push(
          `Section vertex (${vertex.x}, ${vertex.y}) is outside wireframe perimeter`
        );
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Check if a point is inside a polygon using ray casting
 */
function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const p1 = polygon[i];
    const p2 = polygon[j];

    if (
      p1.y > point.y !== p2.y > point.y &&
      point.x < ((p2.x - p1.x) * (point.y - p1.y)) / (p2.y - p1.y) + p1.x
    ) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * Extract bounding box from wireframe
 */
export function getWireframeBounds(wireframe: Point[]): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
} {
  let minX = Infinity,
    maxX = -Infinity;
  let minY = Infinity,
    maxY = -Infinity;

  for (const point of wireframe) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
