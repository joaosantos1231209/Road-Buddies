import type { Request, Response, NextFunction } from "express";
import { authAdmin } from "../lib/firebase.js";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.headers.authorization?.split("Bearer ")[1];

  if (!token) {
    res.status(401).json({ error: "Unauthorized: No token provided" });
    return;
  }

  try {
    const decodedToken = await authAdmin.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(403).json({ error: "Unauthorized: Invalid token", details: error });
  }
};

export const requireAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.headers.authorization?.split("Bearer ")[1];

  if (!token) {
    res.status(401).json({ error: "Unauthorized: No token provided" });
    return;
  }

  try {
    const decodedToken = await authAdmin.verifyIdToken(token);
    const userId = decodedToken.uid;
    
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.isAdmin) {
      res.status(403).json({ error: "Forbidden: Admin access required" });
      return;
    }

    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(403).json({ error: "Unauthorized: Invalid token", details: error });
  }
};
