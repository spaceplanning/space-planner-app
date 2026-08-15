import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { users, userProfiles, floorPlans, customFurniture, floorPlanShares, analyticsEvents, crashReports } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { storagePut } from "./storage";
import { deleteUserAnalytics } from "./analyticsService";
import { deleteUserCrashReports } from "./crashReportingService";

/**
 * GDPR compliance router for data export and deletion
 */
export const gdprRouter = router({
  /**
   * Export all user data as JSON
   */
  exportData: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Fetch all user data
    const userData = await db.select().from(users).where(eq(users.id, ctx.user.id));
    const profileData = await db.select().from(userProfiles).where(eq(userProfiles.userId, ctx.user.id));
    const plansData = await db.select().from(floorPlans).where(eq(floorPlans.userId, ctx.user.id));
    const furnitureData = await db.select().from(customFurniture).where(eq(customFurniture.userId, ctx.user.id));
    const sharesData = await db.select().from(floorPlanShares).where(eq(floorPlanShares.ownerId, ctx.user.id));
    const analyticsData = await db.select().from(analyticsEvents).where(eq(analyticsEvents.userId, ctx.user.id));
    const crashReportData = await db.select().from(crashReports).where(eq(crashReports.userId, ctx.user.id));

    // Compile export
    const exportData = {
      exportDate: new Date().toISOString(),
      user: userData[0] || null,
      profile: profileData[0] || null,
      floorPlans: plansData,
      customFurniture: furnitureData,
      sharedFloorPlans: sharesData,
      analyticsEvents: analyticsData,
      crashReports: crashReportData,
    };

    // Create JSON file
    const jsonContent = JSON.stringify(exportData, null, 2);
    const fileName = `space-planner-data-export-${ctx.user.id}-${Date.now()}.json`;

    // Upload to storage
    const { url } = await storagePut(fileName, Buffer.from(jsonContent), "application/json");

    return {
      success: true,
      downloadUrl: url,
      fileName,
      exportDate: exportData.exportDate,
      recordCount: {
        floorPlans: plansData.length,
        customFurniture: furnitureData.length,
        sharedFloorPlans: sharesData.length,
        analyticsEvents: analyticsData.length,
        crashReports: crashReportData.length,
      },
    };
  }),

  /**
   * Request account deletion (30-day grace period)
   */
  requestDeletion: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Calculate deletion date (30 days from now)
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 30);
    deletionDate.setMilliseconds(0);

    // Update profile with deletion request
    await db
      .update(userProfiles)
      .set({
        deletionRequestedAt: new Date(),
        deletionScheduledFor: deletionDate,
      })
      .where(eq(userProfiles.userId, ctx.user.id));

    return {
      success: true,
      message: "Deletion request submitted. Your account will be permanently deleted in 30 days.",
      deletionScheduledFor: deletionDate.toISOString(),
      note: "You can cancel this request by logging in within the 30-day period.",
    };
  }),

  /**
   * Cancel deletion request
   */
  cancelDeletion: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Clear deletion request
    await db
      .update(userProfiles)
      .set({
        deletionRequestedAt: null,
        deletionScheduledFor: null,
      })
      .where(eq(userProfiles.userId, ctx.user.id));

    return {
      success: true,
      message: "Deletion request cancelled. Your account is safe.",
    };
  }),

  /**
   * Check deletion status
   */
  getDeletionStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const profile = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, ctx.user.id))
      .limit(1);

    if (!profile || profile.length === 0) {
      return {
        requested: false,
        scheduledFor: null,
        daysRemaining: null,
      };
    }

    const p = profile[0];
    if (!p.deletionScheduledFor) {
      return {
        requested: false,
        scheduledFor: null,
        daysRemaining: null,
      };
    }

    const now = new Date();
    const daysRemaining = Math.ceil((p.deletionScheduledFor.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      requested: true,
      scheduledFor: p.deletionScheduledFor.toISOString(),
      daysRemaining: Math.max(0, daysRemaining),
    };
  }),
});

/**
 * Permanently delete a user account and all associated data
 * This should be called by a scheduled job after the grace period
 */
export async function permanentlyDeleteUser(userId: number): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    console.log(`[GDPR] Permanently deleting user ${userId} and all associated data...`);

    // Delete analytics events
    await deleteUserAnalytics(userId);
    await deleteUserCrashReports(userId);

    // Delete floor plan shares
    await db.delete(floorPlanShares).where(eq(floorPlanShares.ownerId, userId));

    // Delete custom furniture
    await db.delete(customFurniture).where(eq(customFurniture.userId, userId));

    // Delete floor plans
    await db.delete(floorPlans).where(eq(floorPlans.userId, userId));

    // Delete user profile
    await db.delete(userProfiles).where(eq(userProfiles.userId, userId));

    // Delete user account
    await db.delete(users).where(eq(users.id, userId));

    console.log(`[GDPR] Successfully deleted user ${userId}`);
    return true;
  } catch (error) {
    console.error(`[GDPR] Error deleting user ${userId}:`, error);
    return false;
  }
}
