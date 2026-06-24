import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { and, ne, sql } from "drizzle-orm";

export function validatePhone(phone: string): boolean {
  return phone.replace(/\D/g, "").length === 9;
}

export async function validateLicensePlate(plate: string, excludeUserId: string): Promise<boolean> {
  const conflict = await db.query.users.findFirst({
    where: and(
      ne(users.id, excludeUserId),
      sql`JSON_UNQUOTE(JSON_EXTRACT(${users.vehicleInfo}, '$.plate')) LIKE ${plate}`
    ),
    columns: { id: true },
  });
  return !conflict;
}
