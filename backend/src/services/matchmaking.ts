import { db } from "../db/index.js";
import { trips, matches, users, cities } from "../db/schema.js";
import { eq, and, gte } from "drizzle-orm";
import { sendMatchFoundEmail } from "../lib/email.js";
import { sendMatchNotification } from "./fcm.js";
import { TripType, TripStatus, MatchStatus } from "../lib/constants.js";

export const runMatchmaking = async (newTripId: number) => {
  try {
    const trip = await db.query.trips.findFirst({ where: eq(trips.id, newTripId) });

    if (!trip || trip.status !== TripStatus.ACTIVE) return;

    const targetType = trip.type === TripType.PROVIDER ? TripType.NEEDRIDE : TripType.PROVIDER;

    const compatibleTrips = await db.query.trips.findMany({
      where: and(
        eq(trips.type, targetType),
        eq(trips.originId, trip.originId),
        eq(trips.destinationId, trip.destinationId),
        eq(trips.status, TripStatus.ACTIVE),
        targetType === TripType.PROVIDER ? gte(trips.availableSeats, 1) : undefined
      ),
    });

    for (const matchTrip of compatibleTrips) {
      const d1 = new Date(trip.departureTime).toDateString();
      const d2 = new Date(matchTrip.departureTime).toDateString();

      if (d1 !== d2) continue;

      const providerTripId = trip.type === TripType.PROVIDER ? trip.id : matchTrip.id;
      const seekerTripId = trip.type === TripType.NEEDRIDE ? trip.id : matchTrip.id;

      await db.insert(matches).values({ providerTripId, seekerTripId, status: MatchStatus.PENDING });

      const providerTrip = trip.type === TripType.PROVIDER ? trip : matchTrip;
      const seekerTrip = trip.type === TripType.NEEDRIDE ? trip : matchTrip;

      const [sUser, destCity] = await Promise.all([
        db.query.users.findFirst({ where: eq(users.id, seekerTrip.userId) }),
        db.query.cities.findFirst({ where: eq(cities.id, providerTrip.destinationId) }),
      ]);

      const tripSummary = `${new Date(providerTrip.departureTime).toLocaleDateString()} p/ ${destCity?.name || 'Destino'}`;

      if (sUser?.email) sendMatchFoundEmail(sUser.email, providerTripId).catch(console.error);
      if (sUser?.fcmToken) sendMatchNotification(sUser.fcmToken, tripSummary).catch(console.error);

      console.log(`[Algorithm] Novo Match: ProviderTrip ${providerTripId} cruzado com SeekerTrip ${seekerTripId}`);
    }
  } catch (error) {
    console.error("Matchmaking background error:", error);
  }
};
