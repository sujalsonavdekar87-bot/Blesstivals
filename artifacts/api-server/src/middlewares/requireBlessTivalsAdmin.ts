import { clerkClient, getAuth } from "@clerk/express";
import type { RequestHandler } from "express";
import { logger } from "../lib/logger";

function allowedAdminEmails(): Set<string> {
  return new Set(
    (process.env.BLESTITVALS_ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export const requireBlessTivalsAdmin: RequestHandler = async (req, res, next) => {
  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: "Sign in to continue." });
    return;
  }

  const allowedEmails = allowedAdminEmails();
  if (allowedEmails.size === 0) {
    res.status(503).json({
      error: "Admin access is not configured. Add an approved admin email first.",
    });
    return;
  }

  try {
    const user = await clerkClient.users.getUser(userId);
    const primaryEmail = user.emailAddresses.find(
      (email) => email.id === user.primaryEmailAddressId,
    );
    const normalizedEmail = primaryEmail?.emailAddress.toLowerCase();

    if (
      !normalizedEmail ||
      primaryEmail?.verification?.status !== "verified" ||
      !allowedEmails.has(normalizedEmail)
    ) {
      res.status(403).json({ error: "This account is not an approved admin." });
      return;
    }

    res.locals.adminUserId = userId;
    next();
  } catch (error) {
    logger.error({ err: error, userId }, "Failed to verify admin account");
    res.status(503).json({ error: "Admin access could not be verified." });
  }
};
