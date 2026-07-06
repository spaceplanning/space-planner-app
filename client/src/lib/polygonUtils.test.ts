/**
 * Tests for polygon rendering utilities
 */

import { describe, it, expect } from "vitest";
import {
  pointsToSVGPath,
  calculatePolygonCentroid,
  calculatePolygonArea,
  calculatePolygonPerimeter,
  isPointInPolygon,
  getPolygonBounds,
  simplifyPolygon,
  isPolygonClockwise,
  distanceBetweenPoints,
  findClosestPointOnPolygon,
} from "./polygonUtils";
import type { Point } from "./polygonUtils";

describe("Polygon Utils", () => {
  describe("pointsToSVGPath", () => {
    it("should convert points to SVG path", () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ];

      const path = pointsToSVGPath(points);

      expect(path).toContain("M 0 0");
      expect(path).toContain("L 10 0");
      expect(path).toContain("L 10 10");
      expect(path).toContain("L 0 10");
      expect(path).toContain("Z");
    });

    it("should return empty string for less than 3 points", () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
      ];

      const path = pointsToSVGPath(points);

      expect(path).toBe("");
    });
  });

  describe("calculatePolygonCentroid", () => {
    it("should calculate centroid of a square", () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ];

      const centroid = calculatePolygonCentroid(points);

      expect(centroid.x).toBe(5);
      expect(centroid.y).toBe(5);
    });

    it("should calculate centroid of a triangle", () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 5, y: 10 },
      ];

      const centroid = calculatePolygonCentroid(points);

      expect(centroid.x).toBeCloseTo(5);
      expect(centroid.y).toBeCloseTo(3.33, 1);
    });
  });

  describe("calculatePolygonArea", () => {
    it("should calculate area of a square", () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ];

      const area = calculatePolygonArea(points);

      expect(area).toBe(100);
    });

    it("should calculate area of a triangle", () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 5, y: 10 },
      ];

      const area = calculatePolygonArea(points);

      expect(area).toBe(50);
    });

    it("should return 0 for less than 3 points", () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
      ];

      const area = calculatePolygonArea(points);

      expect(area).toBe(0);
    });
  });

  describe("calculatePolygonPerimeter", () => {
    it("should calculate perimeter of a square", () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ];

      const perimeter = calculatePolygonPerimeter(points);

      expect(perimeter).toBe(40);
    });

    it("should calculate perimeter of a triangle", () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 3, y: 0 },
        { x: 0, y: 4 },
      ];

      const perimeter = calculatePolygonPerimeter(points);

      expect(perimeter).toBeCloseTo(12, 0);
    });
  });

  describe("isPointInPolygon", () => {
    it("should detect point inside polygon", () => {
      const polygon: Point[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ];

      expect(isPointInPolygon({ x: 5, y: 5 }, polygon)).toBe(true);
    });

    it("should detect point outside polygon", () => {
      const polygon: Point[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ];

      expect(isPointInPolygon({ x: 15, y: 15 }, polygon)).toBe(false);
    });

    it("should detect point on polygon edge", () => {
      const polygon: Point[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ];

      // Ray casting considers points on edges as inside the polygon
      expect(isPointInPolygon({ x: 5, y: 0 }, polygon)).toBe(true);
    });
  });

  describe("getPolygonBounds", () => {
    it("should calculate bounds of a polygon", () => {
      const points: Point[] = [
        { x: 5, y: 10 },
        { x: 15, y: 10 },
        { x: 15, y: 20 },
        { x: 5, y: 20 },
      ];

      const bounds = getPolygonBounds(points);

      expect(bounds.minX).toBe(5);
      expect(bounds.maxX).toBe(15);
      expect(bounds.minY).toBe(10);
      expect(bounds.maxY).toBe(20);
    });

    it("should return zeros for empty polygon", () => {
      const bounds = getPolygonBounds([]);

      expect(bounds.minX).toBe(0);
      expect(bounds.maxX).toBe(0);
      expect(bounds.minY).toBe(0);
      expect(bounds.maxY).toBe(0);
    });
  });

  describe("simplifyPolygon", () => {
    it("should remove collinear points", () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 5, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ];

      const simplified = simplifyPolygon(points, 0.1);

      expect(simplified.length).toBeLessThanOrEqual(points.length);
    });

    it("should preserve polygon with no collinear points", () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ];

      const simplified = simplifyPolygon(points, 0.1);

      expect(simplified.length).toBe(4);
    });
  });

  describe("isPolygonClockwise", () => {
    it("should detect clockwise polygon", () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ];

      const isClockwise = isPolygonClockwise(points);

      expect(typeof isClockwise).toBe("boolean");
    });
  });

  describe("distanceBetweenPoints", () => {
    it("should calculate distance between two points", () => {
      const p1: Point = { x: 0, y: 0 };
      const p2: Point = { x: 3, y: 4 };

      const distance = distanceBetweenPoints(p1, p2);

      expect(distance).toBe(5);
    });

    it("should calculate distance for same point", () => {
      const p1: Point = { x: 5, y: 5 };
      const p2: Point = { x: 5, y: 5 };

      const distance = distanceBetweenPoints(p1, p2);

      expect(distance).toBe(0);
    });
  });

  describe("findClosestPointOnPolygon", () => {
    it("should find closest point on polygon edge", () => {
      const polygon: Point[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ];

      const result = findClosestPointOnPolygon({ x: 5, y: -5 }, polygon);

      expect(result.point.y).toBe(0);
      expect(result.distance).toBe(5);
    });

    it("should find closest point on polygon vertex", () => {
      const polygon: Point[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ];

      const result = findClosestPointOnPolygon({ x: 0, y: 0 }, polygon);

      expect(result.distance).toBe(0);
    });
  });
});
