import { getDb } from "./db";
import { userProfiles, policyVersions, UserProfile, InsertUserProfile, PolicyVersion } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

/**
 * Get or create user profile
 */
export async function getOrCreateUserProfile(userId: number): Promise<UserProfile> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Try to get existing profile
  const existing = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // Create new profile
  const profile: InsertUserProfile = {
    userId,
    displayName: undefined,
    profilePhotoUrl: undefined,
    bio: undefined,
    unitSystem: "feet",
    theme: "dark",
    notificationsEnabled: 1,
    onboardingCompleted: 0,
    privacyPolicyAccepted: 0,
    termsOfServiceAccepted: 0,
    analyticsEnabled: 1,
    crashReportingEnabled: 1,
    marketingEmailsEnabled: 0,
    platform: "web",
  };

  await db.insert(userProfiles).values(profile);

  const created = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  return created[0];
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: number,
  updates: Partial<InsertUserProfile>
): Promise<UserProfile> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(userProfiles)
    .set(updates)
    .where(eq(userProfiles.userId, userId));

  const updated = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  return updated[0];
}

/**
 * Mark onboarding as completed
 */
export async function completeOnboarding(userId: number): Promise<UserProfile> {
  return updateUserProfile(userId, { onboardingCompleted: 1 });
}

/**
 * Accept privacy policy
 */
export async function acceptPrivacyPolicy(userId: number): Promise<UserProfile> {
  return updateUserProfile(userId, {
    privacyPolicyAccepted: 1,
    privacyPolicyAcceptedAt: new Date(),
  });
}

/**
 * Accept terms of service
 */
export async function acceptTermsOfService(userId: number): Promise<UserProfile> {
  return updateUserProfile(userId, {
    termsOfServiceAccepted: 1,
    termsOfServiceAcceptedAt: new Date(),
  });
}

/**
 * Get latest policy version
 */
export async function getLatestPolicyVersion(
  policyType: "privacy" | "terms"
): Promise<PolicyVersion | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(policyVersions)
    .where(eq(policyVersions.policyType, policyType))
    .orderBy(policyVersions.createdAt)
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Create new policy version
 */
export async function createPolicyVersion(
  policyType: "privacy" | "terms",
  version: string,
  content: string,
  effectiveDate: Date
): Promise<PolicyVersion> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(policyVersions).values({
    policyType,
    version,
    content,
    effectiveDate,
  });

  const created = await db
    .select()
    .from(policyVersions)
    .where(eq(policyVersions.policyType, policyType))
    .orderBy(policyVersions.createdAt)
    .limit(1);

  return created[0];
}
