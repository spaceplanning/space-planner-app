/**
 * Dimension validation and correction for exact replica floor plans
 * Ensures dimensions match square footage and validates wireframe geometry
 */

export interface ParsedFloorPlanData {
  totalWidth: number;
  totalHeight: number;
  totalSquareFeet: number;
  dimensionNotes?: string;
  wireframe: Array<{ x: number; y: number }>;
  sections: Array<{
    id: string;
    name: string;
    boundary: Array<{ x: number; y: number }>;
    squareFeet?: number;
    dimensions?: string;
  }>;
}

/**
 * Calculate polygon area using Shoelace formula
 */
function calculatePolygonArea(points: Array<{ x: number; y: number }>): number {
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
 * Validate that dimensions match square footage
 * Returns corrected dimensions if needed
 */
export function validateAndCorrectDimensions(
  data: ParsedFloorPlanData
): {
  isValid: boolean;
  correctedData: ParsedFloorPlanData;
  issues: string[];
  corrections: string[];
} {
  const issues: string[] = [];
  const corrections: string[] = [];
  const correctedData = JSON.parse(JSON.stringify(data)) as ParsedFloorPlanData;

  // Check 1: Validate totalSquareFeet exists
  if (!correctedData.totalSquareFeet || correctedData.totalSquareFeet <= 0) {
    issues.push("Total square footage not found or invalid");
  }

  // Check 2: Validate totalWidth and totalHeight
  if (correctedData.totalWidth <= 0 || correctedData.totalHeight <= 0) {
    issues.push("Total width or height is invalid");
  }

  // Check 3: Compare calculated area vs. stated square footage
  const calculatedArea = correctedData.totalWidth * correctedData.totalHeight;
  const sqftDifference = Math.abs(calculatedArea - correctedData.totalSquareFeet);
  const percentDifference = (sqftDifference / correctedData.totalSquareFeet) * 100;

  if (percentDifference > 2) {
    issues.push(
      `Dimension mismatch: calculated ${calculatedArea.toFixed(0)} sqft vs. stated ${correctedData.totalSquareFeet} sqft (${percentDifference.toFixed(1)}% difference)`
    );

    // Correct dimensions to match square footage
    // Preserve aspect ratio
    const aspectRatio = correctedData.totalWidth / correctedData.totalHeight;
    const newHeight = Math.sqrt(correctedData.totalSquareFeet / aspectRatio);
    const newWidth = newHeight * aspectRatio;

    correctedData.totalWidth = Math.round(newWidth * 10) / 10;
    correctedData.totalHeight = Math.round(newHeight * 10) / 10;

    corrections.push(
      `Adjusted dimensions from ${calculatedArea.toFixed(0)} sqft to ${correctedData.totalSquareFeet} sqft: ${correctedData.totalWidth}' × ${correctedData.totalHeight}'`
    );
  }

  // Check 4: Validate wireframe points are within bounds
  if (correctedData.wireframe && correctedData.wireframe.length > 0) {
    for (const point of correctedData.wireframe) {
      if (
        point.x < 0 ||
        point.y < 0 ||
        point.x > correctedData.totalWidth ||
        point.y > correctedData.totalHeight
      ) {
        issues.push(
          `Wireframe point (${point.x}, ${point.y}) outside bounds (0,0) to (${correctedData.totalWidth}, ${correctedData.totalHeight})`
        );
      }
    }
  }

  // Check 5: Validate sections and calculate their total area
  if (correctedData.sections && correctedData.sections.length > 0) {
    let totalSectionArea = 0;

    for (const section of correctedData.sections) {
      // Validate section boundary points are within bounds
      if (section.boundary && section.boundary.length >= 3) {
        for (const point of section.boundary) {
          if (
            point.x < 0 ||
            point.y < 0 ||
            point.x > correctedData.totalWidth ||
            point.y > correctedData.totalHeight
          ) {
            issues.push(
              `Section "${section.name}" point (${point.x}, ${point.y}) outside bounds`
            );
          }
        }

        // Calculate section area if not provided
        if (!section.squareFeet || section.squareFeet <= 0) {
          const calculatedSectionArea = calculatePolygonArea(section.boundary);
          section.squareFeet = Math.round(calculatedSectionArea * 10) / 10;
          corrections.push(
            `Calculated area for "${section.name}": ${section.squareFeet} sqft`
          );
        }

        totalSectionArea += section.squareFeet || 0;
      } else {
        issues.push(`Section "${section.name}" has invalid boundary (< 3 points)`);
      }
    }

    // Check if section areas sum to total
    const sectionAreaDifference = Math.abs(totalSectionArea - correctedData.totalSquareFeet);
    const sectionPercentDifference = (sectionAreaDifference / correctedData.totalSquareFeet) * 100;

    if (sectionPercentDifference > 5) {
      issues.push(
        `Section areas (${totalSectionArea.toFixed(0)} sqft) don't match total (${correctedData.totalSquareFeet} sqft) - ${sectionPercentDifference.toFixed(1)}% difference`
      );
    }
  }

  const isValid = issues.length === 0;

  return {
    isValid,
    correctedData,
    issues,
    corrections,
  };
}

/**
 * Validate wireframe geometry for exact replica
 */
export function validateWireframeGeometry(
  wireframe: Array<{ x: number; y: number }>,
  totalWidth: number,
  totalHeight: number
): {
  isValid: boolean;
  issues: string[];
  stats: {
    pointCount: number;
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    coverage: number;
  };
} {
  const issues: string[] = [];

  if (!wireframe || wireframe.length < 3) {
    issues.push("Wireframe must have at least 3 points");
    return {
      isValid: false,
      issues,
      stats: { pointCount: 0, minX: 0, maxX: 0, minY: 0, maxY: 0, coverage: 0 },
    };
  }

  // Find bounds
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;

  for (const point of wireframe) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }

  // Check if wireframe covers the expected area
  const wireframeWidth = maxX - minX;
  const wireframeHeight = maxY - minY;
  const expectedArea = totalWidth * totalHeight;
  const wireframeArea = wireframeWidth * wireframeHeight;
  const coverage = (wireframeArea / expectedArea) * 100;

  if (coverage < 80) {
    issues.push(
      `Wireframe only covers ${coverage.toFixed(1)}% of expected area (${wireframeArea.toFixed(0)} vs ${expectedArea.toFixed(0)} sqft)`
    );
  }

  // Check for duplicate consecutive points
  for (let i = 0; i < wireframe.length; i++) {
    const current = wireframe[i];
    const next = wireframe[(i + 1) % wireframe.length];
    if (current.x === next.x && current.y === next.y) {
      issues.push(`Wireframe has duplicate consecutive points at index ${i}`);
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
    stats: {
      pointCount: wireframe.length,
      minX,
      maxX,
      minY,
      maxY,
      coverage,
    },
  };
}

/**
 * Validate section boundaries for exact replica
 */
export function validateSectionBoundaries(
  sections: Array<{
    id: string;
    name: string;
    boundary: Array<{ x: number; y: number }>;
    squareFeet?: number;
  }>
): {
  isValid: boolean;
  issues: string[];
  sectionStats: Array<{
    id: string;
    name: string;
    pointCount: number;
    calculatedArea: number;
    statedArea: number;
    areaMatch: boolean;
  }>;
} {
  const issues: string[] = [];
  const sectionStats: Array<{
    id: string;
    name: string;
    pointCount: number;
    calculatedArea: number;
    statedArea: number;
    areaMatch: boolean;
  }> = [];

  for (const section of sections) {
    if (!section.boundary || section.boundary.length < 3) {
      issues.push(`Section "${section.name}" has invalid boundary (< 3 points)`);
      continue;
    }

    const calculatedArea = calculatePolygonArea(section.boundary);
    const statedArea = section.squareFeet || 0;
    const areaDifference = Math.abs(calculatedArea - statedArea);
    const areaMatch = areaDifference < 1; // Allow 1 sqft tolerance

    if (!areaMatch && statedArea > 0) {
      issues.push(
        `Section "${section.name}" area mismatch: calculated ${calculatedArea.toFixed(1)} vs stated ${statedArea} sqft`
      );
    }

    sectionStats.push({
      id: section.id,
      name: section.name,
      pointCount: section.boundary.length,
      calculatedArea: Math.round(calculatedArea * 10) / 10,
      statedArea,
      areaMatch,
    });
  }

  return {
    isValid: issues.length === 0,
    issues,
    sectionStats,
  };
}
