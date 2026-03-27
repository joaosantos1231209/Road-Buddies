import { db } from "../db/index.js";
import { trips, matches, users, cities } from "../db/schema.js";
import { eq, and, gte } from "drizzle-orm";
import { sendMatchFoundEmail } from "./email.js";
import { sendMatchNotification } from "./fcm.js";

export const runMatchmaking = async (newTripId: number) => {
  try {
    const trip = await db.query.trips.findFirst({
      where: eq(trips.id, newTripId)
    });

    if (!trip || trip.status !== 'ACTIVE') return;

    const targetType = trip.type === 'PROVIDER' ? 'NEEDRIDE' : 'PROVIDER';

    const compatibleTrips = await db.query.trips.findMany({
      where: and(
        eq(trips.type, targetType),
        eq(trips.originId, trip.originId),
        eq(trips.destinationId, trip.destinationId),
        eq(trips.status, 'ACTIVE'),
        targetType === 'PROVIDER' ? gte(trips.availableSeats, 1) : undefined
      )
    });

    for (const matchTrip of compatibleTrips) {
      const d1 = new Date(trip.departureTime).toDateString();
      const d2 = new Date(matchTrip.departureTime).toDateString();
      
      if (d1 === d2) {
        const providerTripId = trip.type === 'PROVIDER' ? trip.id : matchTrip.id;
        const seekerTripId = trip.type === 'NEEDRIDE' ? trip.id : matchTrip.id;

        await db.insert(matches).values({
          providerTripId,
          seekerTripId,
          status: 'PENDING'
        });

        // Notificações Push & Email
        const providerTrip = trip.type === 'PROVIDER' ? trip : matchTrip;
        const seekerTrip = trip.type === 'NEEDRIDE' ? trip : matchTrip;

        const [pUser, sUser] = await Promise.all([
           db.query.users.findFirst({ where: eq(users.id, providerTrip.userId) }),
           db.query.users.findFirst({ where: eq(users.id, seekerTrip.userId) })
        ]);

        const destCity = await db.query.cities.findFirst({ where: eq(cities.id, providerTrip.destinationId) });
        const tripSummary = `${new Date(providerTrip.departureTime).toLocaleDateString()} p/ ${destCity?.name || 'Destino'}`;

        // Notifica Passageiro (Seeker)
        if (sUser) {
           if (sUser.email) sendMatchFoundEmail(sUser.email, providerTripId).catch(console.error);
           if (sUser.fcmToken) sendMatchNotification(sUser.fcmToken, tripSummary).catch(console.error);
        }

        // Notifica Condutor (Provider) - Opcional, mas útil saber que há novos interessados
        if (pUser && pUser.fcmToken) {
           sendMatchNotification(pUser.fcmToken, tripSummary).catch(console.error);
        }

        console.log(`[Algorithm] Novo Match: ProviderTrip ${providerTripId} cruzado com SeekerTrip ${seekerTripId}`);
      }
    }

  } catch (error) {
    console.error("Matchmaking background error:", error);
  }
};
