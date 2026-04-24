import express from "express";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { validatePhone, validateLicensePlate } from "../services/users.js";
import { validateBody, updateProfileSchema, fcmTokenSchema, errorMessage } from "../lib/validate.js";

const router = express.Router();

router.get("/", requireAdmin, async (req, res) => {
  try {
    const allUsers = await db.select({
      id: users.id,
      email: users.email,
      username: users.username,
      avatarUrl: users.avatarUrl,
      phone: users.phone,
      isAdmin: users.isAdmin,
      isVerified: users.isVerified,
      createdAt: users.createdAt,
    }).from(users);
    res.json(allUsers);
  } catch (error: unknown) {
    console.error("Erro ao buscar users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

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
  } catch (error: unknown) {
    console.error("Erro atualizar user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

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
  } catch (error: unknown) {
    console.error("Erro atualizar admin:", error);
    res.status(500).json({ error: "Failed to update admin" });
  }
});

router.put("/profile", requireAuth, validateBody(updateProfileSchema), async (req: AuthenticatedRequest, res) => {
  const { username, phone, vehicleInfo } = req.body;
  const userId = req.user.uid;

  try {
    if (phone && phone.trim() !== '') {
      if (!validatePhone(phone)) {
        return res.status(400).json({ error: "O telemóvel deve ter exactamente 9 dígitos." });
      }

      const phoneExists = await db.query.users.findFirst({
        where: (u, { eq, and, ne }) => and(eq(u.phone, phone.trim()), ne(u.id, userId)),
      });
      if (phoneExists) {
        return res.status(400).json({ error: "Este número de telemóvel já está em uso." });
      }
    }

    if (username && username.trim() !== '') {
      const nameExists = await db.query.users.findFirst({
        where: (u, { eq, and, ne }) => and(eq(u.username, username.trim()), ne(u.id, userId)),
      });
      if (nameExists) {
        return res.status(400).json({ error: "Este nome já está em uso por outro colaborador." });
      }
    }

    if (vehicleInfo && vehicleInfo.trim() !== '') {
      try {
        const vObj = JSON.parse(vehicleInfo);
        const plate = vObj?.plate?.trim();
        if (plate) {
          const plateIsValid = await validateLicensePlate(plate, userId);
          if (!plateIsValid) {
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
        vehicleInfo,
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) return res.status(404).json({ error: "User not found" });
    res.json(updatedUser);
  } catch (error: unknown) {
    console.error("Erro atualizar perfil:", error);
    res.status(500).json({ error: "Failed to update profile", details: errorMessage(error) });
  }
});

router.post("/fcm-token", requireAuth, validateBody(fcmTokenSchema), async (req: AuthenticatedRequest, res) => {
  const { token } = req.body;
  const userId = req.user.uid;

  if (!token) return res.status(400).json({ error: "Token is required" });

  try {
    await db.update(users).set({ fcmToken: token }).where(eq(users.id, userId));
    res.json({ message: "FCM token updated successfully" });
  } catch (error: unknown) {
    console.error("Erro ao atualizar FCM token:", error);
    res.status(500).json({ error: "Failed to update FCM token" });
  }
});

export default router;
