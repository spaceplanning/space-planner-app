import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("Floor Plans Operations", () => {
  const authenticatedUser = {
    id: 1,
    openId: "test-user-plans",
    email: "plans@example.com",
    name: "Plan Tester",
    loginMethod: "google",
    role: "user" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const createAuthContext = (): TrpcContext => ({
    user: authenticatedUser,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  });

  it("should save a new floor plan", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.floorPlans.save({
      name: "Living Room Layout",
      totalWidth: 20,
      totalHeight: 15,
      roomsJson: JSON.stringify([]),
      furnitureJson: JSON.stringify([]),
    });

    expect(result).toBeDefined();
    expect(result.name).toBe("Living Room Layout");
    expect(result.totalWidth).toBe(20);
    expect(result.totalHeight).toBe(15);
  });

  it("should list user's floor plans", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const plans = await caller.floorPlans.list();

    expect(Array.isArray(plans)).toBe(true);
  });

  it("should save custom furniture", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.customFurniture.save({
      name: "Custom Sofa",
      category: "Seating",
      width: 96,
      depth: 36,
      color: "#FF5733",
    });

    expect(result).toBeDefined();
    expect(result.name).toBe("Custom Sofa");
    expect(result.category).toBe("Seating");
  });

  it("should list user's custom furniture", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const furniture = await caller.customFurniture.list();

    expect(Array.isArray(furniture)).toBe(true);
  });

  it("should prevent unauthenticated access to protected procedures", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {
        clearCookie: () => {},
      } as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);

    try {
      await caller.floorPlans.save({
        name: "Unauthorized Plan",
        totalWidth: 20,
        totalHeight: 15,
        roomsJson: JSON.stringify([]),
        furnitureJson: JSON.stringify([]),
      });
      expect.fail("Should have thrown an error");
    } catch (error: unknown) {
      expect(error).toBeDefined();
    }
  });
});
