import { db } from "../db/index.js";
import { trips, matches, users } from "../db/schema.js";
import { eq, and, gte } from "drizzle-orm";
import { sendMatchFoundEmail } from "./email.js";

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

        // Notifica o passageiro
        const seekerTrip = trip.type === 'NEEDRIDE' ? trip : matchTrip;
        const passenger = await db.query.users.findFirst({
           where: eq(users.id, seekerTrip.userId)
        });
        
        if (passenger && passenger.email) {
            sendMatchFoundEmail(passenger.email, providerTripId).catch(console.error);
        }

        console.log(`[Algorithm] Novo Match: ProviderTrip ${providerTripId} cruzado com SeekerTrip ${seekerTripId}`);
      }
    }

  } catch (error) {
    console.error("Matchmaking background error:", error);
  }
};
