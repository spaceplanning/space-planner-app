import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as profileDb from "./profileDb";

export const onboardingRouter = router({
  /**
   * Get or create user profile
   */
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    return await profileDb.getOrCreateUserProfile(ctx.user.id);
  }),

  /**
   * Update user profile
   */
  updateProfile: protectedProcedure
    .input(
      z.object({
        displayName: z.string().optional(),
        bio: z.string().optional(),
        unitSystem: z.enum(["feet", "meters"]).optional(),
        theme: z.enum(["dark", "light", "auto"]).optional(),
        notificationsEnabled: z.boolean().optional(),
        analyticsEnabled: z.boolean().optional(),
        crashReportingEnabled: z.boolean().optional(),
        marketingEmailsEnabled: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updates: any = {};

      if (input.displayName !== undefined) updates.displayName = input.displayName;
      if (input.bio !== undefined) updates.bio = input.bio;
      if (input.unitSystem !== undefined) updates.unitSystem = input.unitSystem;
      if (input.theme !== undefined) updates.theme = input.theme;
      if (input.notificationsEnabled !== undefined)
        updates.notificationsEnabled = input.notificationsEnabled ? 1 : 0;
      if (input.analyticsEnabled !== undefined)
        updates.analyticsEnabled = input.analyticsEnabled ? 1 : 0;
      if (input.crashReportingEnabled !== undefined)
        updates.crashReportingEnabled = input.crashReportingEnabled ? 1 : 0;
      if (input.marketingEmailsEnabled !== undefined)
        updates.marketingEmailsEnabled = input.marketingEmailsEnabled ? 1 : 0;

      return await profileDb.updateUserProfile(ctx.user.id, updates);
    }),

  /**
   * Accept privacy policy
   */
  acceptPrivacyPolicy: protectedProcedure.mutation(async ({ ctx }) => {
    return await profileDb.acceptPrivacyPolicy(ctx.user.id);
  }),

  /**
   * Accept terms of service
   */
  acceptTermsOfService: protectedProcedure.mutation(async ({ ctx }) => {
    return await profileDb.acceptTermsOfService(ctx.user.id);
  }),

  /**
   * Complete onboarding
   */
  completeOnboarding: protectedProcedure.mutation(async ({ ctx }) => {
    return await profileDb.completeOnboarding(ctx.user.id);
  }),

  /**
   * Get latest privacy policy
   */
  getPrivacyPolicy: protectedProcedure.query(async () => {
    return await profileDb.getLatestPolicyVersion("privacy");
  }),

  /**
   * Get latest terms of service
   */
  getTermsOfService: protectedProcedure.query(async () => {
    return await profileDb.getLatestPolicyVersion("terms");
  }),
});
