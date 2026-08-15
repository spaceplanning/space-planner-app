import { getDb } from "./db";
import { analyticsEvents, userProfiles } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

/**
 * Track an analytics event if user has analytics enabled
 */
export async function trackEvent(
  userId: number,
  eventName: string,
  eventData?: Record<string, any>
): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    // Check if user has analytics enabled
    const profile = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    if (!profile || profile.length === 0 || profile[0].analyticsEnabled === 0) {
      return false; // Analytics disabled, don't track
    }

    // Insert analytics event
    await db.insert(analyticsEvents).values({
      id: nanoid(),
      userId,
      eventName,
      eventData: eventData ? JSON.stringify(eventData) : undefined,
    });

    return true;
  } catch (error) {
    console.error("[Analytics] Error tracking event:", error);
    return false;
  }
}

/**
 * Track multiple events in batch
 */
export async function trackEvents(
  userId: number,
  events: Array<{ name: string; data?: Record<string, any> }>
): Promise<number> {
  try {
    const db = await getDb();
    if (!db) return 0;

    // Check if user has analytics enabled
    const profile = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    if (!profile || profile.length === 0 || profile[0].analyticsEnabled === 0) {
      return 0; // Analytics disabled
    }

    // Insert all events
    const values = events.map((event) => ({
      id: nanoid(),
      userId,
      eventName: event.name,
      eventData: event.data ? JSON.stringify(event.data) : undefined,
    }));

    await db.insert(analyticsEvents).values(values);
    return values.length;
  } catch (error) {
    console.error("[Analytics] Error tracking events:", error);
    return 0;
  }
}

/**
 * Get analytics events for a user (for debugging/export)
 */
export async function getUserAnalytics(
  userId: number,
  limit: number = 100
): Promise<typeof analyticsEvents.$inferSelect[]> {
  try {
    const db = await getDb();
    if (!db) return [];

    const events = await db
      .select()
      .from(analyticsEvents)
      .where(eq(analyticsEvents.userId, userId))
      .orderBy(analyticsEvents.timestamp)
      .limit(limit);

    return events;
  } catch (error) {
    console.error("[Analytics] Error fetching user analytics:", error);
    return [];
  }
}

/**
 * Delete all analytics events for a user (for GDPR compliance)
 */
export async function deleteUserAnalytics(userId: number): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    await db.delete(analyticsEvents).where(eq(analyticsEvents.userId, userId));
    return true;
  } catch (error) {
    console.error("[Analytics] Error deleting user analytics:", error);
    return false;
  }
}
