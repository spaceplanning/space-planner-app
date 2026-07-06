/**
 * Measurement calculation utilities for floor plans
 * Calculates areas, perimeters, and generates detailed measurement reports
 */

import type { Room, Point, WireframeSection } from "../client/src/lib/floorPlanTypes";

export interface RoomMeasurements {
  id: string;
  name: string;
  width: number;  // in feet
  height: number; // in feet
  area: number;   // in square feet
  perimeter: number; // in linear feet
  widthFormatted: string;  // e.g., "12'6""
  heightFormatted: string;
  areaFormatted: string;   // e.g., "150 sq ft"
  perimeterFormatted: string;
}

export interface SectionMeasurements {
  id: string;
  name: string;
  area: number;   // in square feet
  perimeter: number; // in linear feet
  areaFormatted: string;
  perimeterFormatted: string;
  boundaryPoints: number; // number of vertices
}

export interface MeasurementsReport {
  planName: string;
  totalArea: number;
  totalPerimeter: number;
  roomCount: number;
  sectionCount: number;
  rooms: RoomMeasurements[];
  sections: SectionMeasurements[];
  generatedAt: string;
}

/**
 * Format feet to feet'inches" string
 */
function formatFeetInches(feet: number): string {
  const wholeFeet = Math.floor(feet);
  const inches = Math.round((feet - wholeFeet) * 12);
  if (inches === 0) return `${wholeFeet}'0"`;
  if (inches === 12) return `${wholeFeet + 1}'0"`;
  return `${wholeFeet}'${inches}"`;
}

/**
 * Format area in square feet
 */
function formatArea(sqFt: number): string {
  return `${Math.round(sqFt)} sq ft`;
}

/**
 * Format perimeter in linear feet
 */
function formatPerimeter(linearFt: number): string {
  return `${Math.round(linearFt * 10) / 10}'`;
}

/**
 * Calculate measurements for a single room
 */
export function calculateRoomMeasurements(room: Room): RoomMeasurements {
  const area = room.width * room.height;
  const perimeter = 2 * (room.width + room.height);

  return {
    id: room.id,
    name: room.name,
    width: room.width,
    height: room.height,
    area,
    perimeter,
    widthFormatted: formatFeetInches(room.width),
    heightFormatted: formatFeetInches(room.height),
    areaFormatted: formatArea(area),
    perimeterFormatted: formatPerimeter(perimeter),
  };
}

/**
 * Calculate the perimeter of a polygon defined by points
 */
function calculatePolygonPerimeter(points: Point[]): number {
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
 * Calculate the area of a polygon using the Shoelace formula
 */
function calculatePolygonArea(points: Point[]): number {
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
 * Calculate measurements for a wireframe section
 */
export function calculateSectionMeasurements(section: WireframeSection): SectionMeasurements {
  const area = section.squareFeet ?? calculatePolygonArea(section.boundary);
  const perimeter = calculatePolygonPerimeter(section.boundary);

  return {
    id: section.id,
    name: section.name,
    area,
    perimeter,
    areaFormatted: formatArea(area),
    perimeterFormatted: formatPerimeter(perimeter),
    boundaryPoints: section.boundary.length,
  };
}

/**
 * Generate a complete measurements report for a floor plan
 */
export function generateMeasurementsReport(
  planName: string,
  rooms: Room[],
  sections?: WireframeSection[]
): MeasurementsReport {
  const roomMeasurements = rooms.map(calculateRoomMeasurements);
  const sectionMeasurements = (sections ?? []).map(calculateSectionMeasurements);

  const totalArea = roomMeasurements.reduce((sum, r) => sum + r.area, 0);
  const totalPerimeter = roomMeasurements.reduce((sum, r) => sum + r.perimeter, 0);

  return {
    planName,
    totalArea,
    totalPerimeter,
    roomCount: rooms.length,
    sectionCount: sections?.length ?? 0,
    rooms: roomMeasurements,
    sections: sectionMeasurements,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Calculate material estimates based on room measurements
 * Useful for flooring, painting, etc.
 */
export interface MaterialEstimate {
  roomName: string;
  flooring: {
    area: number;
    cost: number; // estimated cost at $5/sq ft
  };
  painting: {
    perimeter: number;
    cost: number; // estimated cost at $2/linear ft
  };
}

export function calculateMaterialEstimates(measurements: RoomMeasurements[]): MaterialEstimate[] {
  return measurements.map((room) => ({
    roomName: room.name,
    flooring: {
      area: room.area,
      cost: room.area * 5, // $5 per sq ft
    },
    painting: {
      perimeter: room.perimeter,
      cost: room.perimeter * 2, // $2 per linear ft
    },
  }));
}
