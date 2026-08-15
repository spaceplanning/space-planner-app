import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { crashReports, userProfiles } from "../drizzle/schema";
import { getDb } from "./db";

type CrashPayload = {
  message: string;
  stack?: string;
  componentStack?: string;
  pageUrl?: string;
  userAgent?: string;
};

const truncate = (value: string | undefined, limit: number) => value?.slice(0, limit);

/** Stores a minimal diagnostic record only when the user has opted in. */
export async function reportCrash(userId: number, payload: CrashPayload): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    const profile = await db
      .select({ crashReportingEnabled: userProfiles.crashReportingEnabled })
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    if (profile.length === 0 || profile[0].crashReportingEnabled !== 1) return false;

    await db.insert(crashReports).values({
      id: nanoid(),
      userId,
      message: truncate(payload.message, 2000) || "Unknown client error",
      stack: truncate(payload.stack, 20000),
      componentStack: truncate(payload.componentStack, 10000),
      pageUrl: truncate(payload.pageUrl, 2048),
      userAgent: truncate(payload.userAgent, 1024),
    });

    return true;
  } catch (error) {
    console.error("[Crash Reporting] Failed to record diagnostic:", error);
    return false;
  }
}

/** Removes diagnostics with other personal data during permanent deletion. */
export async function deleteUserCrashReports(userId: number): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;
    await db.delete(crashReports).where(eq(crashReports.userId, userId));
    return true;
  } catch (error) {
    console.error("[Crash Reporting] Failed to delete diagnostics:", error);
    return false;
  }
}
