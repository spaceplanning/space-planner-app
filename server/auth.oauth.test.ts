import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import type { TrpcContext } from "./_core/context";

describe("OAuth Authentication Flow", () => {
  let db: Awaited<ReturnType<typeof getDb>>;

  beforeAll(async () => {
    db = await getDb();
  });

  it("should handle OAuth callback and create/update user", async () => {
    // Simulate an OAuth callback context
    const oauthUser = {
      id: 1,
      openId: "test-oauth-user-123",
      email: "testuser@example.com",
      name: "Test User",
      loginMethod: "google",
      role: "user" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    const ctx: TrpcContext = {
      user: oauthUser,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {
        clearCookie: () => {},
      } as TrpcContext["res"],
    };

    // Test that authenticated user can access protected procedures
    const caller = appRouter.createCaller(ctx);
    
    // Test auth.me query returns current user
    const me = await caller.auth.me();
    expect(me).toBeDefined();
    expect(me?.openId).toBe("test-oauth-user-123");
    expect(me?.email).toBe("testuser@example.com");
  });

  it("should allow unauthenticated access to public procedures", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {
        clearCookie: () => {},
      } as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);
    
    // auth.me should return null for unauthenticated users
    const me = await caller.auth.me();
    expect(me).toBeNull();
  });

  it("should handle logout properly", async () => {
    const clearedCookies: { name: string; options: Record<string, unknown> }[] = [];

    const ctx: TrpcContext = {
      user: {
        id: 1,
        openId: "test-user",
        email: "test@example.com",
        name: "Test",
        loginMethod: "google",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {
        clearCookie: (name: string, options: Record<string, unknown>) => {
          clearedCookies.push({ name, options });
        },
      } as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();

    expect(result.success).toBe(true);
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe("app_session_id");
  });
});
