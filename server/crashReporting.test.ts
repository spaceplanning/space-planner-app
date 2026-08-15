import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { deleteUserCrashReports, reportCrash } from "./crashReportingService";
import { getOrCreateUserProfile, updateUserProfile } from "./profileDb";
import { crashReports, userProfiles, users } from "../drizzle/schema";

describe("Consent-gated crash reporting", () => {
  let testUser: typeof users.$inferSelect;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const suffix = Date.now();
    await db.insert(users).values({
      openId: `crash-report-${suffix}`,
      name: "Crash Report Test User",
      email: `crash-report-${suffix}@example.test`,
      loginMethod: "test-crash-reporting",
      role: "user",
    });
    testUser = (
      await db.select().from(users).where(eq(users.openId, `crash-report-${suffix}`)).limit(1)
    )[0];
    await getOrCreateUserProfile(testUser.id);
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db || !testUser) return;
    await db.delete(crashReports).where(eq(crashReports.userId, testUser.id));
    await db.delete(userProfiles).where(eq(userProfiles.userId, testUser.id));
    await db.delete(users).where(eq(users.id, testUser.id));
  });

  it("stores a diagnostic when crash reporting is enabled", async () => {
    await updateUserProfile(testUser.id, { crashReportingEnabled: 1 });

    expect(
      await reportCrash(testUser.id, {
        message: "Unexpected canvas render failure",
        stack: "Error: Unexpected canvas render failure",
        pageUrl: "https://example.test/",
      })
    ).toBe(true);

    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const reports = await db.select().from(crashReports).where(eq(crashReports.userId, testUser.id));
    expect(reports).toHaveLength(1);
    expect(reports[0].message).toBe("Unexpected canvas render failure");
  });

  it("does not store a diagnostic when the user opts out", async () => {
    await updateUserProfile(testUser.id, { crashReportingEnabled: 0 });

    expect(await reportCrash(testUser.id, { message: "This must not be stored" })).toBe(false);

    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const reports = await db.select().from(crashReports).where(eq(crashReports.userId, testUser.id));
    expect(reports).toHaveLength(1);
  });

  it("removes diagnostics as part of privacy deletion", async () => {
    expect(await deleteUserCrashReports(testUser.id)).toBe(true);

    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const reports = await db.select().from(crashReports).where(eq(crashReports.userId, testUser.id));
    expect(reports).toHaveLength(0);
  });
});
