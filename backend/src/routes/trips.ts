import { Router } from "express";
import type { Request, Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { db } from "../db/index.js";
import { trips, tripParticipants, matches, users, cities } from "../db/schema.js";
import { eq, and, or, inArray, ne, sql } from "drizzle-orm";
import { runMatchmaking } from "../services/matchmaking.js";
import { sendPassengerJoinedEmail, sendTripCancelledEmail } from "../services/email.js";
import { sendPassengerJoinedNotification, sendTripCancelledNotification } from "../services/fcm.js";

const router = Router();

router.use(requireAuth);

router.post("/", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { type, originId, destinationId, departureTime, availableSeats, vehicleType, tripVehicleDetails } = req.body;
    const userId = req.user.uid;

    if (!originId || !destinationId || !departureTime) {
      res.status(400).json({ error: "Por favor, selecione a origem, o destino e a data da viagem." });
      return;
    }

    if (originId === destinationId) {
      res.status(400).json({ error: "A origem e o destino têm de ser diferentes." });
      return;
    }

    const departureDate = new Date(departureTime);
    const startOfDay = new Date(departureDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(departureDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Check if user already has a trip (created or joined) on the same day with same origin/destination
    // First check created trips
    const existingCreated = await db.query.trips.findFirst({
      where: and(
        eq(trips.userId, userId),
        eq(trips.originId, originId),
        eq(trips.destinationId, destinationId),
        inArray(trips.status, ['ACTIVE', 'MATCHED']),
        sql`${trips.departureTime} >= ${startOfDay} AND ${trips.departureTime} <= ${endOfDay}`
      )
    });

    if (existingCreated) {
       res.status(400).json({ error: "Já tens uma viagem agendada para este trajeto neste dia." });
       return;
    }

    // Then check joined trips
    const myJoins = await db.query.tripParticipants.findMany({
      where: eq(tripParticipants.userId, userId),
      with: { trip: true }
    });

    const conflictingJoin = myJoins.find(p => 
      p.trip.originId === originId && 
      p.trip.destinationId === destinationId && 
      p.trip.status !== 'CANCELLED' &&
      new Date(p.trip.departureTime).toDateString() === departureDate.toDateString()
    );

    if (conflictingJoin) {
       res.status(400).json({ error: "Já tens uma viagem agendada para este trajeto neste dia (como passageiro)." });
       return;
    }

    const newTrip = await db.insert(trips).values({
      userId,
      type,
      originId,
      destinationId,
      departureTime: departureDate,
      availableSeats: type === 'PROVIDER' ? availableSeats : 0,
      vehicleType,
      tripVehicleDetails,
      status: 'ACTIVE'
    }).returning();

    // Trigger em background para cross-matching imediato
    runMatchmaking(newTrip[0]!.id).catch(console.error);

    res.status(201).json({ trip: newTrip[0] });
  } catch (error) {
    console.error("Error creating trip:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const allTrips = await db.query.trips.findMany({
      where: eq(trips.status, 'ACTIVE'),
      with: {
        participants: {
          with: { user: true }
        },
        creator: true
      }
    });
    res.json({ trips: allTrips });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Seat management: Passenger joins a trip
router.post("/:id/join", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tripId = parseInt(req.params.id as string);
    const userId = req.user.uid;

    await db.transaction(async (tx) => {
      const trip = await tx.query.trips.findFirst({
        where: eq(trips.id, tripId)
      });

      if (!trip || trip.availableSeats <= 0 || trip.type !== 'PROVIDER') {
        throw new Error("Viagem indisponível ou esgotada");
      }

      // 0. Check for conflicts (already in a trip for the same route/day)
      const depDate = new Date(trip.departureTime);
      const startOfDay = new Date(depDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(depDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Check if user is creator of a similar PROVIDER trip (cannot be driver and passenger on same route/day)
      const existingCreatedProvider = await tx.query.trips.findFirst({
        where: and(
          eq(trips.userId, userId),
          eq(trips.type, 'PROVIDER'), // Only block if they are the driver of another trip
          eq(trips.originId, trip.originId),
          eq(trips.destinationId, trip.destinationId),
          inArray(trips.status, ['ACTIVE', 'MATCHED']),
          sql`${trips.departureTime} >= ${startOfDay} AND ${trips.departureTime} <= ${endOfDay}`
        )
      });
      if (existingCreatedProvider) {
        throw new Error("Já tens uma viagem agendada para este trajeto neste dia como condutor.");
      }

      // Check if user is already participant in a similar trip
      const myJoins = await tx.query.tripParticipants.findMany({
        where: eq(tripParticipants.userId, userId),
        with: { trip: true }
      });
      const conflictingJoin = myJoins.find(p => 
        p.trip.originId === trip.originId && 
        p.trip.destinationId === trip.destinationId && 
        p.trip.status !== 'CANCELLED' &&
        new Date(p.trip.departureTime).toDateString() === depDate.toDateString()
      );
      if (conflictingJoin) {
        throw new Error("Já tens uma viagem agendada para este trajeto neste dia (como passageiro).");
      }

      const existingJoin = await tx.query.tripParticipants.findFirst({
        where: and(eq(tripParticipants.tripId, tripId), eq(tripParticipants.userId, userId))
      });

      if (existingJoin) {
        throw new Error("Já reservou um lugar nesta viagem.");
      }

      await tx.insert(tripParticipants).values({ tripId, userId });

      await tx.update(trips)
        .set({ availableSeats: trip.availableSeats - 1 })
        .where(eq(trips.id, tripId));

      // Restore: availableSeats is the column name in schema (drizzle-orm handles camelCase if configured, but let's check schema)
      // Actually schema shows availableSeats: integer('available_seats').
      
      await tx.update(trips)
        .set({ status: 'MATCHED', hidden: true })
        .where(
          and(
            eq(trips.userId, userId),
            eq(trips.type, 'NEEDRIDE'),
            eq(trips.originId, trip.originId),
            eq(trips.destinationId, trip.destinationId),
            eq(trips.status, 'ACTIVE')
          )
        );

      // 1. Identify all seeker trips of this user for this route
      const seekerTripsToHide = await tx.query.trips.findMany({
        where: and(
          eq(trips.userId, userId),
          eq(trips.type, 'NEEDRIDE'),
          eq(trips.originId, trip.originId),
          eq(trips.destinationId, trip.destinationId)
        )
      });

      for (const st of seekerTripsToHide) {
        // Mark the match with this provider as ACCEPTED
        await tx.update(matches)
          .set({ status: 'ACCEPTED', isRead: true })
          .where(and(eq(matches.providerTripId, tripId), eq(matches.seekerTripId, st.id)));
          
        // Mark OTHER matches for these seeker trips as isRead=true to clear them from matches list
        await tx.update(matches)
          .set({ isRead: true })
          .where(and(eq(matches.seekerTripId, st.id), ne(matches.providerTripId, tripId)));
      }
    });

    // Notify Driver
    const tripWithDriverAndCities = await db.query.trips.findFirst({
      where: eq(trips.id, tripId),
      with: { creator: true }
    });
    
    const passenger = await db.query.users.findFirst({ where: eq(users.id, userId) });
    const originCity = await db.query.cities.findFirst({ where: eq(cities.id, tripWithDriverAndCities!.originId) });
    const destCity = await db.query.cities.findFirst({ where: eq(cities.id, tripWithDriverAndCities!.destinationId) });
    
    if (tripWithDriverAndCities?.creator?.email) {
      const tripInfoStr = `${originCity?.name} -> ${destCity?.name} (${new Date(tripWithDriverAndCities.departureTime).toLocaleDateString()})`;
      sendPassengerJoinedEmail(tripWithDriverAndCities.creator.email, passenger?.username || "Um colaborador", tripInfoStr).catch(console.error);
    }
    
    // Notify Driver via Push
    if (tripWithDriverAndCities?.creator?.fcmToken) {
      const tripInfoStr = `${originCity?.name} -> ${destCity?.name} (${new Date(tripWithDriverAndCities.departureTime).toLocaleDateString()})`;
      sendPassengerJoinedNotification(tripWithDriverAndCities.creator.fcmToken, passenger?.username || "Um colaborador", tripInfoStr).catch(console.error);
    }

    res.json({ message: "Juntou-se à viagem com sucesso" });
  } catch (error: any) {
    console.error("DEBUG JOIN ERROR:", error.message);
    res.status(400).json({ error: error.message });
  }
});

// Leave a trip
router.post("/:id/leave", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tripId = parseInt(req.params.id as string);
    const userId = req.user.uid;

    await db.transaction(async (tx) => {
      const trip = await tx.query.trips.findFirst({
        where: eq(trips.id, tripId)
      });

      if (!trip) {
        throw new Error("Viagem não encontrada");
      }

      const existingJoin = await tx.query.tripParticipants.findFirst({
        where: and(eq(tripParticipants.tripId, tripId), eq(tripParticipants.userId, userId))
      });

      if (!existingJoin) {
        throw new Error("Não tem reserva nesta viagem.");
      }

      await tx.delete(tripParticipants)
        .where(
          and(
            eq(tripParticipants.tripId, tripId),
            eq(tripParticipants.userId, userId)
          )
        );

      await tx.update(trips)
        .set({ availableSeats: trip.availableSeats + 1 })
        .where(eq(trips.id, tripId));

      const userTripsQuery = await tx.query.trips.findMany({ 
        where: and(
          eq(trips.userId, userId),
          eq(trips.type, 'NEEDRIDE'),
          eq(trips.status, 'MATCHED')
        ) 
      });
      const userTripIds = userTripsQuery.map(t => t.id);

      if (userTripIds.length > 0) {
        await tx.update(matches)
          .set({ status: 'PENDING' })
          .where(and(eq(matches.providerTripId, tripId), inArray(matches.seekerTripId, userTripIds)));

        await tx.update(trips)
          .set({ hidden: false, status: 'ACTIVE' })
          .where(inArray(trips.id, userTripIds));
      }
    });

    res.json({ message: "Reserva cancelada com sucesso" });
  } catch (error: any) {
    console.error("Leave Trip Error:", error);
    res.status(400).json({ error: error.message });
  }
});

// Cancel a created trip
router.delete("/:id", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tripId = parseInt(req.params.id as string);
    const userId = req.user.uid;

    await db.transaction(async (tx) => {
      const trip = await tx.query.trips.findFirst({
        where: and(eq(trips.id, tripId), eq(trips.userId, userId)),
        with: {
          participants: { with: { user: true } },
          creator: true
        }
      });

      if (!trip) {
        throw new Error("Viagem não encontrada ou sem permissão");
      }

      // Mark trip as CANCELLED
      await tx.update(trips).set({ status: 'CANCELLED' }).where(eq(trips.id, tripId));

      // 1. If provider, restore matching SEEKER trips for all participants
      if (trip.type === 'PROVIDER') {
        for (const p of trip.participants) {
          const restored = await tx.update(trips)
            .set({ status: 'ACTIVE', hidden: false })
            .where(
              and(
                eq(trips.userId, p.userId),
                eq(trips.type, 'NEEDRIDE'),
                eq(trips.status, 'MATCHED'),
                eq(trips.originId, trip.originId),
                eq(trips.destinationId, trip.destinationId)
              )
            ).returning();
          
          if (restored.length > 0) {
            runMatchmaking(restored[0]!.id).catch(console.error);
          }
        }
      }

      // 2. Clear notifications (mark matches as read for everyone involved)
      await tx.update(matches)
        .set({ isRead: true })
        .where(
          or(
            eq(matches.providerTripId, tripId),
            eq(matches.seekerTripId, tripId)
          )
        );

      // 3. Clear pending matches
      await tx.delete(matches).where(
        and(
          or(eq(matches.providerTripId, tripId), eq(matches.seekerTripId, tripId)),
          eq(matches.status, 'PENDING')
        )
      );

      // 4. Notify participants
      const originCity = await tx.query.cities.findFirst({ where: eq(cities.id, trip.originId) });
      const destCity = await tx.query.cities.findFirst({ where: eq(cities.id, trip.destinationId) });
      const tripInfoStr = `${originCity?.name} -> ${destCity?.name} (${new Date(trip.departureTime).toLocaleDateString('pt-PT')})`;

      for (const p of trip.participants) {
        if (p.user?.email) {
          sendTripCancelledEmail(p.user.email, trip.creator?.username || "O condutor", tripInfoStr).catch(console.error);
        }
        if (p.user?.fcmToken) {
          sendTripCancelledNotification(p.user.fcmToken, trip.creator?.username || "O condutor", tripInfoStr).catch(console.error);
        }
      }
    });

    res.json({ message: "Viagem cancelada com sucesso" });
  } catch (error: any) {
    console.error("Cancel Trip Error:", error);
    res.status(400).json({ error: error.message });
  }
});

export default router;
