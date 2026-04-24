import { Router } from "express";
import type { Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { db } from "../db/index.js";
import { matches, trips } from "../db/schema.js";
import { eq, inArray, and } from "drizzle-orm";
import { TripStatus } from "../lib/constants.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;

    const userTrips = await db.query.trips.findMany({
      where: and(
        eq(trips.userId, userId),
        eq(trips.status, TripStatus.ACTIVE),
        eq(trips.hidden, false),
      ),
      columns: { id: true },
    });

    const userTripIds = userTrips.map(t => t.id);

    if (userTripIds.length === 0) {
      res.json({ matches: [] });
      return;
    }

    const now = new Date();

    const userMatches = await db.query.matches.findMany({
      where: inArray(matches.seekerTripId, userTripIds),
      orderBy: (m, { desc }) => [desc(m.createdAt)],
      with: {
        providerTrip: { with: { creator: true } },
        seekerTrip: true,
      },
    });

    const enrichedMatches = userMatches.filter(m =>
      m.providerTrip &&
      m.providerTrip.status !== TripStatus.CANCELLED &&
      new Date(m.providerTrip.departureTime) >= now
    );

    res.json({ matches: enrichedMatches });
  } catch (error) {
    console.error("Error fetching matches:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/mark-read", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;

    const userTrips = await db.query.trips.findMany({
      where: eq(trips.userId, userId),
      columns: { id: true },
    });

    const userTripIds = userTrips.map(t => t.id);

    if (userTripIds.length > 0) {
      await db.update(matches).set({ isRead: true }).where(inArray(matches.seekerTripId, userTripIds));
    }

    res.json({ ok: true });
  } catch (error) {
    console.error("Error marking matches read:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
