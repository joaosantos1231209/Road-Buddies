import { Router } from "express";
import type { Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { db } from "../db/index.js";
import { matches, trips, users } from "../db/schema.js";
import { eq, inArray, and } from "drizzle-orm";

const router = Router();
router.use(requireAuth);

// GET /api/matches - Retrieve matches where the current user's trip is the seeker ("NEEDRIDE")
router.get("/", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;

    // First find all active NEEDRIDE trips created by the user
    // We also want to include matches where the user is the PROVIDER if we want them to see who matched with them.
    // But the requirement says "Todos os matches correspondentes aos pedidos do utilizador atual devem ser listados aqui." -> meaning their requests (seeking ride).

    const userTrips = await db.query.trips.findMany({
      where: and(
        eq(trips.userId, userId),
        eq(trips.status, 'ACTIVE'),
        eq(trips.hidden, false)
      ),
    });

    const userTripIds = userTrips.map(t => t.id);

    if (userTripIds.length === 0) {
      res.json({ matches: [] });
      return;
    }

    // Find matches where seekerTripId is in userTripIds
    // This assumes the user is the seeker (passenger searching for a ride)
    // We should also return the providerTrip details (driver) and seekerTrip details (request)
    const userMatches = await db.query.matches.findMany({
      where: inArray(matches.seekerTripId, userTripIds),
      orderBy: (m, { desc }) => [desc(m.createdAt)]
    });

    // Manually load the relationship data for provider trips (with creator) and seeker trips
    // Since we don't have explicit Drizzle relations defined on the matches table itself, we fetch them manually
    
    const now = new Date();
    const enrichedMatches = (await Promise.all(userMatches.map(async (m) => {
      const providerTrip = await db.query.trips.findFirst({
        where: eq(trips.id, m.providerTripId),
        with: { creator: true }
      });
      const seekerTrip = await db.query.trips.findFirst({
        where: eq(trips.id, m.seekerTripId)
      });
      return { ...m, providerTrip, seekerTrip };
    }))).filter(m => 
      m.providerTrip && 
      m.providerTrip.status !== 'CANCELLED' &&
      new Date(m.providerTrip.departureTime) >= now
    );

    res.json({ matches: enrichedMatches });
  } catch (error) {
    console.error("Error fetching matches:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /api/matches/mark-read - Mark all available matches for the current user as read
router.post("/mark-read", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;

    const userTrips = await db.query.trips.findMany({
      where: eq(trips.userId, userId),
    });

    const userTripIds = userTrips.map(t => t.id);

    if (userTripIds.length > 0) {
      await db.update(matches)
        .set({ isRead: true })
        .where(inArray(matches.seekerTripId, userTripIds));
    }

    res.json({ ok: true });
  } catch (error) {
    console.error("Error marking matches read:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
