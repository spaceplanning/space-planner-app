/**
 * Vertex editing utilities for polygon manipulation
 * Handles drag detection, snapping, and real-time updates
 */

import type { Point } from "./polygonUtils";
import { calculatePolygonArea, calculatePolygonPerimeter } from "./polygonUtils";

export interface VertexDragResult {
  originalBoundary: Point[];
  updatedBoundary: Point[];
  area: number;
  perimeter: number;
  isValid: boolean;
  validationErrors: string[];
}

/**
 * Check if a point is near a vertex (within click tolerance)
 */
export function isPointNearVertex(
  point: Point,
  vertex: Point,
  tolerance: number = 8
): boolean {
  const dx = point.x - vertex.x;
  const dy = point.y - vertex.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance <= tolerance;
}

/**
 * Find the closest vertex to a point
 */
export function findClosestVertex(
  point: Point,
  boundary: Point[]
): { index: number; vertex: Point; distance: number } | null {
  if (boundary.length === 0) return null;

  let minDistance = Infinity;
  let closestIndex = 0;

  for (let i = 0; i < boundary.length; i++) {
    const vertex = boundary[i];
    const dx = point.x - vertex.x;
    const dy = point.y - vertex.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = i;
    }
  }

  return {
    index: closestIndex,
    vertex: boundary[closestIndex],
    distance: minDistance,
  };
}

/**
 * Update a vertex in a polygon boundary
 */
export function updateVertexInBoundary(
  boundary: Point[],
  vertexIndex: number,
  newPosition: Point
): Point[] {
  if (vertexIndex < 0 || vertexIndex >= boundary.length) {
    return boundary;
  }

  const updated = [...boundary];
  updated[vertexIndex] = { ...newPosition };
  return updated;
}

/**
 * Snap a vertex to a grid
 */
export function snapVertexToGrid(
  vertex: Point,
  gridSize: number = 0.5
): Point {
  return {
    x: Math.round(vertex.x / gridSize) * gridSize,
    y: Math.round(vertex.y / gridSize) * gridSize,
  };
}

/**
 * Validate a polygon boundary
 */
export function validateBoundary(boundary: Point[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (boundary.length < 3) {
    errors.push("Polygon must have at least 3 vertices");
  }

  // Check for duplicate consecutive vertices
  for (let i = 0; i < boundary.length; i++) {
    const current = boundary[i];
    const next = boundary[(i + 1) % boundary.length];

    if (current.x === next.x && current.y === next.y) {
      errors.push(`Duplicate vertex at index ${i}`);
    }
  }

  // Check for self-intersecting edges (simplified check)
  for (let i = 0; i < boundary.length; i++) {
    const p1 = boundary[i];
    const p2 = boundary[(i + 1) % boundary.length];

    for (let j = i + 2; j < boundary.length; j++) {
      if (j === boundary.length - 1 && i === 0) continue; // Skip adjacent edges

      const p3 = boundary[j];
      const p4 = boundary[(j + 1) % boundary.length];

      if (segmentsIntersect(p1, p2, p3, p4)) {
        errors.push(`Edges intersect at indices ${i} and ${j}`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Check if two line segments intersect
 */
function segmentsIntersect(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
  const ccw = (A: Point, B: Point, C: Point): boolean => {
    return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
  };

  return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
}

/**
 * Calculate drag result with validation
 */
export function calculateDragResult(
  originalBoundary: Point[],
  updatedBoundary: Point[]
): VertexDragResult {
  const validation = validateBoundary(updatedBoundary);

  return {
    originalBoundary,
    updatedBoundary,
    area: calculatePolygonArea(updatedBoundary),
    perimeter: calculatePolygonPerimeter(updatedBoundary),
    isValid: validation.isValid,
    validationErrors: validation.errors,
  };
}

/**
 * Constrain vertex movement to a bounding box
 */
export function constrainVertexToBounds(
  vertex: Point,
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
  margin: number = 0
): Point {
  return {
    x: Math.max(bounds.minX + margin, Math.min(bounds.maxX - margin, vertex.x)),
    y: Math.max(bounds.minY + margin, Math.min(bounds.maxY - margin, vertex.y)),
  };
}

/**
 * Get the perpendicular distance from a point to a line segment
 */
export function distancePointToSegment(
  point: Point,
  p1: Point,
  p2: Point
): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq === 0) {
    const pdx = point.x - p1.x;
    const pdy = point.y - p1.y;
    return Math.sqrt(pdx * pdx + pdy * pdy);
  }

  let t = ((point.x - p1.x) * dx + (point.y - p1.y) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));

  const projectedX = p1.x + t * dx;
  const projectedY = p1.y + t * dy;

  const pdx = point.x - projectedX;
  const pdy = point.y - projectedY;

  return Math.sqrt(pdx * pdx + pdy * pdy);
}

/**
 * Smooth polygon by averaging nearby vertices
 */
export function smoothPolygon(
  boundary: Point[],
  iterations: number = 1
): Point[] {
  let smoothed = [...boundary];

  for (let iter = 0; iter < iterations; iter++) {
    const newBoundary: Point[] = [];

    for (let i = 0; i < smoothed.length; i++) {
      const prev = smoothed[(i - 1 + smoothed.length) % smoothed.length];
      const current = smoothed[i];
      const next = smoothed[(i + 1) % smoothed.length];

      newBoundary.push({
        x: (prev.x + current.x + next.x) / 3,
        y: (prev.y + current.y + next.y) / 3,
      });
    }

    smoothed = newBoundary;
  }

  return smoothed;
}

/**
 * Get the angle between three points
 */
export function getAngleBetweenPoints(p1: Point, p2: Point, p3: Point): number {
  const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
  const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };

  const dot = v1.x * v2.x + v1.y * v2.y;
  const det = v1.x * v2.y - v1.y * v2.x;

  return Math.atan2(det, dot);
}

/**
 * Check if a vertex edit would create a valid polygon
 */
export function isValidVertexEdit(
  boundary: Point[],
  vertexIndex: number,
  newPosition: Point
): boolean {
  const updated = updateVertexInBoundary(boundary, vertexIndex, newPosition);
  const validation = validateBoundary(updated);
  return validation.isValid;
}

/**
 * Calculate the minimum distance between vertices
 */
export function getMinVertexDistance(boundary: Point[]): number {
  if (boundary.length < 2) return Infinity;

  let minDistance = Infinity;

  for (let i = 0; i < boundary.length; i++) {
    for (let j = i + 1; j < boundary.length; j++) {
      const dx = boundary[i].x - boundary[j].x;
      const dy = boundary[i].y - boundary[j].y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < minDistance) {
        minDistance = distance;
      }
    }
  }

  return minDistance;
}

/**
 * Format area and perimeter for display
 */
export function formatMeasurements(area: number, perimeter: number): {
  areaText: string;
  perimeterText: string;
} {
  return {
    areaText: `${area.toFixed(1)} sq ft`,
    perimeterText: `${perimeter.toFixed(1)} ft`,
  };
}
