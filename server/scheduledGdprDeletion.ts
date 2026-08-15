import type { Request, Response } from "express";
import { and, eq, lte } from "drizzle-orm";
import { getDb } from "./db";
import { permanentlyDeleteUser } from "./gdprRouter";
import { systemJobs, userProfiles } from "../drizzle/schema";
import { sdk } from "./_core/sdk";

const GDPR_DELETION_JOB_ID = "gdpr-account-deletion";

/**
 * Deletes accounts whose 30-day GDPR grace period has elapsed.
 * This handler is invoked only by the project-level scheduled job.
 */
export async function handleScheduledGdprDeletion(req: Request, res: Response) {
  try {
    const cronUser = await sdk.authenticateRequest(req);
    if (!cronUser.isCron || !cronUser.taskUid) {
      return res.status(403).json({ error: "cron-only" });
    }

    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    // Authorize this callback against its persisted task UID, never request input.
    const job = await db
      .select()
      .from(systemJobs)
      .where(
        and(
          eq(systemJobs.id, GDPR_DELETION_JOB_ID),
          eq(systemJobs.scheduleCronTaskUid, cronUser.taskUid)
        )
      )
      .limit(1);

    if (job.length === 0) {
      return res.json({ ok: true, skipped: "orphan-or-unauthorized-job" });
    }

    const dueProfiles = await db
      .select({ userId: userProfiles.userId })
      .from(userProfiles)
      .where(lte(userProfiles.deletionScheduledFor, new Date()));

    let deletedCount = 0;
    const failures: Array<{ userId: number; error: string }> = [];

    for (const profile of dueProfiles) {
      const deleted = await permanentlyDeleteUser(profile.userId);
      if (deleted) {
        deletedCount += 1;
      } else {
        failures.push({ userId: profile.userId, error: "permanent deletion failed" });
      }
    }

    if (failures.length > 0) {
      throw new Error(`Failed to delete ${failures.length} account(s): ${JSON.stringify(failures)}`);
    }

    return res.json({
      ok: true,
      deletedCount,
      scannedCount: dueProfiles.length,
      executedAt: new Date().toISOString(),
    });
  } catch (error) {
    const typedError = error instanceof Error ? error : new Error(String(error));
    console.error("[GDPR Scheduled Deletion]", typedError);
    return res.status(500).json({
      error: typedError.message,
      context: { path: "/api/scheduled/gdpr-account-deletion" },
      timestamp: new Date().toISOString(),
    });
  }
}
