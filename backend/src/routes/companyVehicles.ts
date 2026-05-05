import { Router } from "express";
import type { Response } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { db } from "../db/index.js";
import { companyVehicles, trips, cities, users } from "../db/schema.js";
import { eq, and, inArray, sql } from "drizzle-orm";
import { validateBody, parseIntParam, createCompanyVehicleSchema, errorMessage } from "../lib/validate.js";
import { isValidLicensePlate } from "../lib/utils.js";
import { TripStatus } from "../lib/constants.js";

const router = Router();

router.use(requireAuth);

router.get("/", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const fromParam = req.query.from as string | undefined;
    const toParam = req.query.to as string | undefined;

    let includeAll = false;
    if (req.query.all === "true") {
      const [dbUser] = await db.select({ isAdmin: users.isAdmin }).from(users).where(eq(users.id, req.user.uid)).limit(1);
      includeAll = dbUser?.isAdmin === true;
    }

    const vehicles = await db.query.companyVehicles.findMany({
      where: includeAll ? undefined : eq(companyVehicles.isActive, true),
      with: { office: true },
      orderBy: companyVehicles.id,
    });

    if (!fromParam || !toParam) {
      res.json(vehicles.map(v => ({ ...v, available: true })));
      return;
    }

    const from = new Date(fromParam);
    const to = new Date(toParam);

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      res.status(400).json({ error: "Datas inválidas" });
      return;
    }

    // Start of departure day and end of return day
    const rangeStart = new Date(from); rangeStart.setUTCHours(0, 0, 0, 0);
    const rangeEnd = new Date(to); rangeEnd.setUTCHours(23, 59, 59, 999);

    const vehicleIds = vehicles.map(v => v.id);
    const occupiedIds = new Set<number>();

    if (vehicleIds.length > 0) {
      // Overlap: existing trip's [departureTime, returnTime] overlaps [rangeStart, rangeEnd]
      // Condition: departureTime <= rangeEnd AND returnTime >= rangeStart
      const occupiedTrips = await db
        .select({ companyVehicleId: trips.companyVehicleId })
        .from(trips)
        .where(and(
          inArray(trips.companyVehicleId, vehicleIds),
          inArray(trips.status, [TripStatus.ACTIVE, TripStatus.MATCHED]),
          sql`${trips.departureTime} <= ${rangeEnd} AND ${trips.returnTime} >= ${rangeStart}`,
        ));

      for (const t of occupiedTrips) {
        if (t.companyVehicleId !== null) occupiedIds.add(t.companyVehicleId);
      }
    }

    res.json(vehicles.map(v => ({ ...v, available: !occupiedIds.has(v.id) })));
  } catch (error) {
    console.error("Error fetching company vehicles:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", requireAdmin, validateBody(createCompanyVehicleSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { brand, model, plate, officeId } = req.body;

    if (!isValidLicensePlate(plate)) {
      res.status(400).json({ error: "Matrícula inválida. Use o formato XX-XX-XX." });
      return;
    }

    const office = await db.query.cities.findFirst({
      where: and(eq(cities.id, officeId), eq(cities.isOffice, true), eq(cities.isActive, true)),
    });

    if (!office) {
      res.status(400).json({ error: "Escritório inválido ou inativo." });
      return;
    }

    const [vehicle] = await db.insert(companyVehicles).values({ brand, model, plate: plate.toUpperCase(), officeId }).returning();
    res.status(201).json(vehicle);
  } catch (error: any) {
    if (error?.code === "23505") {
      res.status(400).json({ error: "Já existe um veículo com esta matrícula." });
      return;
    }
    console.error("Error creating company vehicle:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:id", requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const vehicleId = parseIntParam(req.params.id);
    if (!vehicleId) { res.status(400).json({ error: "ID de veículo inválido" }); return; }

    const existing = await db.query.companyVehicles.findFirst({ where: eq(companyVehicles.id, vehicleId) });
    if (!existing) { res.status(404).json({ error: "Veículo não encontrado" }); return; }

    await db.update(companyVehicles).set({ isActive: false }).where(eq(companyVehicles.id, vehicleId));
    res.json({ message: "Veículo removido com sucesso" });
  } catch (error) {
    console.error("Error deleting company vehicle:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.patch("/:id/restore", requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const vehicleId = parseIntParam(req.params.id);
    if (!vehicleId) { res.status(400).json({ error: "ID de veículo inválido" }); return; }

    const existing = await db.query.companyVehicles.findFirst({ where: eq(companyVehicles.id, vehicleId) });
    if (!existing) { res.status(404).json({ error: "Veículo não encontrado" }); return; }
    if (existing.isActive) { res.status(400).json({ error: "Veículo já está ativo" }); return; }

    await db.update(companyVehicles).set({ isActive: true }).where(eq(companyVehicles.id, vehicleId));
    res.json({ message: "Veículo reativado com sucesso" });
  } catch (error) {
    console.error("Error restoring company vehicle:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
