/**
 * Tests for vertex editing utilities
 */

import { describe, it, expect } from "vitest";
import {
  isPointNearVertex,
  findClosestVertex,
  updateVertexInBoundary,
  validateBoundary,
  calculateDragResult,
  snapVertexToGrid,
  isValidVertexEdit,
  formatMeasurements,
  constrainVertexToBounds,
  distancePointToSegment,
  getMinVertexDistance,
} from "./vertexEditingUtils";
import type { Point } from "./polygonUtils";

describe("Vertex Editing Utils", () => {
  const squarePolygon: Point[] = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 0, y: 10 },
  ];

  describe("isPointNearVertex", () => {
    it("should detect point near vertex", () => {
      const vertex = { x: 5, y: 5 };
      const point = { x: 6, y: 6 };

      expect(isPointNearVertex(point, vertex, 2)).toBe(true);
    });

    it("should not detect point far from vertex", () => {
      const vertex = { x: 5, y: 5 };
      const point = { x: 20, y: 20 };

      expect(isPointNearVertex(point, vertex, 2)).toBe(false);
    });

    it("should use default tolerance of 8", () => {
      const vertex = { x: 0, y: 0 };
      const point = { x: 7, y: 0 };

      expect(isPointNearVertex(point, vertex)).toBe(true);
    });
  });

  describe("findClosestVertex", () => {
    it("should find closest vertex in polygon", () => {
      const point = { x: 0.5, y: 0.5 };

      const result = findClosestVertex(point, squarePolygon);

      expect(result).not.toBeNull();
      expect(result?.index).toBe(0);
      expect(result?.distance).toBeLessThan(1);
    });

    it("should return null for empty polygon", () => {
      const point = { x: 5, y: 5 };

      const result = findClosestVertex(point, []);

      expect(result).toBeNull();
    });

    it("should find correct vertex for each corner", () => {
      const corners = [
        { point: { x: 0, y: 0 }, expectedIndex: 0 },
        { point: { x: 10, y: 0 }, expectedIndex: 1 },
        { point: { x: 10, y: 10 }, expectedIndex: 2 },
        { point: { x: 0, y: 10 }, expectedIndex: 3 },
      ];

      for (const { point, expectedIndex } of corners) {
        const result = findClosestVertex(point, squarePolygon);
        expect(result?.index).toBe(expectedIndex);
      }
    });
  });

  describe("updateVertexInBoundary", () => {
    it("should update vertex at index", () => {
      const newPosition = { x: 5, y: 5 };

      const updated = updateVertexInBoundary(squarePolygon, 0, newPosition);

      expect(updated[0]).toEqual(newPosition);
      expect(updated.length).toBe(squarePolygon.length);
    });

    it("should not modify original boundary", () => {
      const newPosition = { x: 5, y: 5 };
      const original = [...squarePolygon];

      updateVertexInBoundary(squarePolygon, 0, newPosition);

      expect(squarePolygon).toEqual(original);
    });

    it("should handle invalid index", () => {
      const newPosition = { x: 5, y: 5 };

      const updated = updateVertexInBoundary(squarePolygon, 10, newPosition);

      expect(updated).toEqual(squarePolygon);
    });
  });

  describe("validateBoundary", () => {
    it("should validate correct polygon", () => {
      const result = validateBoundary(squarePolygon);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject polygon with less than 3 vertices", () => {
      const result = validateBoundary([
        { x: 0, y: 0 },
        { x: 10, y: 0 },
      ]);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should detect duplicate consecutive vertices", () => {
      const invalid: Point[] = [
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        { x: 10, y: 10 },
      ];

      const result = validateBoundary(invalid);

      expect(result.isValid).toBe(false);
    });
  });

  describe("snapVertexToGrid", () => {
    it("should snap vertex to grid", () => {
      const vertex = { x: 5.7, y: 3.2 };

      const snapped = snapVertexToGrid(vertex, 0.5);

      expect(snapped.x).toBe(5.5);
      expect(snapped.y).toBe(3);
    });

    it("should use default grid size of 0.5", () => {
      const vertex = { x: 5.3, y: 3.6 };

      const snapped = snapVertexToGrid(vertex);

      expect(snapped.x).toBe(5.5);
      expect(snapped.y).toBe(3.5);
    });
  });

  describe("calculateDragResult", () => {
    it("should calculate valid drag result", () => {
      const updated: Point[] = [
        { x: 0, y: 0 },
        { x: 12, y: 0 },
        { x: 12, y: 10 },
        { x: 0, y: 10 },
      ];

      const result = calculateDragResult(squarePolygon, updated);

      expect(result.isValid).toBe(true);
      expect(result.area).toBe(120);
      expect(result.perimeter).toBe(44);
    });

    it("should detect invalid drag result", () => {
      const invalid: Point[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
      ];

      const result = calculateDragResult(squarePolygon, invalid);

      expect(result.isValid).toBe(false);
      expect(result.validationErrors.length).toBeGreaterThan(0);
    });
  });

  describe("isValidVertexEdit", () => {
    it("should allow valid vertex edit", () => {
      const newPosition = { x: 5, y: 5 };

      const isValid = isValidVertexEdit(squarePolygon, 0, newPosition);

      expect(isValid).toBe(true);
    });

    it("should reject invalid vertex edit", () => {
      const newPosition = { x: 10, y: 0 };

      const isValid = isValidVertexEdit(squarePolygon, 0, newPosition);

      expect(isValid).toBe(false);
    });
  });

  describe("formatMeasurements", () => {
    it("should format area and perimeter", () => {
      const result = formatMeasurements(100.5, 40.25);

      expect(result.areaText).toBe("100.5 sq ft");
      expect(result.perimeterText).toBe("40.3 ft");
    });

    it("should handle small values", () => {
      const result = formatMeasurements(0.1, 0.5);

      expect(result.areaText).toBe("0.1 sq ft");
      expect(result.perimeterText).toBe("0.5 ft");
    });
  });

  describe("constrainVertexToBounds", () => {
    it("should constrain vertex within bounds", () => {
      const vertex = { x: 15, y: 15 };
      const bounds = { minX: 0, maxX: 10, minY: 0, maxY: 10 };

      const constrained = constrainVertexToBounds(vertex, bounds);

      expect(constrained.x).toBe(10);
      expect(constrained.y).toBe(10);
    });

    it("should apply margin", () => {
      const vertex = { x: 15, y: 15 };
      const bounds = { minX: 0, maxX: 10, minY: 0, maxY: 10 };

      const constrained = constrainVertexToBounds(vertex, bounds, 2);

      expect(constrained.x).toBe(8);
      expect(constrained.y).toBe(8);
    });
  });

  describe("distancePointToSegment", () => {
    it("should calculate distance to segment", () => {
      const point = { x: 5, y: 5 };
      const p1 = { x: 0, y: 0 };
      const p2 = { x: 10, y: 0 };

      const distance = distancePointToSegment(point, p1, p2);

      expect(distance).toBe(5);
    });

    it("should handle point on segment", () => {
      const point = { x: 5, y: 0 };
      const p1 = { x: 0, y: 0 };
      const p2 = { x: 10, y: 0 };

      const distance = distancePointToSegment(point, p1, p2);

      expect(distance).toBe(0);
    });
  });

  describe("getMinVertexDistance", () => {
    it("should find minimum distance between vertices", () => {
      const polygon: Point[] = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 1 },
      ];

      const minDist = getMinVertexDistance(polygon);

      expect(minDist).toBe(1);
    });

    it("should return Infinity for less than 2 vertices", () => {
      const minDist = getMinVertexDistance([{ x: 0, y: 0 }]);

      expect(minDist).toBe(Infinity);
    });
  });
});
