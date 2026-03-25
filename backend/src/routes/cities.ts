import express from "express";
import { db } from "../db/index.js";
import { cities } from "../db/schema.js";
import { eq, desc, asc, sql } from "drizzle-orm";
import { requireAdmin } from "../middleware/auth.js";

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
router.post("/", requireAdmin, async (req, res) => {
  const { name, isOffice, isActive } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }

  try {
    const [city] = await db
      .insert(cities)
      .values({ 
        name, 
        isOffice: !!isOffice, 
        isActive: isActive !== false 
      })
      .onConflictDoUpdate({
        target: cities.name,
        set: { 
          isOffice: !!isOffice, 
          isActive: isActive !== false 
        }
      })
      .returning();
      
    res.json(city);
  } catch (error: any) {
    console.error("Erro a criar/atualizar cidade:", error);
    res.status(500).json({ error: "Failed to create or update city" });
  }
});

export default router;
