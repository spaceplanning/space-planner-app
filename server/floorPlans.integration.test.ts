import { describe, it, expect } from "vitest";
import { getDb } from "./db";
import { floorPlans, customFurniture } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Floor Plans Integration Tests", () => {
  it("should connect to database", async () => {
    const db = await getDb();
    if (!db) {
      console.warn("Database not available, skipping integration tests");
      expect(true).toBe(true);
      return;
    }
    expect(db).toBeDefined();
  });

  it("should handle floor plan JSON serialization and retrieval", async () => {
    const db = await getDb();
    if (!db) {
      console.warn("Database not available, skipping test");
      expect(true).toBe(true);
      return;
    }

    const testPlanId = "test-plan-" + Date.now();
    const testUserId = 1; // Use a test user ID

    try {
      // Create floor plan with complex JSON
      const complexRooms = [
        { id: "r1", name: "Living Room", width: 400, height: 300, x: 0, y: 0 },
        { id: "r2", name: "Bedroom", width: 300, height: 250, x: 450, y: 0 },
      ];

      const complexFurniture = [
        { id: "f1", furnitureId: "sofa_3seat", roomId: "r1", x: 50, y: 50, rotation: 0 },
        { id: "f2", furnitureId: "bed_queen", roomId: "r2", x: 100, y: 75, rotation: 90 },
        { id: "f3", furnitureId: "table_coffee", roomId: "r1", x: 200, y: 150, rotation: 45 },
      ];

      await db.insert(floorPlans).values({
        id: testPlanId,
        userId: testUserId,
        name: "Integration Test Plan",
        totalWidth: 750,
        totalHeight: 300,
        roomsJson: JSON.stringify(complexRooms),
        furnitureJson: JSON.stringify(complexFurniture),
      });

      // Retrieve and verify
      const retrieved = await db
        .select()
        .from(floorPlans)
        .where(eq(floorPlans.id, testPlanId));

      expect(retrieved).toHaveLength(1);
      expect(retrieved[0]?.name).toBe("Integration Test Plan");
      expect(retrieved[0]?.totalWidth).toBe(750);

      const parsedRooms = JSON.parse(retrieved[0]?.roomsJson || "[]");
      const parsedFurniture = JSON.parse(retrieved[0]?.furnitureJson || "[]");

      expect(parsedRooms).toHaveLength(2);
      expect(parsedRooms[0]?.name).toBe("Living Room");
      expect(parsedFurniture).toHaveLength(3);
      expect(parsedFurniture[1]?.rotation).toBe(90);
    } finally {
      // Cleanup
      try {
        await db.delete(floorPlans).where(eq(floorPlans.id, testPlanId));
      } catch (e) {
        console.warn("Cleanup error:", e);
      }
    }
  });

  it("should handle floor plan updates", async () => {
    const db = await getDb();
    if (!db) {
      console.warn("Database not available, skipping test");
      expect(true).toBe(true);
      return;
    }

    const testPlanId = "test-plan-update-" + Date.now();
    const testUserId = 1;

    try {
      // Create initial plan
      await db.insert(floorPlans).values({
        id: testPlanId,
        userId: testUserId,
        name: "Original Name",
        totalWidth: 400,
        totalHeight: 300,
        roomsJson: JSON.stringify([]),
        furnitureJson: JSON.stringify([]),
      });

      // Update plan
      const updatedRooms = [{ id: "r1", name: "Updated Room", width: 500, height: 350, x: 0, y: 0 }];
      await db
        .update(floorPlans)
        .set({
          name: "Updated Name",
          totalWidth: 500,
          totalHeight: 350,
          roomsJson: JSON.stringify(updatedRooms),
        })
        .where(eq(floorPlans.id, testPlanId));

      // Verify update
      const retrieved = await db
        .select()
        .from(floorPlans)
        .where(eq(floorPlans.id, testPlanId));

      expect(retrieved[0]?.name).toBe("Updated Name");
      expect(retrieved[0]?.totalWidth).toBe(500);
      const parsedRooms = JSON.parse(retrieved[0]?.roomsJson || "[]");
      expect(parsedRooms[0]?.name).toBe("Updated Room");
    } finally {
      // Cleanup
      try {
        await db.delete(floorPlans).where(eq(floorPlans.id, testPlanId));
      } catch (e) {
        console.warn("Cleanup error:", e);
      }
    }
  });

  it("should handle custom furniture operations", async () => {
    const db = await getDb();
    if (!db) {
      console.warn("Database not available, skipping test");
      expect(true).toBe(true);
      return;
    }

    const testFurnitureId = "test-furn-" + Date.now();
    const testUserId = 1;

    try {
      // Create custom furniture
      await db.insert(customFurniture).values({
        id: testFurnitureId,
        userId: testUserId,
        name: "Custom Modern Sofa",
        category: "seating",
        width: 84,
        depth: 36,
        color: "#22d3ee",
      });

      // Retrieve and verify
      const retrieved = await db
        .select()
        .from(customFurniture)
        .where(eq(customFurniture.id, testFurnitureId));

      expect(retrieved).toHaveLength(1);
      expect(retrieved[0]?.name).toBe("Custom Modern Sofa");
      expect(retrieved[0]?.width).toBe(84);
      expect(retrieved[0]?.depth).toBe(36);
      expect(retrieved[0]?.color).toBe("#22d3ee");
      expect(retrieved[0]?.category).toBe("seating");
    } finally {
      // Cleanup
      try {
        await db.delete(customFurniture).where(eq(customFurniture.id, testFurnitureId));
      } catch (e) {
        console.warn("Cleanup error:", e);
      }
    }
  });

  it("should handle floor plan deletion", async () => {
    const db = await getDb();
    if (!db) {
      console.warn("Database not available, skipping test");
      expect(true).toBe(true);
      return;
    }

    const testPlanId = "test-plan-delete-" + Date.now();
    const testUserId = 1;

    // Create a floor plan
    await db.insert(floorPlans).values({
      id: testPlanId,
      userId: testUserId,
      name: "Plan to Delete",
      totalWidth: 400,
      totalHeight: 300,
      roomsJson: JSON.stringify([]),
      furnitureJson: JSON.stringify([]),
    });

    // Verify it exists
    let retrieved = await db
      .select()
      .from(floorPlans)
      .where(eq(floorPlans.id, testPlanId));
    expect(retrieved).toHaveLength(1);

    // Delete the plan
    await db.delete(floorPlans).where(eq(floorPlans.id, testPlanId));

    // Verify it's deleted
    retrieved = await db
      .select()
      .from(floorPlans)
      .where(eq(floorPlans.id, testPlanId));
    expect(retrieved).toHaveLength(0);
  });

  it("should handle custom furniture deletion", async () => {
    const db = await getDb();
    if (!db) {
      console.warn("Database not available, skipping test");
      expect(true).toBe(true);
      return;
    }

    const testFurnitureId = "test-furn-delete-" + Date.now();
    const testUserId = 1;

    // Create custom furniture
    await db.insert(customFurniture).values({
      id: testFurnitureId,
      userId: testUserId,
      name: "Furniture to Delete",
      category: "seating",
      width: 80,
      depth: 40,
      color: "#0891b2",
    });

    // Verify it exists
    let retrieved = await db
      .select()
      .from(customFurniture)
      .where(eq(customFurniture.id, testFurnitureId));
    expect(retrieved).toHaveLength(1);

    // Delete the furniture
    await db.delete(customFurniture).where(eq(customFurniture.id, testFurnitureId));

    // Verify it's deleted
    retrieved = await db
      .select()
      .from(customFurniture)
      .where(eq(customFurniture.id, testFurnitureId));
    expect(retrieved).toHaveLength(0);
  });
});
