import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import * as profileDb from "../profileDb";
import { trackEvent } from "../analyticsService";
import { reportCrash } from "../crashReportingService";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getBodyParam(req: Request, key: string): string | undefined {
  const value = req.body?.[key];
  return typeof value === "string" ? value : undefined;
}

function isAllowedNativeRedirect(state: string): boolean {
  try {
    return atob(state) === "spaceplanner://oauth/callback";
  } catch {
    return false;
  }
}

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function getBooleanBodyParam(req: Request, key: string): boolean | undefined {
  const value = req.body?.[key];
  return typeof value === "boolean" ? value : undefined;
}

function getTrimmedBodyParam(req: Request, key: string, maxLength: number): string | undefined {
  const value = getBodyParam(req, key);
  return value === undefined ? undefined : value.trim().slice(0, maxLength);
}

function serializeMobileProfile(profile: Awaited<ReturnType<typeof profileDb.getOrCreateUserProfile>>) {
  return {
    displayName: profile.displayName,
    bio: profile.bio,
    unitSystem: profile.unitSystem,
    theme: profile.theme,
    notificationsEnabled: profile.notificationsEnabled === 1,
    onboardingCompleted: profile.onboardingCompleted === 1,
    analyticsEnabled: profile.analyticsEnabled === 1,
    crashReportingEnabled: profile.crashReportingEnabled === 1,
    platform: profile.platform,
    appVersion: profile.appVersion,
  };
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/mobile/config", (_req: Request, res: Response) => {
    res.json({
      appId: process.env.VITE_APP_ID ?? "",
      oauthPortalUrl: process.env.VITE_OAUTH_PORTAL_URL ?? "",
    });
  });

  app.post("/api/oauth/mobile/exchange", async (req: Request, res: Response) => {
    const code = getBodyParam(req, "code");
    const state = getBodyParam(req, "state");

    if (!code || !state || !isAllowedNativeRedirect(state)) {
      res.status(400).json({ error: "Invalid native OAuth response" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });
      const user = await db.getUserByOpenId(userInfo.openId);

      res.json({
        sessionToken,
        user: user
          ? {
              id: user.id,
              openId: user.openId,
              name: user.name,
              email: user.email,
              loginMethod: user.loginMethod,
            }
          : null,
      });
    } catch (error) {
      console.error("[OAuth] Native code exchange failed", error);
      res.status(500).json({ error: "Native OAuth exchange failed" });
    }
  });

  app.get("/api/oauth/mobile/me", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      res.json({
        id: user.id,
        openId: user.openId,
        name: user.name,
        email: user.email,
        loginMethod: user.loginMethod,
      });
    } catch {
      res.status(401).json({ error: "Unauthorized" });
    }
  });

  app.get("/api/oauth/mobile/profile", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      const profile = await profileDb.getOrCreateUserProfile(user.id);
      res.json({ profile: serializeMobileProfile(profile) });
    } catch {
      res.status(401).json({ error: "Unauthorized" });
    }
  });

  app.patch("/api/oauth/mobile/profile", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      await profileDb.getOrCreateUserProfile(user.id);

      const updates: Record<string, unknown> = {};
      const displayName = getTrimmedBodyParam(req, "displayName", 255);
      const bio = getTrimmedBodyParam(req, "bio", 5000);
      const appVersion = getTrimmedBodyParam(req, "appVersion", 32);
      const unitSystem = getBodyParam(req, "unitSystem");
      const theme = getBodyParam(req, "theme");
      const platform = getBodyParam(req, "platform");

      if (displayName !== undefined) updates.displayName = displayName || null;
      if (bio !== undefined) updates.bio = bio || null;
      if (appVersion !== undefined) updates.appVersion = appVersion || null;
      if (unitSystem === "feet" || unitSystem === "meters") updates.unitSystem = unitSystem;
      if (theme === "dark" || theme === "light" || theme === "auto") updates.theme = theme;
      if (platform === "ios" || platform === "android") updates.platform = platform;

      const notificationsEnabled = getBooleanBodyParam(req, "notificationsEnabled");
      const analyticsEnabled = getBooleanBodyParam(req, "analyticsEnabled");
      const crashReportingEnabled = getBooleanBodyParam(req, "crashReportingEnabled");
      const onboardingCompleted = getBooleanBodyParam(req, "onboardingCompleted");

      if (notificationsEnabled !== undefined) updates.notificationsEnabled = notificationsEnabled ? 1 : 0;
      if (analyticsEnabled !== undefined) updates.analyticsEnabled = analyticsEnabled ? 1 : 0;
      if (crashReportingEnabled !== undefined) updates.crashReportingEnabled = crashReportingEnabled ? 1 : 0;
      if (onboardingCompleted !== undefined) updates.onboardingCompleted = onboardingCompleted ? 1 : 0;

      const profile = await profileDb.updateUserProfile(user.id, updates);
      res.json({ profile: serializeMobileProfile(profile) });
    } catch (error) {
      console.error("[OAuth] Native profile update failed", error);
      res.status(401).json({ error: "Unauthorized" });
    }
  });

  app.post("/api/oauth/mobile/analytics", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      const eventName = getBodyParam(req, "eventName");
      const eventData = req.body?.eventData;

      if (!eventName || !/^[a-z0-9_]{1,255}$/.test(eventName)) {
        res.status(400).json({ error: "Invalid analytics event name" });
        return;
      }
      if (eventData !== undefined && (typeof eventData !== "object" || Array.isArray(eventData) || eventData === null)) {
        res.status(400).json({ error: "Invalid analytics event data" });
        return;
      }

      const tracked = await trackEvent(user.id, eventName, eventData as Record<string, unknown> | undefined);
      res.json({ tracked });
    } catch {
      res.status(401).json({ error: "Unauthorized" });
    }
  });

  app.post("/api/oauth/mobile/crash", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      const message = getTrimmedBodyParam(req, "message", 2000);
      const stack = getTrimmedBodyParam(req, "stack", 20000);
      const pageUrl = getTrimmedBodyParam(req, "pageUrl", 2048);
      const userAgent = getTrimmedBodyParam(req, "userAgent", 1024);

      if (!message) {
        res.status(400).json({ error: "Crash message is required" });
        return;
      }

      const reported = await reportCrash(user.id, { message, stack, pageUrl, userAgent });
      res.json({ reported });
    } catch {
      res.status(401).json({ error: "Unauthorized" });
    }
  });

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
