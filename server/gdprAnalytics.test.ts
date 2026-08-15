import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { trackEvent, getUserAnalytics } from "./analyticsService";
import { gdprRouter, permanentlyDeleteUser } from "./gdprRouter";
import { getOrCreateUserProfile, updateUserProfile } from "./profileDb";
import { analyticsEvents, customFurniture, floorPlanShares, floorPlans, userProfiles, users } from "../drizzle/schema";

describe("GDPR persistence and consent-gated analytics", () => {
  let testUser: typeof users.$inferSelect;
  let deletionUser: typeof users.$inferSelect;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const suffix = Date.now();
    await db.insert(users).values([
      {
        openId: `gdpr-analytics-${suffix}`,
        name: "GDPR Analytics Test User",
        email: `gdpr-analytics-${suffix}@example.test`,
        loginMethod: "test",
        role: "user",
      },
      {
        openId: `gdpr-deletion-${suffix}`,
        name: "GDPR Deletion Test User",
        email: `gdpr-deletion-${suffix}@example.test`,
        loginMethod: "test",
        role: "user",
      },
    ]);

    const inserted = await db
      .select()
      .from(users)
      .where(eq(users.loginMethod, "test"));

    testUser = inserted.find(user => user.openId === `gdpr-analytics-${suffix}`)!;
    deletionUser = inserted.find(user => user.openId === `gdpr-deletion-${suffix}`)!;

    await getOrCreateUserProfile(testUser.id);
    await getOrCreateUserProfile(deletionUser.id);
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    for (const userId of [testUser?.id, deletionUser?.id].filter(Boolean) as number[]) {
      await db.delete(analyticsEvents).where(eq(analyticsEvents.userId, userId));
      await db.delete(floorPlanShares).where(eq(floorPlanShares.ownerId, userId));
      await db.delete(customFurniture).where(eq(customFurniture.userId, userId));
      await db.delete(floorPlans).where(eq(floorPlans.userId, userId));
      await db.delete(userProfiles).where(eq(userProfiles.userId, userId));
      await db.delete(users).where(eq(users.id, userId));
    }
  });

  it("records analytics only while the user has opted in", async () => {
    await updateUserProfile(testUser.id, { analyticsEnabled: 1 });
    expect(await trackEvent(testUser.id, "floor_plan_created", { roomCount: 2 })).toBe(true);

    const enabledEvents = await getUserAnalytics(testUser.id);
    expect(enabledEvents.some(event => event.eventName === "floor_plan_created")).toBe(true);

    await updateUserProfile(testUser.id, { analyticsEnabled: 0 });
    expect(await trackEvent(testUser.id, "floor_plan_deleted", { floorPlanId: "plan_1" })).toBe(false);

    const disabledEvents = await getUserAnalytics(testUser.id);
    expect(disabledEvents.filter(event => event.eventName === "floor_plan_deleted")).toHaveLength(0);
  });

  it("persists and cancels a 30-day GDPR deletion request", async () => {
    const caller = gdprRouter.createCaller({ user: testUser } as any);
    const requested = await caller.requestDeletion();
    expect(requested.success).toBe(true);

    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const profileAfterRequest = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, testUser.id))
      .limit(1);

    expect(profileAfterRequest[0].deletionRequestedAt).not.toBeNull();
    expect(profileAfterRequest[0].deletionScheduledFor).not.toBeNull();

    const status = await caller.getDeletionStatus();
    expect(status.requested).toBe(true);
    expect(status.daysRemaining).toBeGreaterThanOrEqual(29);
    expect(status.daysRemaining).toBeLessThanOrEqual(30);

    const cancelled = await caller.cancelDeletion();
    expect(cancelled.success).toBe(true);

    const statusAfterCancel = await caller.getDeletionStatus();
    expect(statusAfterCancel.requested).toBe(false);
  });

  it("permanently removes all user-owned records when deletion executes", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await updateUserProfile(deletionUser.id, { analyticsEnabled: 1 });
    await trackEvent(deletionUser.id, "onboarding_completed");

    expect(await permanentlyDeleteUser(deletionUser.id)).toBe(true);

    const remainingUser = await db.select().from(users).where(eq(users.id, deletionUser.id));
    const remainingProfile = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, deletionUser.id));
    const remainingEvents = await db
      .select()
      .from(analyticsEvents)
      .where(eq(analyticsEvents.userId, deletionUser.id));

    expect(remainingUser).toHaveLength(0);
    expect(remainingProfile).toHaveLength(0);
    expect(remainingEvents).toHaveLength(0);
  });
});
