import { trips, tripParticipants } from "../db/schema.js";
import { eq, and, inArray, ne, sql } from "drizzle-orm";
import { TripStatus } from "../lib/constants.js";

function getDayRange(date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return { startOfDay, endOfDay };
}

export async function hasCreatorConflict(
  userId: string,
  originId: number,
  destinationId: number,
  departureDate: Date,
  tx: any,
  options?: { onlyType?: string }
): Promise<boolean> {
  const { startOfDay, endOfDay } = getDayRange(departureDate);

  const conditions: any[] = [
    eq(trips.userId, userId),
    eq(trips.originId, originId),
    eq(trips.destinationId, destinationId),
    inArray(trips.status, [TripStatus.ACTIVE, TripStatus.MATCHED]),
    sql`${trips.departureTime} >= ${startOfDay} AND ${trips.departureTime} <= ${endOfDay}`,
  ];

  if (options?.onlyType) {
    conditions.push(eq(trips.type, options.onlyType));
  }

  const existing = await tx.query.trips.findFirst({ where: and(...conditions) });
  return !!existing;
}

export async function hasParticipantConflict(
  userId: string,
  originId: number,
  destinationId: number,
  departureDate: Date,
  tx: any
): Promise<boolean> {
  const { startOfDay, endOfDay } = getDayRange(departureDate);

  const participations = await tx.query.tripParticipants.findMany({
    where: eq(tripParticipants.userId, userId),
    columns: { tripId: true },
  });

  if (participations.length === 0) return false;

  const tripIds = participations.map((p: any) => p.tripId);
  const conflict = await tx.query.trips.findFirst({
    where: and(
      inArray(trips.id, tripIds),
      eq(trips.originId, originId),
      eq(trips.destinationId, destinationId),
      ne(trips.status, TripStatus.CANCELLED),
      sql`${trips.departureTime} >= ${startOfDay} AND ${trips.departureTime} <= ${endOfDay}`
    ),
    columns: { id: true },
  });

  return !!conflict;
}
