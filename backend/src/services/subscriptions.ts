import { db } from "../db/index.js";
import { trips, tripSubscriptions, cities } from "../db/schema.js";
import { eq, and, isNull, lte } from "drizzle-orm";
import { sendSubscriptionTripAlertEmail, sendSubscriptionExpiredEmail } from "../lib/email.js";
import { sendSubscriptionTripNotification } from "./fcm.js";
import { TripType, TripStatus } from "../lib/constants.js";

export const notifySubscribers = async (newTripId: number) => {
  try {
    const trip = await db.query.trips.findFirst({
      where: eq(trips.id, newTripId),
      with: { creator: true },
    });

    if (!trip || trip.type !== TripType.PROVIDER || trip.status !== TripStatus.ACTIVE) return;

    const now = new Date();

    const allSubs = await db.query.tripSubscriptions.findMany({
      where: and(
        eq(tripSubscriptions.originId, trip.originId),
        eq(tripSubscriptions.destinationId, trip.destinationId),
        eq(tripSubscriptions.isActive, true),
      ),
      with: { user: true },
    });

    const validSubs = allSubs.filter(sub => !sub.expiresAt || new Date(sub.expiresAt) > now);

    const [originCity, destCity] = await Promise.all([
      db.query.cities.findFirst({ where: eq(cities.id, trip.originId) }),
      db.query.cities.findFirst({ where: eq(cities.id, trip.destinationId) }),
    ]);

    const originName = originCity?.name || "";
    const destinationName = destCity?.name || "";
    const driverName = trip.creator?.username || "Um condutor";

    for (const sub of validSubs) {
      if (sub.userId === trip.userId || !sub.user) continue;

      if (sub.user.email) {
        sendSubscriptionTripAlertEmail(
          sub.user.email,
          originName,
          destinationName,
          driverName,
          new Date(trip.departureTime),
          trip.availableSeats,
        ).catch(console.error);
      }

      if (sub.user.fcmToken) {
        sendSubscriptionTripNotification(
          sub.user.fcmToken,
          originName,
          destinationName,
          driverName,
        ).catch(console.error);
      }
    }
  } catch (error) {
    console.error("[Subscriptions] Error notifying subscribers:", error);
  }
};

export const processExpiredSubscriptions = async () => {
  try {
    const now = new Date();

    // Fetch all active subscriptions with a non-null expiresAt, filter in JS
    const activeSubs = await db.query.tripSubscriptions.findMany({
      where: eq(tripSubscriptions.isActive, true),
      with: { user: true },
    });

    const expired = activeSubs.filter(sub => sub.expiresAt && new Date(sub.expiresAt) <= now);

    for (const sub of expired) {
      await db.update(tripSubscriptions)
        .set({ isActive: false })
        .where(eq(tripSubscriptions.id, sub.id));

      if (sub.user?.email) {
        // Fetch city names for the email
        const [originCity, destCity] = await Promise.all([
          db.query.cities.findFirst({ where: eq(cities.id, sub.originId) }),
          db.query.cities.findFirst({ where: eq(cities.id, sub.destinationId) }),
        ]);

        sendSubscriptionExpiredEmail(
          sub.user.email,
          originCity?.name || "",
          destCity?.name || "",
        ).catch(console.error);
      }
    }

    if (expired.length > 0) {
      console.log(`[Subscriptions] ${expired.length} subscrição(ões) expirada(s) processada(s).`);
    }
  } catch (error) {
    console.error("[Subscriptions] Erro crítico em processExpiredSubscriptions:", error);
  }
};
