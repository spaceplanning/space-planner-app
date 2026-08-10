import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import * as profileDb from "./profileDb";
import { users, userProfiles } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Onboarding & Profile Management", () => {
  let testUserId: number;

  beforeAll(async () => {
    // Create a test user
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db.insert(users).values({
      openId: `test-user-${Date.now()}`,
      name: "Test User",
      email: "test@example.com",
      loginMethod: "google",
      role: "user",
    });

    // Get the inserted user ID
    const inserted = await db
      .select()
      .from(users)
      .where(eq(users.email, "test@example.com"))
      .limit(1);

    testUserId = inserted[0].id;
  });

  afterAll(async () => {
    // Clean up test data
    const db = await getDb();
    if (!db) return;

    await db.delete(userProfiles).where(eq(userProfiles.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  it("should create a new user profile on first access", async () => {
    const profile = await profileDb.getOrCreateUserProfile(testUserId);

    expect(profile).toBeDefined();
    expect(profile.userId).toBe(testUserId);
    expect(profile.unitSystem).toBe("feet");
    expect(profile.theme).toBe("dark");
    expect(profile.onboardingCompleted).toBe(0);
  });

  it("should return existing profile on subsequent access", async () => {
    const profile1 = await profileDb.getOrCreateUserProfile(testUserId);
    const profile2 = await profileDb.getOrCreateUserProfile(testUserId);

    expect(profile1.id).toBe(profile2.id);
  });

  it("should update user profile preferences", async () => {
    const updated = await profileDb.updateUserProfile(testUserId, {
      displayName: "John Doe",
      bio: "Space planning enthusiast",
      unitSystem: "meters",
      theme: "light",
    });

    expect(updated.displayName).toBe("John Doe");
    expect(updated.bio).toBe("Space planning enthusiast");
    expect(updated.unitSystem).toBe("meters");
    expect(updated.theme).toBe("light");
  });

  it("should mark onboarding as completed", async () => {
    const completed = await profileDb.completeOnboarding(testUserId);

    expect(completed.onboardingCompleted).toBe(1);
  });

  it("should accept privacy policy", async () => {
    const updated = await profileDb.acceptPrivacyPolicy(testUserId);

    expect(updated.privacyPolicyAccepted).toBe(1);
    expect(updated.privacyPolicyAcceptedAt).toBeDefined();
  });

  it("should accept terms of service", async () => {
    const updated = await profileDb.acceptTermsOfService(testUserId);

    expect(updated.termsOfServiceAccepted).toBe(1);
    expect(updated.termsOfServiceAcceptedAt).toBeDefined();
  });

  it("should toggle analytics preference", async () => {
    const disabled = await profileDb.updateUserProfile(testUserId, {
      analyticsEnabled: 0,
    });

    expect(disabled.analyticsEnabled).toBe(0);

    const enabled = await profileDb.updateUserProfile(testUserId, {
      analyticsEnabled: 1,
    });

    expect(enabled.analyticsEnabled).toBe(1);
  });

  it("should toggle crash reporting preference", async () => {
    const disabled = await profileDb.updateUserProfile(testUserId, {
      crashReportingEnabled: 0,
    });

    expect(disabled.crashReportingEnabled).toBe(0);

    const enabled = await profileDb.updateUserProfile(testUserId, {
      crashReportingEnabled: 1,
    });

    expect(enabled.crashReportingEnabled).toBe(1);
  });

  it("should toggle notifications preference", async () => {
    const disabled = await profileDb.updateUserProfile(testUserId, {
      notificationsEnabled: 0,
    });

    expect(disabled.notificationsEnabled).toBe(0);

    const enabled = await profileDb.updateUserProfile(testUserId, {
      notificationsEnabled: 1,
    });

    expect(enabled.notificationsEnabled).toBe(1);
  });

  it("should store platform and app version info", async () => {
    const updated = await profileDb.updateUserProfile(testUserId, {
      platform: "ios",
      appVersion: "1.0.0",
    });

    expect(updated.platform).toBe("ios");
    expect(updated.appVersion).toBe("1.0.0");
  });
});
