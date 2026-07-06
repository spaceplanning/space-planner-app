/**
 * Tests for measurement calculation utilities
 */

import { describe, it, expect } from "vitest";
import {
  calculateRoomMeasurements,
  calculateSectionMeasurements,
  generateMeasurementsReport,
  calculateMaterialEstimates,
} from "./measurements";
import type { Room, WireframeSection } from "../client/src/lib/floorPlanTypes";

describe("Measurement Calculations", () => {
  describe("calculateRoomMeasurements", () => {
    it("should calculate area and perimeter for a room", () => {
      const room: Room = {
        id: "room1",
        name: "Bedroom",
        x: 0,
        y: 0,
        width: 12,
        height: 14,
      };

      const measurements = calculateRoomMeasurements(room);

      expect(measurements.id).toBe("room1");
      expect(measurements.name).toBe("Bedroom");
      expect(measurements.width).toBe(12);
      expect(measurements.height).toBe(14);
      expect(measurements.area).toBe(168); // 12 * 14
      expect(measurements.perimeter).toBe(52); // 2 * (12 + 14)
    });

    it("should format dimensions correctly", () => {
      const room: Room = {
        id: "room1",
        name: "Kitchen",
        x: 0,
        y: 0,
        width: 12.5,
        height: 10.75,
      };

      const measurements = calculateRoomMeasurements(room);

      expect(measurements.widthFormatted).toBe("12'6\"");
      expect(measurements.heightFormatted).toBe("10'9\"");
      expect(measurements.areaFormatted).toContain("sq ft");
      expect(measurements.perimeterFormatted).toContain("'");
    });

    it("should handle fractional dimensions", () => {
      const room: Room = {
        id: "room1",
        name: "Bathroom",
        x: 0,
        y: 0,
        width: 5.5,
        height: 8.25,
      };

      const measurements = calculateRoomMeasurements(room);

      expect(measurements.area).toBeCloseTo(45.375, 2);
      expect(measurements.perimeter).toBeCloseTo(27.5, 1);
    });
  });

  describe("calculateSectionMeasurements", () => {
    it("should calculate area and perimeter for a rectangular section", () => {
      const section: WireframeSection = {
        id: "section1",
        name: "Living Room",
        boundary: [
          { x: 0, y: 0 },
          { x: 20, y: 0 },
          { x: 20, y: 15 },
          { x: 0, y: 15 },
        ],
        squareFeet: 300,
      };

      const measurements = calculateSectionMeasurements(section);

      expect(measurements.id).toBe("section1");
      expect(measurements.name).toBe("Living Room");
      expect(measurements.area).toBe(300);
      expect(measurements.boundaryPoints).toBe(4);
      expect(measurements.areaFormatted).toContain("300");
    });

    it("should calculate perimeter for a polygon", () => {
      const section: WireframeSection = {
        id: "section1",
        name: "L-Shaped Room",
        boundary: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 5 },
          { x: 5, y: 5 },
          { x: 5, y: 10 },
          { x: 0, y: 10 },
        ],
      };

      const measurements = calculateSectionMeasurements(section);

      expect(measurements.boundaryPoints).toBe(6);
      expect(measurements.perimeter).toBeGreaterThan(0);
    });

    it("should use provided squareFeet or calculate from boundary", () => {
      const section1: WireframeSection = {
        id: "section1",
        name: "Room 1",
        boundary: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
          { x: 0, y: 10 },
        ],
        squareFeet: 150, // Override calculated value
      };

      const measurements1 = calculateSectionMeasurements(section1);
      expect(measurements1.area).toBe(150);

      const section2: WireframeSection = {
        id: "section2",
        name: "Room 2",
        boundary: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
          { x: 0, y: 10 },
        ],
      };

      const measurements2 = calculateSectionMeasurements(section2);
      expect(measurements2.area).toBe(100); // 10 * 10
    });
  });

  describe("generateMeasurementsReport", () => {
    it("should generate a complete report with rooms and sections", () => {
      const rooms: Room[] = [
        {
          id: "room1",
          name: "Bedroom",
          x: 0,
          y: 0,
          width: 12,
          height: 14,
        },
        {
          id: "room2",
          name: "Kitchen",
          x: 12,
          y: 0,
          width: 12,
          height: 10,
        },
      ];

      const sections: WireframeSection[] = [
        {
          id: "section1",
          name: "Living Room",
          boundary: [
            { x: 0, y: 14 },
            { x: 24, y: 14 },
            { x: 24, y: 24 },
            { x: 0, y: 24 },
          ],
          squareFeet: 240,
        },
      ];

      const report = generateMeasurementsReport("Test Plan", rooms, sections);

      expect(report.planName).toBe("Test Plan");
      expect(report.roomCount).toBe(2);
      expect(report.sectionCount).toBe(1);
      expect(report.rooms.length).toBe(2);
      expect(report.sections.length).toBe(1);
      expect(report.totalArea).toBeGreaterThan(0);
      expect(report.totalPerimeter).toBeGreaterThan(0);
      expect(report.generatedAt).toBeDefined();
    });

    it("should calculate total area correctly", () => {
      const rooms: Room[] = [
        { id: "r1", name: "Room 1", x: 0, y: 0, width: 10, height: 10 },
        { id: "r2", name: "Room 2", x: 10, y: 0, width: 10, height: 10 },
      ];

      const report = generateMeasurementsReport("Test Plan", rooms);

      expect(report.totalArea).toBe(200); // (10*10) + (10*10)
    });

    it("should handle empty rooms and sections", () => {
      const report = generateMeasurementsReport("Empty Plan", [], []);

      expect(report.planName).toBe("Empty Plan");
      expect(report.roomCount).toBe(0);
      expect(report.sectionCount).toBe(0);
      expect(report.rooms.length).toBe(0);
      expect(report.sections.length).toBe(0);
      expect(report.totalArea).toBe(0);
    });
  });

  describe("calculateMaterialEstimates", () => {
    it("should calculate flooring and painting costs", () => {
      const measurements = [
        {
          id: "room1",
          name: "Bedroom",
          width: 12,
          height: 14,
          area: 168,
          perimeter: 52,
          widthFormatted: "12'0\"",
          heightFormatted: "14'0\"",
          areaFormatted: "168 sq ft",
          perimeterFormatted: "52'",
        },
      ];

      const estimates = calculateMaterialEstimates(measurements);

      expect(estimates.length).toBe(1);
      expect(estimates[0].roomName).toBe("Bedroom");
      expect(estimates[0].flooring.area).toBe(168);
      expect(estimates[0].flooring.cost).toBe(840); // 168 * $5
      expect(estimates[0].painting.perimeter).toBe(52);
      expect(estimates[0].painting.cost).toBe(104); // 52 * $2
    });

    it("should calculate estimates for multiple rooms", () => {
      const measurements = [
        {
          id: "r1",
          name: "Room 1",
          width: 10,
          height: 10,
          area: 100,
          perimeter: 40,
          widthFormatted: "10'0\"",
          heightFormatted: "10'0\"",
          areaFormatted: "100 sq ft",
          perimeterFormatted: "40'",
        },
        {
          id: "r2",
          name: "Room 2",
          width: 15,
          height: 12,
          area: 180,
          perimeter: 54,
          widthFormatted: "15'0\"",
          heightFormatted: "12'0\"",
          areaFormatted: "180 sq ft",
          perimeterFormatted: "54'",
        },
      ];

      const estimates = calculateMaterialEstimates(measurements);

      expect(estimates.length).toBe(2);
      expect(estimates[0].flooring.cost).toBe(500); // 100 * $5
      expect(estimates[1].flooring.cost).toBe(900); // 180 * $5
    });
  });

  describe("Formatting functions", () => {
    it("should format feet and inches correctly", () => {
      const room1: Room = {
        id: "r1",
        name: "Test",
        x: 0,
        y: 0,
        width: 12,
        height: 12.5,
      };

      const m1 = calculateRoomMeasurements(room1);
      expect(m1.widthFormatted).toBe("12'0\"");
      expect(m1.heightFormatted).toBe("12'6\"");

      const room2: Room = {
        id: "r2",
        name: "Test",
        x: 0,
        y: 0,
        width: 10.25,
        height: 15.75,
      };

      const m2 = calculateRoomMeasurements(room2);
      expect(m2.widthFormatted).toBe("10'3\"");
      expect(m2.heightFormatted).toBe("15'9\"");
    });

    it("should format area as square feet", () => {
      const room: Room = {
        id: "r1",
        name: "Test",
        x: 0,
        y: 0,
        width: 12.5,
        height: 10.75,
      };

      const measurements = calculateRoomMeasurements(room);
      expect(measurements.areaFormatted).toMatch(/^\d+ sq ft$/);
    });

    it("should format perimeter as linear feet", () => {
      const room: Room = {
        id: "r1",
        name: "Test",
        x: 0,
        y: 0,
        width: 12,
        height: 14,
      };

      const measurements = calculateRoomMeasurements(room);
      expect(measurements.perimeterFormatted).toMatch(/^\d+\.?\d*'$/);
    });
  });
});
