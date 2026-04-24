// Admin bypass login — VPS-only direct login route
// Adds GET /api/admin-login?secret=<ADMIN_LOGIN_SECRET> which sets the session cookie and redirects to /admin
// This bypasses Manus OAuth for self-hosted VPS deployments.

import type { Express, Request, Response } from "express";
import { SignJWT } from "jose";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import * as db from "../db";

const ADMIN_LOGIN_SECRET = process.env.ADMIN_LOGIN_SECRET ?? "castles-admin-bypass-2026";

export function registerAdminBypassRoute(app: Express) {
  app.get("/api/admin-login", async (req: Request, res: Response) => {
    const secret = req.query.secret as string | undefined;

    // Validate the bypass secret
    if (!secret || secret !== ADMIN_LOGIN_SECRET) {
      res.status(403).json({ error: "Invalid or missing secret" });
      return;
    }

    try {
      const openId = "christopher-cotton-admin";
      const name = "Christopher Cotton";
      const appId = ENV.appId || "nervecenter-vps";

      // Ensure the admin user exists in the database
      await db.upsertUser({
        openId,
        name,
        email: "lightcastlelabs@gmail.com",
        loginMethod: "direct",
        lastSignedIn: new Date(),
      });

      // Create a proper jose-signed JWT using the same secret as the app
      const secretKey = new TextEncoder().encode(ENV.cookieSecret || "castles-jwt-secret-2026-vps");
      const expirationSeconds = Math.floor((Date.now() + ONE_YEAR_MS) / 1000);

      const token = await new SignJWT({ openId, appId, name })
        .setProtectedHeader({ alg: "HS256", typ: "JWT" })
        .setExpirationTime(expirationSeconds)
        .sign(secretKey);

      // Set the session cookie with the same options the app uses
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Redirect to admin dashboard
      res.redirect(302, "/admin");
    } catch (error) {
      console.error("[AdminBypass] Login failed", error);
      res.status(500).json({ error: "Admin login failed" });
    }
  });
}
