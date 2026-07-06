/**
 * Tests for dimension validation and correction
 */

import { describe, it, expect } from "vitest";
import {
  validateAndCorrectDimensions,
  validateWireframeGeometry,
  validateSectionBoundaries,
} from "./dimensionValidator";
import type { ParsedFloorPlanData } from "./dimensionValidator";

describe("Dimension Validator", () => {
  describe("validateAndCorrectDimensions", () => {
    it("should accept valid dimensions that match square footage", () => {
      const data: ParsedFloorPlanData = {
        totalWidth: 30,
        totalHeight: 20,
        totalSquareFeet: 600,
        wireframe: [
          { x: 0, y: 0 },
          { x: 30, y: 0 },
          { x: 30, y: 20 },
          { x: 0, y: 20 },
        ],
        sections: [],
      };

      const result = validateAndCorrectDimensions(data);

      expect(result.isValid).toBe(true);
      expect(result.issues.length).toBe(0);
      expect(result.corrections.length).toBe(0);
    });

    it("should correct dimensions that don't match square footage", () => {
      const data: ParsedFloorPlanData = {
        totalWidth: 25,
        totalHeight: 20,
        totalSquareFeet: 600, // 25 * 20 = 500, not 600
        wireframe: [],
        sections: [],
      };

      const result = validateAndCorrectDimensions(data);

      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.corrections.length).toBeGreaterThan(0);
      
      // Corrected dimensions should multiply to approximately 600
      const correctedArea = result.correctedData.totalWidth * result.correctedData.totalHeight;
      expect(Math.abs(correctedArea - 600) / 600).toBeLessThan(0.02); // Within 2%
    });

    it("should validate wireframe points are within bounds", () => {
      const data: ParsedFloorPlanData = {
        totalWidth: 30,
        totalHeight: 20,
        totalSquareFeet: 600,
        wireframe: [
          { x: 0, y: 0 },
          { x: 30, y: 0 },
          { x: 35, y: 20 }, // Point outside bounds
          { x: 0, y: 20 },
        ],
        sections: [],
      };

      const result = validateAndCorrectDimensions(data);

      expect(result.isValid).toBe(false);
      expect(result.issues.some((i) => i.includes("outside bounds"))).toBe(true);
    });

    it("should validate section areas sum to total", () => {
      const data: ParsedFloorPlanData = {
        totalWidth: 30,
        totalHeight: 20,
        totalSquareFeet: 600,
        wireframe: [],
        sections: [
          {
            id: "s1",
            name: "Room 1",
            boundary: [
              { x: 0, y: 0 },
              { x: 15, y: 0 },
              { x: 15, y: 20 },
              { x: 0, y: 20 },
            ],
            squareFeet: 200, // Should be 300
          },
          {
            id: "s2",
            name: "Room 2",
            boundary: [
              { x: 15, y: 0 },
              { x: 30, y: 0 },
              { x: 30, y: 20 },
              { x: 15, y: 20 },
            ],
            squareFeet: 200, // Should be 300
          },
        ],
      };

      const result = validateAndCorrectDimensions(data);

      expect(result.isValid).toBe(false);
      expect(result.issues.some((i) => i.includes("don't match total"))).toBe(true);
    });

    it("should calculate missing section areas", () => {
      const data: ParsedFloorPlanData = {
        totalWidth: 30,
        totalHeight: 20,
        totalSquareFeet: 600,
        wireframe: [],
        sections: [
          {
            id: "s1",
            name: "Room 1",
            boundary: [
              { x: 0, y: 0 },
              { x: 15, y: 0 },
              { x: 15, y: 20 },
              { x: 0, y: 20 },
            ],
            // No squareFeet provided
          },
        ],
      };

      const result = validateAndCorrectDimensions(data);

      expect(result.correctedData.sections[0].squareFeet).toBe(300);
      expect(result.corrections.some((c) => c.includes("Calculated area"))).toBe(true);
    });
  });

  describe("validateWireframeGeometry", () => {
    it("should validate a valid wireframe", () => {
      const wireframe = [
        { x: 0, y: 0 },
        { x: 30, y: 0 },
        { x: 30, y: 20 },
        { x: 0, y: 20 },
      ];

      const result = validateWireframeGeometry(wireframe, 30, 20);

      expect(result.isValid).toBe(true);
      expect(result.issues.length).toBe(0);
      expect(result.stats.pointCount).toBe(4);
      expect(result.stats.coverage).toBeGreaterThan(95);
    });

    it("should reject wireframe with less than 3 points", () => {
      const wireframe = [
        { x: 0, y: 0 },
        { x: 30, y: 0 },
      ];

      const result = validateWireframeGeometry(wireframe, 30, 20);

      expect(result.isValid).toBe(false);
      expect(result.issues.some((i) => i.includes("at least 3 points"))).toBe(true);
    });

    it("should detect duplicate consecutive points", () => {
      const wireframe = [
        { x: 0, y: 0 },
        { x: 0, y: 0 }, // Duplicate
        { x: 30, y: 0 },
        { x: 30, y: 20 },
        { x: 0, y: 20 },
      ];

      const result = validateWireframeGeometry(wireframe, 30, 20);

      expect(result.isValid).toBe(false);
      expect(result.issues.some((i) => i.includes("duplicate"))).toBe(true);
    });

    it("should calculate coverage percentage", () => {
      const wireframe = [
        { x: 5, y: 5 },
        { x: 25, y: 5 },
        { x: 25, y: 15 },
        { x: 5, y: 15 },
      ];

      const result = validateWireframeGeometry(wireframe, 30, 20);

      // Wireframe covers (25-5) * (15-5) = 200 sqft
      // Total area is 30 * 20 = 600 sqft
      // Coverage = 200/600 = 33%
      expect(result.stats.coverage).toBeCloseTo(33.3, 1);
    });
  });

  describe("validateSectionBoundaries", () => {
    it("should validate section boundaries", () => {
      const sections = [
        {
          id: "s1",
          name: "Room 1",
          boundary: [
            { x: 0, y: 0 },
            { x: 15, y: 0 },
            { x: 15, y: 20 },
            { x: 0, y: 20 },
          ],
          squareFeet: 300,
        },
      ];

      const result = validateSectionBoundaries(sections);

      expect(result.isValid).toBe(true);
      expect(result.sectionStats.length).toBe(1);
      expect(result.sectionStats[0].areaMatch).toBe(true);
    });

    it("should detect area mismatches", () => {
      const sections = [
        {
          id: "s1",
          name: "Room 1",
          boundary: [
            { x: 0, y: 0 },
            { x: 15, y: 0 },
            { x: 15, y: 20 },
            { x: 0, y: 20 },
          ],
          squareFeet: 250, // Should be 300
        },
      ];

      const result = validateSectionBoundaries(sections);

      expect(result.isValid).toBe(false);
      expect(result.issues.some((i) => i.includes("area mismatch"))).toBe(true);
    });

    it("should reject sections with less than 3 boundary points", () => {
      const sections = [
        {
          id: "s1",
          name: "Room 1",
          boundary: [
            { x: 0, y: 0 },
            { x: 15, y: 0 },
          ],
          squareFeet: 300,
        },
      ];

      const result = validateSectionBoundaries(sections);

      expect(result.isValid).toBe(false);
      expect(result.issues.some((i) => i.includes("invalid boundary"))).toBe(true);
    });

    it("should calculate areas for multiple sections", () => {
      const sections = [
        {
          id: "s1",
          name: "Room 1",
          boundary: [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 },
            { x: 0, y: 10 },
          ],
          squareFeet: 100,
        },
        {
          id: "s2",
          name: "Room 2",
          boundary: [
            { x: 10, y: 0 },
            { x: 20, y: 0 },
            { x: 20, y: 10 },
            { x: 10, y: 10 },
          ],
          squareFeet: 100,
        },
      ];

      const result = validateSectionBoundaries(sections);

      expect(result.sectionStats.length).toBe(2);
      expect(result.sectionStats[0].calculatedArea).toBe(100);
      expect(result.sectionStats[1].calculatedArea).toBe(100);
    });
  });
});
