import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

const storagePutMock = vi.hoisted(() => vi.fn());

vi.mock("./storage", () => ({
  storagePut: storagePutMock,
}));

import { getDb } from "./db";
import { gdprRouter } from "./gdprRouter";
import { getOrCreateUserProfile, updateUserProfile } from "./profileDb";
import { trackEvent } from "./analyticsService";
import { analyticsEvents, customFurniture, floorPlanShares, floorPlans, userProfiles, users } from "../drizzle/schema";

describe("GDPR data export", () => {
  let testUser: typeof users.$inferSelect;
  const suffix = Date.now();

  beforeAll(async () => {
    storagePutMock.mockResolvedValue({
      key: "exports/test-export.json",
      url: "/manus-storage/exports/test-export.json",
    });

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db.insert(users).values({
      openId: `gdpr-export-${suffix}`,
      name: "GDPR Export Test User",
      email: `gdpr-export-${suffix}@example.test`,
      loginMethod: "test-export",
      role: "user",
    });

    testUser = (
      await db.select().from(users).where(eq(users.openId, `gdpr-export-${suffix}`)).limit(1)
    )[0];

    await getOrCreateUserProfile(testUser.id);
    await updateUserProfile(testUser.id, { analyticsEnabled: 1 });
    await trackEvent(testUser.id, "floor_plan_created", { source: "export-test" });

    await db.insert(floorPlans).values({
      id: `export-plan-${suffix}`,
      userId: testUser.id,
      name: "Export Plan",
      totalWidth: 20,
      totalHeight: 15,
      roomsJson: "[]",
      furnitureJson: "[]",
    });
    await db.insert(customFurniture).values({
      id: `export-furniture-${suffix}`,
      userId: testUser.id,
      name: "Export Chair",
      category: "seating",
      width: 24,
      depth: 24,
      color: "#4a9eff",
    });
    await db.insert(floorPlanShares).values({
      id: `export-share-${suffix}`,
      floorPlanId: `export-plan-${suffix}`,
      ownerId: testUser.id,
      shareToken: `export-token-${suffix}`,
      permission: "view",
    });
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db || !testUser) return;

    await db.delete(analyticsEvents).where(eq(analyticsEvents.userId, testUser.id));
    await db.delete(floorPlanShares).where(eq(floorPlanShares.ownerId, testUser.id));
    await db.delete(customFurniture).where(eq(customFurniture.userId, testUser.id));
    await db.delete(floorPlans).where(eq(floorPlans.userId, testUser.id));
    await db.delete(userProfiles).where(eq(userProfiles.userId, testUser.id));
    await db.delete(users).where(eq(users.id, testUser.id));
  });

  it("creates an export containing profile, plans, furniture, shares, and analytics", async () => {
    const caller = gdprRouter.createCaller({ user: testUser } as any);
    const result = await caller.exportData();

    expect(result.success).toBe(true);
    expect(result.downloadUrl).toBe("/manus-storage/exports/test-export.json");
    expect(result.recordCount).toEqual({
      floorPlans: 1,
      customFurniture: 1,
      sharedFloorPlans: 1,
      analyticsEvents: 1,
      crashReports: 0,
    });
    expect(storagePutMock).toHaveBeenCalledTimes(1);

    const [fileName, buffer, contentType] = storagePutMock.mock.calls[0];
    expect(fileName).toContain(`space-planner-data-export-${testUser.id}`);
    expect(contentType).toBe("application/json");

    const exported = JSON.parse(Buffer.from(buffer).toString("utf8"));
    expect(exported.user.id).toBe(testUser.id);
    expect(exported.profile.userId).toBe(testUser.id);
    expect(exported.floorPlans).toHaveLength(1);
    expect(exported.customFurniture).toHaveLength(1);
    expect(exported.sharedFloorPlans).toHaveLength(1);
    expect(exported.analyticsEvents).toHaveLength(1);
    expect(exported.crashReports).toHaveLength(0);
  });
});
