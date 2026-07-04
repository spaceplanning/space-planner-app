import { describe, it, expect } from "vitest";

// Test wireframe validation logic
describe("Wireframe Validation", () => {
  // Helper to validate wireframe format
  const validateWireframe = (wireframe: unknown): boolean => {
    if (!Array.isArray(wireframe)) return false;
    if (wireframe.length < 3) return false; // At least 3 points for a polygon
    return wireframe.every(
      (point) =>
        typeof point === "object" &&
        point !== null &&
        typeof (point as any).x === "number" &&
        typeof (point as any).y === "number" &&
        (point as any).x >= 0 &&
        (point as any).y >= 0
    );
  };

  // Helper to validate sections format
  const validateSections = (sections: unknown): boolean => {
    if (!Array.isArray(sections)) return false;
    return sections.every((section) => {
      if (typeof section !== "object" || section === null) return false;
      const s = section as any;
      if (typeof s.id !== "string" || !s.id) return false;
      if (typeof s.name !== "string" || !s.name) return false;
      if (!Array.isArray(s.boundary) || s.boundary.length < 3) return false;
      if (
        !s.boundary.every(
          (p: any) =>
            typeof p === "object" &&
            p !== null &&
            typeof p.x === "number" &&
            typeof p.y === "number" &&
            p.x >= 0 &&
            p.y >= 0
        )
      )
        return false;
      if (s.squareFeet !== undefined && typeof s.squareFeet !== "number")
        return false;
      return true;
    });
  };

  it("should validate correct wireframe format", () => {
    const validWireframe = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ];
    expect(validateWireframe(validWireframe)).toBe(true);
  });

  it("should reject wireframe with less than 3 points", () => {
    const invalidWireframe = [{ x: 0, y: 0 }, { x: 10, y: 0 }];
    expect(validateWireframe(invalidWireframe)).toBe(false);
  });

  it("should reject wireframe with negative coordinates", () => {
    const invalidWireframe = [
      { x: -1, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    ];
    expect(validateWireframe(invalidWireframe)).toBe(false);
  });

  it("should reject wireframe with non-numeric coordinates", () => {
    const invalidWireframe = [
      { x: "0", y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    ];
    expect(validateWireframe(invalidWireframe)).toBe(false);
  });

  it("should validate correct sections format", () => {
    const validSections = [
      {
        id: "section_1",
        name: "BEDROOM",
        boundary: [
          { x: 0, y: 0 },
          { x: 12, y: 0 },
          { x: 12, y: 12 },
          { x: 0, y: 12 },
        ],
        squareFeet: 144,
      },
      {
        id: "section_2",
        name: "KITCHEN",
        boundary: [
          { x: 12, y: 0 },
          { x: 20, y: 0 },
          { x: 20, y: 12 },
          { x: 12, y: 12 },
        ],
        squareFeet: 96,
      },
    ];
    expect(validateSections(validSections)).toBe(true);
  });

  it("should reject sections with missing id", () => {
    const invalidSections = [
      {
        name: "BEDROOM",
        boundary: [
          { x: 0, y: 0 },
          { x: 12, y: 0 },
          { x: 12, y: 12 },
        ],
      },
    ];
    expect(validateSections(invalidSections)).toBe(false);
  });

  it("should reject sections with missing name", () => {
    const invalidSections = [
      {
        id: "section_1",
        boundary: [
          { x: 0, y: 0 },
          { x: 12, y: 0 },
          { x: 12, y: 12 },
        ],
      },
    ];
    expect(validateSections(invalidSections)).toBe(false);
  });

  it("should reject sections with boundary < 3 points", () => {
    const invalidSections = [
      {
        id: "section_1",
        name: "BEDROOM",
        boundary: [{ x: 0, y: 0 }, { x: 12, y: 0 }],
      },
    ];
    expect(validateSections(invalidSections)).toBe(false);
  });

  it("should reject sections with invalid boundary coordinates", () => {
    const invalidSections = [
      {
        id: "section_1",
        name: "BEDROOM",
        boundary: [
          { x: -1, y: 0 },
          { x: 12, y: 0 },
          { x: 12, y: 12 },
        ],
      },
    ];
    expect(validateSections(invalidSections)).toBe(false);
  });

  it("should accept sections without squareFeet", () => {
    const validSections = [
      {
        id: "section_1",
        name: "BEDROOM",
        boundary: [
          { x: 0, y: 0 },
          { x: 12, y: 0 },
          { x: 12, y: 12 },
        ],
      },
    ];
    expect(validateSections(validSections)).toBe(true);
  });

  it("should reject sections with non-numeric squareFeet", () => {
    const invalidSections = [
      {
        id: "section_1",
        name: "BEDROOM",
        boundary: [
          { x: 0, y: 0 },
          { x: 12, y: 0 },
          { x: 12, y: 12 },
        ],
        squareFeet: "144",
      },
    ];
    expect(validateSections(invalidSections)).toBe(false);
  });
});
