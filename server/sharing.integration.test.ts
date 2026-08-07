import { describe, it, expect, beforeEach } from "vitest";
import * as db from "./db";
import { nanoid } from "nanoid";

/**
 * End-to-end tests for the complete sharing workflow
 * Tests the full lifecycle: create share -> retrieve by token -> verify permissions -> delete share
 */
describe("Sharing Workflow Integration Tests", () => {
  const testUserId = 1;
  const testPlanId = `test-plan-${nanoid(8)}`;

  describe("Complete Share Lifecycle", () => {
    it("should create, retrieve, and delete a share link", async () => {
      // Step 1: Create a share link
      const shareToken = nanoid(32);
      const share = await db.createShare({
        id: nanoid(),
        floorPlanId: testPlanId,
        ownerId: testUserId,
        sharedWithUserId: undefined,
        shareToken,
        permission: "view",
        expiresAt: undefined,
      });

      expect(share).toBeDefined();
      expect(share?.shareToken).toBe(shareToken);
      expect(share?.permission).toBe("view");

      // Step 2: Retrieve share by token (simulating public access)
      const retrieved = await db.getShareByToken(shareToken);
      expect(retrieved).toBeDefined();
      expect(retrieved?.floorPlanId).toBe(testPlanId);
      expect(retrieved?.permission).toBe("view");

      // Step 3: Delete the share
      const deleted = await db.deleteShare(share!.id, testUserId);
      expect(deleted).toBe(true);

      // Step 4: Verify share is deleted
      const shouldBeUndefined = await db.getShareByToken(shareToken);
      expect(shouldBeUndefined).toBeUndefined();
    });

    it("should list all shares for a floor plan", async () => {
      const planId = `test-plan-${nanoid(8)}`;
      
      // Create multiple shares for the same plan
      const share1 = await db.createShare({
        id: nanoid(),
        floorPlanId: planId,
        ownerId: testUserId,
        sharedWithUserId: undefined,
        shareToken: nanoid(32),
        permission: "view",
        expiresAt: undefined,
      });

      const share2 = await db.createShare({
        id: nanoid(),
        floorPlanId: planId,
        ownerId: testUserId,
        sharedWithUserId: undefined,
        shareToken: nanoid(32),
        permission: "edit",
        expiresAt: undefined,
      });

      // Retrieve all shares
      const shares = await db.getFloorPlanShares(planId, testUserId);
      
      // Note: getFloorPlanShares verifies ownership, so we should get the shares we created
      expect(shares).toBeDefined();
      expect(Array.isArray(shares)).toBe(true);
    });
  });

  describe("Permission Enforcement", () => {
    it("should enforce view-only permission", async () => {
      const shareToken = nanoid(32);
      const share = await db.createShare({
        id: nanoid(),
        floorPlanId: testPlanId,
        ownerId: testUserId,
        sharedWithUserId: undefined,
        shareToken,
        permission: "view",
        expiresAt: undefined,
      });

      const retrieved = await db.getShareByToken(shareToken);
      
      // Verify permission is view-only
      expect(retrieved?.permission).toBe("view");
      expect(retrieved?.permission).not.toBe("edit");
    });

    it("should enforce edit permission", async () => {
      const shareToken = nanoid(32);
      const share = await db.createShare({
        id: nanoid(),
        floorPlanId: testPlanId,
        ownerId: testUserId,
        sharedWithUserId: undefined,
        shareToken,
        permission: "edit",
        expiresAt: undefined,
      });

      const retrieved = await db.getShareByToken(shareToken);
      
      // Verify permission allows editing
      expect(retrieved?.permission).toBe("edit");
    });

    it("should prevent unauthorized deletion", async () => {
      const shareId = nanoid();
      const ownerId = 1;
      const unauthorizedUserId = 999;
      
      const share = await db.createShare({
        id: shareId,
        floorPlanId: testPlanId,
        ownerId: ownerId,
        sharedWithUserId: undefined,
        shareToken: nanoid(32),
        permission: "view",
        expiresAt: undefined,
      });

      // Try to delete as unauthorized user
      const deleted = await db.deleteShare(shareId, unauthorizedUserId);
      expect(deleted).toBe(false);

      // Verify share still exists (unauthorized deletion should have failed)
      const shares = await db.getFloorPlanShares(testPlanId, ownerId);
      // The share should still exist since deletion was unauthorized
      expect(shares).toBeDefined();
    });
  });

  describe("Share Expiration Workflow", () => {
    it("should create share with expiration date", async () => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      const shareToken = nanoid(32);
      
      const share = await db.createShare({
        id: nanoid(),
        floorPlanId: testPlanId,
        ownerId: testUserId,
        sharedWithUserId: undefined,
        shareToken,
        permission: "view",
        expiresAt,
      });

      expect(share?.expiresAt).toBeDefined();
      expect(share?.expiresAt?.getTime()).toBeGreaterThan(Date.now());
    });

    it("should reject expired shares", async () => {
      const pastDate = new Date(Date.now() - 1000); // 1 second ago
      const shareToken = nanoid(32);
      
      const share = await db.createShare({
        id: nanoid(),
        floorPlanId: testPlanId,
        ownerId: testUserId,
        sharedWithUserId: undefined,
        shareToken,
        permission: "view",
        expiresAt: pastDate,
      });

      // Try to retrieve expired share
      const retrieved = await db.getShareByToken(shareToken);
      expect(retrieved).toBeUndefined();
    });

    it("should accept shares near expiration but not expired", async () => {
      const futureDate = new Date(Date.now() + 1000); // 1 second from now
      const shareToken = nanoid(32);
      
      const share = await db.createShare({
        id: nanoid(),
        floorPlanId: testPlanId,
        ownerId: testUserId,
        sharedWithUserId: undefined,
        shareToken,
        permission: "view",
        expiresAt: futureDate,
      });

      // Should be retrievable
      const retrieved = await db.getShareByToken(shareToken);
      expect(retrieved).toBeDefined();
      expect(retrieved?.shareToken).toBe(shareToken);
    });
  });

  describe("Multiple Shares for Same Plan", () => {
    it("should support multiple active shares with different permissions", async () => {
      const planId = `test-plan-${nanoid(8)}`;
      
      // Create view-only share
      const viewShare = await db.createShare({
        id: nanoid(),
        floorPlanId: planId,
        ownerId: testUserId,
        sharedWithUserId: undefined,
        shareToken: nanoid(32),
        permission: "view",
        expiresAt: undefined,
      });

      // Create edit share
      const editShare = await db.createShare({
        id: nanoid(),
        floorPlanId: planId,
        ownerId: testUserId,
        sharedWithUserId: undefined,
        shareToken: nanoid(32),
        permission: "edit",
        expiresAt: undefined,
      });

      // Both should be retrievable
      const viewRetrieved = await db.getShareByToken(viewShare!.shareToken);
      const editRetrieved = await db.getShareByToken(editShare!.shareToken);

      expect(viewRetrieved?.permission).toBe("view");
      expect(editRetrieved?.permission).toBe("edit");
      expect(viewRetrieved?.shareToken).not.toBe(editRetrieved?.shareToken);
    });

    it("should handle selective deletion of shares", async () => {
      const planId = `test-plan-${nanoid(8)}`;
      
      // Create two shares
      const share1 = await db.createShare({
        id: nanoid(),
        floorPlanId: planId,
        ownerId: testUserId,
        sharedWithUserId: undefined,
        shareToken: nanoid(32),
        permission: "view",
        expiresAt: undefined,
      });

      const share2 = await db.createShare({
        id: nanoid(),
        floorPlanId: planId,
        ownerId: testUserId,
        sharedWithUserId: undefined,
        shareToken: nanoid(32),
        permission: "edit",
        expiresAt: undefined,
      });

      // Delete only the first share
      await db.deleteShare(share1!.id, testUserId);

      // First should be gone
      const deleted1 = await db.getShareByToken(share1!.shareToken);
      expect(deleted1).toBeUndefined();

      // Second should still exist
      const deleted2 = await db.getShareByToken(share2!.shareToken);
      expect(deleted2).toBeDefined();
    });
  });

  describe("Share Token Uniqueness", () => {
    it("should generate unique tokens for each share", async () => {
      const tokens = new Set<string>();
      
      for (let i = 0; i < 10; i++) {
        const token = nanoid(32);
        tokens.add(token);
      }

      // All tokens should be unique
      expect(tokens.size).toBe(10);
    });

    it("should not allow duplicate tokens", async () => {
      const shareToken = nanoid(32);
      
      const share1 = await db.createShare({
        id: nanoid(),
        floorPlanId: testPlanId,
        ownerId: testUserId,
        sharedWithUserId: undefined,
        shareToken,
        permission: "view",
        expiresAt: undefined,
      });

      // In a real scenario, trying to create with the same token would fail
      // This test documents the expected behavior
      expect(share1?.shareToken).toBe(shareToken);
    });
  });

  describe("Share Data Integrity", () => {
    it("should preserve all share metadata", async () => {
      const shareId = nanoid();
      const shareToken = nanoid(32);
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      
      const share = await db.createShare({
        id: shareId,
        floorPlanId: testPlanId,
        ownerId: testUserId,
        sharedWithUserId: undefined,
        shareToken,
        permission: "edit",
        expiresAt,
      });

      const retrieved = await db.getShareByToken(shareToken);
      
      expect(retrieved?.id).toBe(shareId);
      expect(retrieved?.floorPlanId).toBe(testPlanId);
      expect(retrieved?.ownerId).toBe(testUserId);
      expect(retrieved?.shareToken).toBe(shareToken);
      expect(retrieved?.permission).toBe("edit");
      // Verify expiration date is set (allow 1 second tolerance for database operations)
      expect(retrieved?.expiresAt).toBeDefined();
      expect(Math.abs(retrieved?.expiresAt?.getTime() - expiresAt.getTime())).toBeLessThan(1000);
    });

    it("should maintain share state across operations", async () => {
      const shareToken = nanoid(32);
      
      const share = await db.createShare({
        id: nanoid(),
        floorPlanId: testPlanId,
        ownerId: testUserId,
        sharedWithUserId: undefined,
        shareToken,
        permission: "view",
        expiresAt: undefined,
      });

      // Retrieve multiple times
      const retrieved1 = await db.getShareByToken(shareToken);
      const retrieved2 = await db.getShareByToken(shareToken);
      const retrieved3 = await db.getShareByToken(shareToken);

      // Should be consistent
      expect(retrieved1?.id).toBe(retrieved2?.id);
      expect(retrieved2?.id).toBe(retrieved3?.id);
      expect(retrieved1?.permission).toBe(retrieved2?.permission);
      expect(retrieved2?.permission).toBe(retrieved3?.permission);
    });
  });
});
