import { Router } from "express";
import type { Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { generateVerificationCode, isEmailAllowed, isCodeExpired } from "../lib/auth-utils.js";
import { sendVerificationCode } from "../services/auth.js";
import { validateBody, verifyCodeSchema } from "../lib/validate.js";

const router = Router();

router.post("/sync", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { uid, email, name: tokenName, picture } = req.user;
    const name = req.body?.displayName || tokenName;

    console.log(`[Sync] User: ${name} (${email}), UID: ${uid}`);

    const allowedEmails = (process.env.ALLOWED_EMAILS || "").split(',').map(e => e.trim()).filter(Boolean);

    if (!isEmailAllowed(email ?? "", allowedEmails)) {
      res.status(403).json({ error: "Este domínio não tem permissão para aceder à plataforma." });
      return;
    }

    const existingUser = await db.query.users.findFirst({ where: eq(users.id, uid) });

    if (existingUser) {
      const updateData: { updatedAt: Date; avatarUrl?: string } = { updatedAt: new Date() };
      if (picture) updateData.avatarUrl = picture;
      const updated = await db.update(users).set(updateData).where(eq(users.id, uid)).returning();
      res.json({ user: updated[0] });
      return;
    }

    const baseUsername = name
      ? name.toLowerCase().replace(/\s+/g, "_")
      : email ? email.split("@")[0] : "user";
    const username = (baseUsername ?? "user") + Math.floor(Math.random() * 1000);

    const code = generateVerificationCode();
    const expiry = new Date(Date.now() + 30 * 60 * 1000);

    const newUser = await db.insert(users).values({
      id: uid,
      email: email || "",
      username,
      avatarUrl: picture || null,
      isVerified: false,
      verificationCode: code,
      verificationExpiry: expiry,
    }).returning();

    if (email) sendVerificationCode(email, code).catch(console.error);

    res.status(201).json({ user: newUser[0] });
  } catch (error) {
    console.error("Erro a sincronizar utilizador:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/verify", requireAuth, validateBody(verifyCodeSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { uid } = req.user;
    const { code } = req.body;

    const user = await db.query.users.findFirst({ where: eq(users.id, uid) });
    if (!user) {
      res.status(404).json({ error: "Utilizador não encontrado" });
      return;
    }

    if (!user.verificationCode || !user.verificationExpiry) {
      res.status(400).json({ error: "Nenhum código pendente" });
      return;
    }

    if (new Date() > new Date(user.verificationExpiry)) {
      res.status(400).json({ error: "Código expirado" });
      return;
    }

    if (user.verificationCode !== code.trim()) {
      res.status(400).json({ error: "Código incorreto" });
      return;
    }

    const updated = await db.update(users)
      .set({ isVerified: true, verificationCode: null, verificationExpiry: null, updatedAt: new Date() })
      .where(eq(users.id, uid))
      .returning();

    res.json({ user: updated[0] });
  } catch (error) {
    console.error("Erro a verificar código:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/resend-code", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { uid, email } = req.user;

    if (!email) {
      res.status(400).json({ error: "Sem email associado" });
      return;
    }

    const userWithCode = await db.query.users.findFirst({ where: eq(users.id, uid) });
    if (!userWithCode) {
      res.status(400).json({ error: "Código inválido ou expirado." });
      return;
    }

    const code = generateVerificationCode();
    const expiry = new Date(Date.now() + 30 * 60 * 1000);

    await db.update(users)
      .set({ verificationCode: code, verificationExpiry: expiry, updatedAt: new Date() })
      .where(eq(users.id, uid));

    await sendVerificationCode(email, code);
    res.json({ ok: true });
  } catch (error) {
    console.error("Erro ao reenviar código:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
