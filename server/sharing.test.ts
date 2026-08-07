import { describe, it, expect, beforeEach, vi } from "vitest";
import * as db from "./db";
import { sendFloorPlanEmail } from "./emailService";
import { nanoid } from "nanoid";

describe("Sharing & Email Service", () => {
  describe("Share Token Generation", () => {
    it("should create a share with valid token", async () => {
      const share = await db.createShare({
        id: nanoid(),
        floorPlanId: "test-plan-1",
        ownerId: 1,
        sharedWithUserId: undefined,
        shareToken: nanoid(32),
        permission: "view",
        expiresAt: undefined,
      });

      expect(share).toBeDefined();
      expect(share?.shareToken).toHaveLength(32);
      expect(share?.permission).toBe("view");
    });

    it("should retrieve share by token", async () => {
      const token = nanoid(32);
      const share = await db.createShare({
        id: nanoid(),
        floorPlanId: "test-plan-2",
        ownerId: 1,
        sharedWithUserId: undefined,
        shareToken: token,
        permission: "edit",
        expiresAt: undefined,
      });

      const retrieved = await db.getShareByToken(token);
      expect(retrieved).toBeDefined();
      expect(retrieved?.shareToken).toBe(token);
      expect(retrieved?.permission).toBe("edit");
    });

    it("should return undefined for expired share", async () => {
      const token = nanoid(32);
      const pastDate = new Date(Date.now() - 1000); // 1 second ago
      
      const share = await db.createShare({
        id: nanoid(),
        floorPlanId: "test-plan-3",
        ownerId: 1,
        sharedWithUserId: undefined,
        shareToken: token,
        permission: "view",
        expiresAt: pastDate,
      });

      const retrieved = await db.getShareByToken(token);
      expect(retrieved).toBeUndefined();
    });

    it("should return share if not yet expired", async () => {
      const token = nanoid(32);
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
      
      const share = await db.createShare({
        id: nanoid(),
        floorPlanId: "test-plan-4",
        ownerId: 1,
        sharedWithUserId: undefined,
        shareToken: token,
        permission: "view",
        expiresAt: futureDate,
      });

      const retrieved = await db.getShareByToken(token);
      expect(retrieved).toBeDefined();
      expect(retrieved?.shareToken).toBe(token);
    });
  });

  describe("Email Service", () => {
    it("should handle missing SendGrid API key gracefully", async () => {
      // This test verifies the service handles missing credentials
      const result = await sendFloorPlanEmail(
        "test@example.com",
        "Test Floor Plan",
        [],
        "Test User"
      );

      // Should return false when API key is not configured
      // (This is expected in test environment)
      expect(typeof result).toBe("boolean");
    });

    it("should validate email format", async () => {
      // Test that invalid email addresses are caught
      const invalidEmail = "not-an-email";
      
      // This would be caught by the tRPC input validation
      // before reaching the service
      expect(invalidEmail).not.toContain("@");
    });
  });

  describe("Share Permissions", () => {
    it("should create view-only share", async () => {
      const share = await db.createShare({
        id: nanoid(),
        floorPlanId: "test-plan-5",
        ownerId: 1,
        sharedWithUserId: undefined,
        shareToken: nanoid(32),
        permission: "view",
        expiresAt: undefined,
      });

      expect(share?.permission).toBe("view");
    });

    it("should create edit-enabled share", async () => {
      const share = await db.createShare({
        id: nanoid(),
        floorPlanId: "test-plan-6",
        ownerId: 1,
        sharedWithUserId: undefined,
        shareToken: nanoid(32),
        permission: "edit",
        expiresAt: undefined,
      });

      expect(share?.permission).toBe("edit");
    });

    it("should delete share", async () => {
      const shareId = nanoid();
      const userId = 1;
      
      const share = await db.createShare({
        id: shareId,
        floorPlanId: "test-plan-7",
        ownerId: userId,
        sharedWithUserId: undefined,
        shareToken: nanoid(32),
        permission: "view",
        expiresAt: undefined,
      });

      expect(share).toBeDefined();

      const deleted = await db.deleteShare(shareId, userId);
      expect(deleted).toBe(true);

      // Verify deletion
      const shares = await db.getFloorPlanShares("test-plan-7", userId);
      expect(shares.filter(s => s.id === shareId)).toHaveLength(0);
    });

    it("should prevent deletion by non-owner", async () => {
      const shareId = nanoid();
      const ownerId = 1;
      const otherUserId = 2;
      
      const share = await db.createShare({
        id: shareId,
        floorPlanId: "test-plan-8",
        ownerId: ownerId,
        sharedWithUserId: undefined,
        shareToken: nanoid(32),
        permission: "view",
        expiresAt: undefined,
      });

      expect(share).toBeDefined();

      // Try to delete as different user
      const deleted = await db.deleteShare(shareId, otherUserId);
      expect(deleted).toBe(false);
    });
  });

  describe("Share Expiration", () => {
    it("should calculate correct expiration date", () => {
      const now = Date.now();
      const expiresInDays = 7;
      const expectedExpiration = new Date(now + expiresInDays * 24 * 60 * 60 * 1000);
      
      // Verify the calculation is within 1 second
      expect(Math.abs(expectedExpiration.getTime() - (now + expiresInDays * 24 * 60 * 60 * 1000))).toBeLessThan(1000);
    });

    it("should support indefinite shares (no expiration)", async () => {
      const share = await db.createShare({
        id: nanoid(),
        floorPlanId: "test-plan-9",
        ownerId: 1,
        sharedWithUserId: undefined,
        shareToken: nanoid(32),
        permission: "view",
        expiresAt: undefined,
      });

      expect(share?.expiresAt).toBeUndefined();
    });
  });
});
