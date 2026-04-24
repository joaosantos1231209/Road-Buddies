import type { Request, Response, NextFunction } from "express";
import { authAdmin } from "../lib/firebase.js";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";

export interface FirebaseUser {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
}

// Express module augmentation so all Request objects carry user after requireAuth
declare global {
  namespace Express {
    interface Request {
      user: FirebaseUser;
    }
  }
}

export type AuthenticatedRequest = Request;

async function verifyToken(req: Request, res: Response): Promise<boolean> {
  const token = req.headers.authorization?.split("Bearer ")[1];
  if (!token) {
    res.status(401).json({ error: "Unauthorized: No token provided" });
    return false;
  }
  try {
    req.user = await authAdmin.verifyIdToken(token) as unknown as FirebaseUser;
    return true;
  } catch (error) {
    res.status(403).json({ error: "Unauthorized: Invalid token", details: error });
    return false;
  }
}

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (await verifyToken(req, res)) next();
};

export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!await verifyToken(req, res)) return;

  try {
    const [user] = await db.select().from(users).where(eq(users.id, req.user.uid)).limit(1);
    if (!user?.isAdmin) {
      res.status(403).json({ error: "Forbidden: Admin access required" });
      return;
    }
    next();
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
