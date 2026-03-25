import express from "express";
import { db } from "../db/index.js";
import { cities } from "../db/schema.js";
import { eq, desc, asc, sql } from "drizzle-orm";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const allCities = await db
      .select()
      .from(cities)
      .where(eq(cities.isActive, true))
      .orderBy(desc(cities.isOffice), asc(cities.name));
    
    res.json(allCities);
  } catch (error: any) {
    console.error("Erro a buscar cidades:", error);
    res.status(500).json({ error: "Failed to fetch cities" });
  }
});

// Admin ONLY: add or edit city
router.post("/", async (req, res) => {
  // Simplification for now, rely on frontend UI to pass correctly
  const { name, isOffice, isActive } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }

  try {
    // Check if city exists (case-insensitive)
    const existing = await db
      .select()
      .from(cities)
      .where(sql`lower(${cities.name}) = lower(${name})`)
      .limit(1);

    if (existing.length > 0) {
      return res.status(400).json({ error: "Esta cidade já se encontra registada." });
    }

    const [city] = await db
      .insert(cities)
      .values({ name, isOffice: !!isOffice, isActive: isActive !== false })
      .returning();
      
    res.json(city);
  } catch (error: any) {
    console.error("Erro a criar cidade:", error);
    res.status(500).json({ error: "Failed to create city" });
  }
});

export default router;
