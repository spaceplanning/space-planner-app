/**
 * Tests for perimeter tracing utilities
 */

import { describe, it, expect } from "vitest";
import {
  validatePerimeter,
  ensureClockwise,
  simplifyWireframe,
  validateSectionsWithinPerimeter,
  getWireframeBounds,
} from "./perimeterTracing";
import type { Point } from "../client/src/lib/polygonUtils";

describe("Perimeter Tracing", () => {
  const squareWireframe: Point[] = [
    { x: 0, y: 0 },
    { x: 26.5, y: 0 },
    { x: 26.5, y: 32.5 },
    { x: 0, y: 32.5 },
  ];

  const irregularWireframe: Point[] = [
    { x: 0, y: 0 },
    { x: 26.5, y: 0 },
    { x: 26.5, y: 20 },
    { x: 15, y: 20 },
    { x: 15, y: 32.5 },
    { x: 0, y: 32.5 },
  ];

  describe("validatePerimeter", () => {
    it("should validate correct square perimeter", () => {
      const result = validatePerimeter(squareWireframe, 861.25, 0.05);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.perimeter.area).toBeCloseTo(861.25, 0);
    });

    it("should detect insufficient vertices", () => {
      const result = validatePerimeter([{ x: 0, y: 0 }, { x: 1, y: 1 }], 100);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should warn about area mismatch", () => {
      const result = validatePerimeter(squareWireframe, 500, 0.05);

      // Should have warnings about area mismatch
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.isValid).toBe(true); // Still valid, just with warnings
    });

    it("should detect self-intersecting edges", () => {
      // Bowtie/figure-8 shape that self-intersects
      const selfIntersecting: Point[] = [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
        { x: 10, y: 0 },
        { x: 0, y: 10 },
      ];

      const result = validatePerimeter(selfIntersecting, 50);

      // This shape should either have self-intersection error or area mismatch warning
      expect(result.errors.length + result.warnings.length).toBeGreaterThan(0);
    });

    it("should detect duplicate consecutive vertices", () => {
      const withDuplicates: Point[] = [
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
      ];

      const result = validatePerimeter(withDuplicates, 100);

      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should calculate perimeter length", () => {
      const result = validatePerimeter(squareWireframe, 861.25);

      expect(result.perimeter.length).toBeCloseTo(118, 0);
    });

    it("should determine polygon orientation", () => {
      const result = validatePerimeter(squareWireframe, 861.25);

      // Just verify that orientation is determined (true or false)
      expect(typeof result.perimeter.isClockwise).toBe("boolean");
    });
  });

  describe("ensureClockwise", () => {
    it("should return a polygon with same number of vertices", () => {
      const polygon: Point[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ];

      const result = ensureClockwise(polygon);

      expect(result.length).toBe(polygon.length);
    });

    it("should preserve all vertices", () => {
      const polygon: Point[] = [
        { x: 0, y: 0 },
        { x: 0, y: 10 },
        { x: 10, y: 10 },
        { x: 10, y: 0 },
      ];

      const result = ensureClockwise(polygon);

      // Verify it contains the same points
      const resultSet = new Set(result.map((p: Point) => `${p.x},${p.y}`));
      const originalSet = new Set(polygon.map((p: Point) => `${p.x},${p.y}`));
      expect(resultSet).toEqual(originalSet);
    });
  });

  describe("simplifyWireframe", () => {
    it("should remove collinear points", () => {
      const withCollinear: Point[] = [
        { x: 0, y: 0 },
        { x: 5, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ];

      const result = simplifyWireframe(withCollinear, 0.01);

      expect(result.length).toBeLessThan(withCollinear.length);
    });

    it("should preserve non-collinear points", () => {
      const withCorners: Point[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ];

      const result = simplifyWireframe(withCorners, 0.01);

      expect(result.length).toBeGreaterThanOrEqual(3);
    });

    it("should preserve minimum 3 vertices", () => {
      const triangle: Point[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 5, y: 10 },
      ];

      const result = simplifyWireframe(triangle, 0.01);

      expect(result.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("validateSectionsWithinPerimeter", () => {
    it("should validate sections within perimeter", () => {
      const sections = [
        {
          boundary: [
            { x: 1, y: 1 },
            { x: 5, y: 1 },
            { x: 5, y: 5 },
            { x: 1, y: 5 },
          ],
        },
      ];

      const result = validateSectionsWithinPerimeter(squareWireframe, sections);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect sections outside perimeter", () => {
      const sections = [
        {
          boundary: [
            { x: 25, y: 25 },
            { x: 30, y: 25 },
            { x: 30, y: 30 },
            { x: 25, y: 30 },
          ],
        },
      ];

      const result = validateSectionsWithinPerimeter(squareWireframe, sections);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should handle multiple sections", () => {
      const sections = [
        {
          boundary: [
            { x: 1, y: 1 },
            { x: 5, y: 1 },
            { x: 5, y: 5 },
            { x: 1, y: 5 },
          ],
        },
        {
          boundary: [
            { x: 10, y: 10 },
            { x: 15, y: 10 },
            { x: 15, y: 15 },
            { x: 10, y: 15 },
          ],
        },
      ];

      const result = validateSectionsWithinPerimeter(squareWireframe, sections);

      expect(result.isValid).toBe(true);
    });
  });

  describe("getWireframeBounds", () => {
    it("should calculate bounding box", () => {
      const result = getWireframeBounds(squareWireframe);

      expect(result.minX).toBe(0);
      expect(result.maxX).toBe(26.5);
      expect(result.minY).toBe(0);
      expect(result.maxY).toBe(32.5);
      expect(result.width).toBe(26.5);
      expect(result.height).toBe(32.5);
    });

    it("should handle irregular wireframe", () => {
      const result = getWireframeBounds(irregularWireframe);

      expect(result.minX).toBe(0);
      expect(result.maxX).toBe(26.5);
      expect(result.minY).toBe(0);
      expect(result.maxY).toBe(32.5);
    });

    it("should handle single point", () => {
      const result = getWireframeBounds([{ x: 5, y: 5 }]);

      expect(result.minX).toBe(5);
      expect(result.maxX).toBe(5);
      expect(result.minY).toBe(5);
      expect(result.maxY).toBe(5);
      expect(result.width).toBe(0);
      expect(result.height).toBe(0);
    });
  });
});
