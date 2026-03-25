import express from "express";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";

const router = express.Router();

// GET all users (Admin only)
router.get("/", requireAdmin, async (req, res) => {
  try {
    const allUsers = await db.select().from(users);
    res.json(allUsers);
  } catch (error: any) {
    console.error("Erro ao buscar users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Approve or Unapprove a user
router.put("/:id/verify", requireAdmin, async (req, res) => {
  const { isVerified } = req.body;
  try {
    const [updatedUser] = await db
      .update(users)
      .set({ isVerified: !!isVerified })
      .where(eq(users.id, req.params.id as string))
      .returning();
      
    if (!updatedUser) return res.status(404).json({ error: "User not found" });
    res.json(updatedUser);
  } catch (error: any) {
    console.error("Erro atualizar user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// Make or Remove Admin
router.put("/:id/admin", requireAdmin, async (req, res) => {
  const { isAdmin } = req.body;
  try {
    const [updatedUser] = await db
      .update(users)
      .set({ isAdmin: !!isAdmin })
      .where(eq(users.id, req.params.id as string))
      .returning();
      
    if (!updatedUser) return res.status(404).json({ error: "User not found" });
    res.json(updatedUser);
  } catch (error: any) {
    console.error("Erro atualizar admin:", error);
    res.status(500).json({ error: "Failed to update admin" });
  }
});

// Update own profile
router.put("/profile", requireAuth, async (req: AuthenticatedRequest, res) => {
  const { username, phone, vehicleInfo } = req.body;
  const userId = req.user.uid;

  try {
    // Validate phone: must be exactly 9 digits
    if (phone && phone.trim() !== '') {
      const phoneDigits = phone.replace(/\D/g, '');
      if (phoneDigits.length !== 9) {
        return res.status(400).json({ error: "O telemóvel deve ter exactamente 9 dígitos." });
      }

      const phoneExists = await db.query.users.findFirst({
        where: (u, { eq, and, ne }) => and(eq(u.phone, phone.trim()), ne(u.id, userId))
      });
      if (phoneExists) {
        return res.status(400).json({ error: "Este número de telemóvel já está em uso." });
      }
    }

    // Validate username uniqueness
    if (username && username.trim() !== '') {
      const nameExists = await db.query.users.findFirst({
        where: (u, { eq, and, ne }) => and(eq(u.username, username.trim()), ne(u.id, userId))
      });
      if (nameExists) {
        return res.status(400).json({ error: "Este nome já está em uso por outro colaborador." });
      }
    }

    // Validate license plate uniqueness (extract plate from vehicleInfo JSON)
    if (vehicleInfo && vehicleInfo.trim() !== '') {
      try {
        const vObj = JSON.parse(vehicleInfo);
        const plate = vObj?.plate?.trim();
        if (plate && plate !== '') {
          const allUsers = await db.query.users.findMany();
          const plateConflict = allUsers.find(u => {
            if (u.id === userId || !u.vehicleInfo) return false;
            try {
              const pObj = JSON.parse(u.vehicleInfo);
              return pObj?.plate?.trim().toUpperCase() === plate.toUpperCase();
            } catch { return false; }
          });
          if (plateConflict) {
            return res.status(400).json({ error: "Esta matrícula já está registada por outro colaborador." });
          }
        }
      } catch { /* not JSON, ignore */ }
    }

    const [updatedUser] = await db
      .update(users)
      .set({ 
        username: username?.trim() || undefined, 
        phone: phone?.trim() || undefined, 
        vehicleInfo 
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) return res.status(404).json({ error: "User not found" });
    res.json(updatedUser);
  } catch (error: any) {
    console.error("Erro atualizar perfil:", error);
    res.status(500).json({ error: "Failed to update profile", details: error.message });
  }
});

export default router;
