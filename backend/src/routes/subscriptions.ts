import { Router } from "express";
import type { Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { db } from "../db/index.js";
import { tripSubscriptions, cities } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import { validateBody, parseIntParam, errorMessage } from "../lib/validate.js";
import { createSubscriptionSchema, editSubscriptionSchema } from "../lib/validate.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const subs = await db.query.tripSubscriptions.findMany({
      where: and(eq(tripSubscriptions.userId, userId), eq(tripSubscriptions.isActive, true)),
      with: {
        origin: true,
        destination: true,
      },
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });
    res.json({ subscriptions: subs });
  } catch (error) {
    console.error("List Subscriptions Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", validateBody(createSubscriptionSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { originId, destinationId, durationType, expiresAt } = req.body;

    if (originId === destinationId) {
      res.status(400).json({ error: "A origem e o destino têm de ser diferentes." });
      return;
    }

    const existing = await db.query.tripSubscriptions.findFirst({
      where: and(
        eq(tripSubscriptions.userId, userId),
        eq(tripSubscriptions.originId, originId),
        eq(tripSubscriptions.destinationId, destinationId),
        eq(tripSubscriptions.isActive, true),
      ),
    });

    if (existing) {
      res.status(400).json({ error: "Já tens uma subscrição ativa para este trajeto." });
      return;
    }

    const computedExpiresAt = computeExpiry(durationType, expiresAt);

    const [sub] = await db.insert(tripSubscriptions).values({
      userId,
      originId,
      destinationId,
      durationType,
      expiresAt: computedExpiresAt,
      isActive: true,
    }).returning();

    const full = await db.query.tripSubscriptions.findFirst({
      where: eq(tripSubscriptions.id, sub!.id),
      with: { origin: true, destination: true },
    });

    res.status(201).json({ subscription: full });
  } catch (error) {
    console.error("Create Subscription Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/:id", validateBody(editSubscriptionSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = parseIntParam(req.params.id);
    if (!id) { res.status(400).json({ error: "ID inválido" }); return; }
    const userId = req.user.uid;
    const { originId, destinationId, durationType, expiresAt } = req.body;

    const sub = await db.query.tripSubscriptions.findFirst({
      where: and(eq(tripSubscriptions.id, id), eq(tripSubscriptions.userId, userId), eq(tripSubscriptions.isActive, true)),
    });
    if (!sub) { res.status(404).json({ error: "Subscrição não encontrada." }); return; }

    const newOrigin = originId ?? sub.originId;
    const newDest = destinationId ?? sub.destinationId;

    if (newOrigin === newDest) {
      res.status(400).json({ error: "A origem e o destino têm de ser diferentes." });
      return;
    }

    // check duplicate if origin/dest changed
    if (originId !== undefined || destinationId !== undefined) {
      const duplicate = await db.query.tripSubscriptions.findFirst({
        where: and(
          eq(tripSubscriptions.userId, userId),
          eq(tripSubscriptions.originId, newOrigin),
          eq(tripSubscriptions.destinationId, newDest),
          eq(tripSubscriptions.isActive, true),
        ),
      });
      if (duplicate && duplicate.id !== id) {
        res.status(400).json({ error: "Já tens uma subscrição ativa para este trajeto." });
        return;
      }
    }

    const newDurationType = durationType ?? sub.durationType;
    const computedExpiresAt = computeExpiry(newDurationType, expiresAt);

    await db.update(tripSubscriptions).set({
      originId: newOrigin,
      destinationId: newDest,
      durationType: newDurationType,
      expiresAt: computedExpiresAt,
    }).where(eq(tripSubscriptions.id, id));

    const updated = await db.query.tripSubscriptions.findFirst({
      where: eq(tripSubscriptions.id, id),
      with: { origin: true, destination: true },
    });

    res.json({ subscription: updated });
  } catch (error) {
    console.error("Edit Subscription Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:id", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = parseIntParam(req.params.id);
    if (!id) { res.status(400).json({ error: "ID inválido" }); return; }
    const userId = req.user.uid;

    const sub = await db.query.tripSubscriptions.findFirst({
      where: and(eq(tripSubscriptions.id, id), eq(tripSubscriptions.userId, userId)),
    });
    if (!sub) { res.status(404).json({ error: "Subscrição não encontrada." }); return; }

    // isActive=false, sem email de expiração quando cancelada manualmente
    await db.update(tripSubscriptions).set({ isActive: false }).where(eq(tripSubscriptions.id, id));

    res.json({ message: "Subscrição cancelada com sucesso." });
  } catch (error: unknown) {
    console.error("Delete Subscription Error:", error);
    res.status(400).json({ error: errorMessage(error) });
  }
});

function computeExpiry(durationType: string, customExpiresAt?: string | null): Date | null {
  const now = new Date();
  switch (durationType) {
    case "24H":
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case "7D":
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case "30D":
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    case "FOREVER":
      return null;
    case "CUSTOM":
      return customExpiresAt ? new Date(customExpiresAt) : null;
    default:
      return null;
  }
}

export default router;
