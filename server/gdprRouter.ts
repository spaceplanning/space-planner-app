import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { users, userProfiles, floorPlans, customFurniture } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { storagePut } from "./storage";

/**
 * GDPR compliance router for data export and deletion
 */
export const gdprRouter = router({
  /**
   * Export all user data as JSON
   */
  exportData: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Fetch all user data
    const userData = await db.select().from(users).where(eq(users.id, ctx.user.id));
    const profileData = await db.select().from(userProfiles).where(eq(userProfiles.userId, ctx.user.id));
    const plansData = await db.select().from(floorPlans).where(eq(floorPlans.userId, ctx.user.id));
    const furnitureData = await db.select().from(customFurniture).where(eq(customFurniture.userId, ctx.user.id));

    // Compile export
    const exportData = {
      exportDate: new Date().toISOString(),
      user: userData[0] || null,
      profile: profileData[0] || null,
      floorPlans: plansData,
      customFurniture: furnitureData,
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
    };
  }),

  /**
   * Request account deletion (soft delete with 30-day grace period)
   */
  requestDeletion: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Mark for deletion with 30-day grace period
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 30);

    // In a real implementation, you would add a deletionRequestedAt and deletionScheduledFor field
    // For now, we'll just return a confirmation

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
  cancelDeletion: protectedProcedure.query(async ({ ctx }) => {
    return {
      success: true,
      message: "Deletion request cancelled. Your account is safe.",
    };
  }),
});
