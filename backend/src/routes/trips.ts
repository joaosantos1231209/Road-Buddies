import { Router } from "express";
import type { Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { db } from "../db/index.js";
import { trips, tripParticipants, matches, users, cities, companyVehicles } from "../db/schema.js";
import { eq, and, or, inArray, ne, desc, sql } from "drizzle-orm";
import { runMatchmaking } from "../services/matchmaking.js";
import { notifySubscribers } from "../services/subscriptions.js";
import { sendPassengerJoinedEmail, sendTripCancelledEmail } from "../lib/email.js";
import { sendPassengerJoinedNotification, sendTripCancelledNotification } from "../services/fcm.js";
import { hasCreatorConflict, hasParticipantConflict } from "../services/trips.js";
import { TripType, TripStatus, MatchStatus } from "../lib/constants.js";
import { validateBody, parseIntParam, createTripSchema, editTripSchema, errorMessage } from "../lib/validate.js";

const router = Router();

router.use(requireAuth);

router.post("/", validateBody(createTripSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { type, originId, destinationId, departureTime, returnTime, availableSeats, vehicleType, tripVehicleDetails, companyVehicleId } = req.body;
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

    if (await hasCreatorConflict(userId, originId, destinationId, departureDate, db)) {
      res.status(400).json({ error: "Já tens uma viagem agendada para este trajeto neste dia." });
      return;
    }

    if (await hasParticipantConflict(userId, originId, destinationId, departureDate, db)) {
      res.status(400).json({ error: "Já tens uma viagem agendada para este trajeto neste dia (como passageiro)." });
      return;
    }

    let resolvedVehicleDetails = tripVehicleDetails ?? null;
    let returnDate: Date | null = null;

    if (type === TripType.PROVIDER) {
      if (!companyVehicleId && (!tripVehicleDetails || tripVehicleDetails === 'null' || tripVehicleDetails === '{}')) {
        res.status(400).json({ error: "Tens de ter um carro pessoal associado ou escolher uma viatura da empresa para oferecer boleia." });
        return;
      }

      if (companyVehicleId) {
      if (!returnTime) {
        res.status(400).json({ error: "A data de retorno é obrigatória quando se usa viatura da empresa." });
        return;
      }

      returnDate = new Date(returnTime);
      if (isNaN(returnDate.getTime()) || returnDate < departureDate) {
        res.status(400).json({ error: "A data de retorno tem de ser igual ou posterior à data de partida." });
        return;
      }

      const vehicle = await db.query.companyVehicles.findFirst({
        where: and(eq(companyVehicles.id, companyVehicleId), eq(companyVehicles.isActive, true)),
      });

      if (!vehicle) {
        res.status(400).json({ error: "Veículo da empresa não encontrado ou inativo." });
        return;
      }

      const rangeStart = new Date(departureDate); rangeStart.setHours(0, 0, 0, 0);
      const rangeEnd = new Date(returnDate); rangeEnd.setHours(23, 59, 59, 999);

      const vehicleConflict = await db.query.trips.findFirst({
        where: and(
          eq(trips.companyVehicleId, companyVehicleId),
          inArray(trips.status, [TripStatus.ACTIVE, TripStatus.MATCHED]),
          sql`${trips.departureTime} <= ${rangeEnd} AND ${trips.returnTime} >= ${rangeStart}`,
        ),
        columns: { id: true },
      });

      if (vehicleConflict) {
        res.status(400).json({ error: "Este veículo já está ocupado nesse período." });
        return;
      }

      resolvedVehicleDetails = JSON.stringify({ brand: `${vehicle.brand} ${vehicle.model}`, plate: vehicle.plate });
    }
    }

    const insertResult = await db.insert(trips).values({
      userId,
      type,
      originId,
      destinationId,
      departureTime: departureDate,
      returnTime: returnDate,
      availableSeats: type === TripType.PROVIDER ? availableSeats : 0,
      vehicleType,
      tripVehicleDetails: resolvedVehicleDetails,
      companyVehicleId: (type === TripType.PROVIDER && companyVehicleId) ? companyVehicleId : null,
      status: TripStatus.ACTIVE,
    });
    const newTripId = (insertResult as any)[0]?.insertId;
    const newTrip = await db.query.trips.findFirst({ where: eq(trips.id, newTripId) });

    runMatchmaking(newTrip!.id).catch(console.error);

    if (type === TripType.PROVIDER) {
      notifySubscribers(newTrip!.id).catch(console.error);
    }

    res.status(201).json({ trip: newTrip });
  } catch (error) {
    console.error("Error creating trip:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 200);
    const offset = parseInt(req.query.offset as string) || 0;
    const allTrips = await db.query.trips.findMany({
      where: inArray(trips.status, [TripStatus.ACTIVE, TripStatus.MATCHED, TripStatus.CANCELLED]),
      with: {
        participants: { with: { user: true } },
        creator: true,
      },
      orderBy: [desc(trips.departureTime)],
      limit,
      offset,
    });
    res.json({ trips: allTrips, limit, offset });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/:id/join", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tripId = parseIntParam(req.params.id);
    if (!tripId) { res.status(400).json({ error: "ID de viagem inválido" }); return; }
    const userId = req.user.uid;

    await db.transaction(async (tx) => {
      const trip = await tx.query.trips.findFirst({ where: eq(trips.id, tripId) });

      if (!trip || trip.availableSeats <= 0 || trip.type !== TripType.PROVIDER) {
        throw new Error("Viagem indisponível ou esgotada");
      }

      const depDate = new Date(trip.departureTime);

      if (await hasCreatorConflict(userId, trip.originId, trip.destinationId, depDate, tx, { onlyType: TripType.PROVIDER })) {
        throw new Error("Já tens uma viagem agendada para este trajeto neste dia como condutor.");
      }

      if (await hasParticipantConflict(userId, trip.originId, trip.destinationId, depDate, tx)) {
        throw new Error("Já tens uma viagem agendada para este trajeto neste dia (como passageiro).");
      }

      const existingJoin = await tx.query.tripParticipants.findFirst({
        where: and(eq(tripParticipants.tripId, tripId), eq(tripParticipants.userId, userId)),
      });

      if (existingJoin) throw new Error("Já reservou um lugar nesta viagem.");

      await tx.insert(tripParticipants).values({ tripId, userId });
      await tx.update(trips).set({ availableSeats: trip.availableSeats - 1 }).where(eq(trips.id, tripId));

      await tx.update(trips)
        .set({ status: TripStatus.MATCHED, hidden: true })
        .where(and(
          eq(trips.userId, userId),
          eq(trips.type, TripType.NEEDRIDE),
          eq(trips.originId, trip.originId),
          eq(trips.destinationId, trip.destinationId),
          eq(trips.status, TripStatus.ACTIVE),
        ));

      const seekerTripsToHide = await tx.query.trips.findMany({
        where: and(
          eq(trips.userId, userId),
          eq(trips.type, TripType.NEEDRIDE),
          eq(trips.originId, trip.originId),
          eq(trips.destinationId, trip.destinationId),
        ),
      });

      for (const st of seekerTripsToHide) {
        await tx.update(matches)
          .set({ status: MatchStatus.ACCEPTED, isRead: true })
          .where(and(eq(matches.providerTripId, tripId), eq(matches.seekerTripId, st.id)));

        await tx.update(matches)
          .set({ isRead: true })
          .where(and(eq(matches.seekerTripId, st.id), eq(matches.providerTripId, tripId)));
      }
    });

    const [tripWithDriver, passenger, originCity, destCity] = await Promise.all([
      db.query.trips.findFirst({ where: eq(trips.id, tripId), with: { creator: true } }),
      db.query.users.findFirst({ where: eq(users.id, userId) }),
      db.query.trips.findFirst({ where: eq(trips.id, tripId) }).then(t =>
        t ? db.query.cities.findFirst({ where: eq(cities.id, t.originId) }) : null
      ),
      db.query.trips.findFirst({ where: eq(trips.id, tripId) }).then(t =>
        t ? db.query.cities.findFirst({ where: eq(cities.id, t.destinationId) }) : null
      ),
    ]);

    if (tripWithDriver?.creator) {
      const tripInfoStr = `${originCity?.name} -> ${destCity?.name} (${new Date(tripWithDriver.departureTime).toLocaleDateString()})`;
      const passengerName = passenger?.username || "Um colaborador";
      if (tripWithDriver.creator.email) {
        sendPassengerJoinedEmail(tripWithDriver.creator.email, passengerName, tripInfoStr).catch(console.error);
      }
      if (tripWithDriver.creator.fcmToken) {
        sendPassengerJoinedNotification(tripWithDriver.creator.fcmToken, passengerName, tripInfoStr).catch(console.error);
      }
    }

    res.json({ message: "Juntou-se à viagem com sucesso" });
  } catch (error: unknown) {
    res.status(400).json({ error: errorMessage(error) });
  }
});

router.post("/:id/leave", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tripId = parseIntParam(req.params.id);
    if (!tripId) { res.status(400).json({ error: "ID de viagem inválido" }); return; }
    const userId = req.user.uid;

    await db.transaction(async (tx) => {
      const trip = await tx.query.trips.findFirst({ where: eq(trips.id, tripId) });
      if (!trip) throw new Error("Viagem não encontrada");

      const existingJoin = await tx.query.tripParticipants.findFirst({
        where: and(eq(tripParticipants.tripId, tripId), eq(tripParticipants.userId, userId)),
      });
      if (!existingJoin) throw new Error("Não tem reserva nesta viagem.");

      await tx.delete(tripParticipants).where(
        and(eq(tripParticipants.tripId, tripId), eq(tripParticipants.userId, userId))
      );

      await tx.update(trips).set({ availableSeats: trip.availableSeats + 1 }).where(eq(trips.id, tripId));

      const userNeedRideTrips = await tx.query.trips.findMany({
        where: and(
          eq(trips.userId, userId),
          eq(trips.type, TripType.NEEDRIDE),
          eq(trips.status, TripStatus.MATCHED),
        ),
      });
      const userTripIds = userNeedRideTrips.map(t => t.id);

      if (userTripIds.length > 0) {
        await tx.update(matches)
          .set({ status: MatchStatus.PENDING })
          .where(and(eq(matches.providerTripId, tripId), inArray(matches.seekerTripId, userTripIds)));

        await tx.update(trips)
          .set({ hidden: false, status: TripStatus.ACTIVE })
          .where(inArray(trips.id, userTripIds));
      }
    });

    res.json({ message: "Reserva cancelada com sucesso" });
  } catch (error: unknown) {
    console.error("Leave Trip Error:", error);
    res.status(400).json({ error: errorMessage(error) });
  }
});

router.patch("/:id", validateBody(editTripSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tripId = parseIntParam(req.params.id);
    if (!tripId) { res.status(400).json({ error: "ID de viagem inválido" }); return; }
    const userId = req.user.uid;

    const trip = await db.query.trips.findFirst({
      where: and(eq(trips.id, tripId), eq(trips.userId, userId)),
      with: { participants: true },
    });

    if (!trip) { res.status(404).json({ error: "Viagem não encontrada ou sem permissão" }); return; }
    if (trip.status === TripStatus.CANCELLED) { res.status(400).json({ error: "Não é possível editar uma viagem cancelada." }); return; }
    if (trip.type !== TripType.PROVIDER) { res.status(400).json({ error: "Apenas viagens de condutor podem ser editadas." }); return; }

    const { availableSeats, vehicleType, tripVehicleDetails, companyVehicleId, returnTime } = req.body;

    const participantCount = trip.participants.length;
    if (availableSeats !== undefined && availableSeats < 0) {
      res.status(400).json({ error: `Não é possível reduzir os lugares abaixo do número de passageiros já reservados (${participantCount}).` });
      return;
    }

    let resolvedVehicleDetails: string | null = trip.tripVehicleDetails;
    let resolvedCompanyVehicleId: number | null = trip.companyVehicleId;
    let resolvedReturnTime: Date | null = trip.returnTime ? new Date(trip.returnTime) : null;

    if (companyVehicleId === null) {
      resolvedCompanyVehicleId = null;
      resolvedReturnTime = null;
      resolvedVehicleDetails = tripVehicleDetails ?? null;
    } else if (companyVehicleId !== undefined) {
      if (!returnTime) { res.status(400).json({ error: "A data de retorno é obrigatória para viatura da empresa." }); return; }

      const departureDate = new Date(trip.departureTime);
      const returnDate = new Date(returnTime);
      if (isNaN(returnDate.getTime()) || returnDate < departureDate) {
        res.status(400).json({ error: "A data de retorno tem de ser igual ou posterior à data de partida." });
        return;
      }

      const vehicle = await db.query.companyVehicles.findFirst({
        where: and(eq(companyVehicles.id, companyVehicleId), eq(companyVehicles.isActive, true)),
      });
      if (!vehicle) { res.status(400).json({ error: "Veículo da empresa não encontrado ou inativo." }); return; }

      const rangeStart = new Date(departureDate); rangeStart.setHours(0, 0, 0, 0);
      const rangeEnd = new Date(returnDate); rangeEnd.setHours(23, 59, 59, 999);

      const vehicleConflict = await db.query.trips.findFirst({
        where: and(
          eq(trips.companyVehicleId, companyVehicleId),
          inArray(trips.status, [TripStatus.ACTIVE, TripStatus.MATCHED]),
          sql`${trips.departureTime} <= ${rangeEnd} AND ${trips.returnTime} >= ${rangeStart}`,
          ne(trips.id, tripId),
        ),
        columns: { id: true },
      });
      if (vehicleConflict) { res.status(400).json({ error: "Este veículo já está ocupado nesse período." }); return; }

      resolvedCompanyVehicleId = companyVehicleId;
      resolvedReturnTime = returnDate;
      resolvedVehicleDetails = JSON.stringify({ brand: `${vehicle.brand} ${vehicle.model}`, plate: vehicle.plate });
    } else if (trip.companyVehicleId && returnTime !== undefined) {
      const departureDate = new Date(trip.departureTime);
      const returnDate = new Date(returnTime);
      if (isNaN(returnDate.getTime()) || returnDate < departureDate) {
        res.status(400).json({ error: "A data de retorno tem de ser igual ou posterior à data de partida." });
        return;
      }

      const rangeStart = new Date(departureDate); rangeStart.setHours(0, 0, 0, 0);
      const rangeEnd = new Date(returnDate); rangeEnd.setHours(23, 59, 59, 999);

      const vehicleConflict = await db.query.trips.findFirst({
        where: and(
          eq(trips.companyVehicleId, trip.companyVehicleId),
          inArray(trips.status, [TripStatus.ACTIVE, TripStatus.MATCHED]),
          sql`${trips.departureTime} <= ${rangeEnd} AND ${trips.returnTime} >= ${rangeStart}`,
          ne(trips.id, tripId),
        ),
        columns: { id: true },
      });
      if (vehicleConflict) { res.status(400).json({ error: "O veículo já está ocupado nesse período." }); return; }

      resolvedReturnTime = returnDate;
    }

    await db.update(trips).set({
      availableSeats: availableSeats ?? trip.availableSeats,
      vehicleType: vehicleType ?? trip.vehicleType,
      tripVehicleDetails: resolvedVehicleDetails,
      companyVehicleId: resolvedCompanyVehicleId,
      returnTime: resolvedReturnTime,
      updatedAt: new Date(),
    }).where(eq(trips.id, tripId));

    const updated = await db.query.trips.findFirst({
      where: eq(trips.id, tripId),
      with: { participants: { with: { user: true } }, creator: true },
    });

    res.json({ trip: updated });
  } catch (error) {
    console.error("Edit Trip Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:id", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tripId = parseIntParam(req.params.id);
    if (!tripId) { res.status(400).json({ error: "ID de viagem inválido" }); return; }
    const userId = req.user.uid;

    const restoredTripIds: number[] = [];

    await db.transaction(async (tx) => {
      const trip = await tx.query.trips.findFirst({
        where: and(eq(trips.id, tripId), eq(trips.userId, userId)),
        with: {
          participants: { with: { user: true } },
          creator: true,
        },
      });

      if (!trip) throw new Error("Viagem não encontrada ou sem permissão");

      await tx.update(trips).set({ status: TripStatus.CANCELLED, companyVehicleId: null }).where(eq(trips.id, tripId));

      if (trip.type === TripType.PROVIDER) {
        for (const p of trip.participants) {
          // First find the trips that match, then update them
          const matchingTrips = await tx.query.trips.findMany({
            where: and(
              eq(trips.userId, p.userId),
              eq(trips.type, TripType.NEEDRIDE),
              eq(trips.status, TripStatus.MATCHED),
              eq(trips.originId, trip.originId),
              eq(trips.destinationId, trip.destinationId),
            ),
            columns: { id: true },
          });

          if (matchingTrips.length > 0) {
            const matchingIds = matchingTrips.map(t => t.id);
            await tx.update(trips)
              .set({ status: TripStatus.ACTIVE, hidden: false })
              .where(inArray(trips.id, matchingIds));

            restoredTripIds.push(...matchingIds);
          }
        }
      }

      await tx.update(matches)
        .set({ isRead: true })
        .where(or(eq(matches.providerTripId, tripId), eq(matches.seekerTripId, tripId)));

      await tx.delete(matches).where(
        and(
          or(eq(matches.providerTripId, tripId), eq(matches.seekerTripId, tripId)),
          eq(matches.status, MatchStatus.PENDING),
        )
      );

      const [originCity, destCity] = await Promise.all([
        tx.query.cities.findFirst({ where: eq(cities.id, trip.originId) }),
        tx.query.cities.findFirst({ where: eq(cities.id, trip.destinationId) }),
      ]);
      const tripInfoStr = `${originCity?.name} -> ${destCity?.name} (${new Date(trip.departureTime).toLocaleDateString('pt-PT')})`;
      const driverName = trip.creator?.username || "O condutor";

      for (const p of trip.participants) {
        if (p.user?.email) sendTripCancelledEmail(p.user.email, driverName, tripInfoStr).catch(console.error);
        if (p.user?.fcmToken) sendTripCancelledNotification(p.user.fcmToken, driverName, tripInfoStr).catch(console.error);
      }
    });

    for (const id of restoredTripIds) {
      runMatchmaking(id).catch(console.error);
    }

    res.json({ message: "Viagem cancelada com sucesso" });
  } catch (error: unknown) {
    console.error("Cancel Trip Error:", error);
    res.status(400).json({ error: errorMessage(error) });
  }
});

export default router;
