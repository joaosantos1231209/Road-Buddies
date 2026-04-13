import { Router } from "express";
import type { Request, Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { generateVerificationCode, isEmailAllowed, isCodeExpired } from "../lib/auth-utils.js";
import sendEmail from "../lib/email.js";
import * as dotenv from "dotenv";
import sgMail from "@sendgrid/mail";
dotenv.config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY || "SG.mock.key");

const router = Router();

async function sendVerificationCode(email: string, code: string) {
  const msg = {
    to: email,
    from: "joaosantos@loba.com",
    subject: "Road Buddies — Código de Verificação",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #0F172A;">
        <div style="background: #1E3A5F; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0; font-size: 20px;">🚗 Road Buddies</h2>
          <p style="color: rgba(255,255,255,0.7); margin: 4px 0 0; font-size: 13px;">Carsharing LOBA</p>
        </div>
        <div style="background: #fff; border: 1px solid #E2E8F0; border-top: none; padding: 32px; border-radius: 0 0 8px 8px; text-align: center;">
          <p style="font-size: 15px; color: #475569; margin: 0 0 24px;">O teu código de verificação é:</p>
          <div style="background: #EBF2FA; border: 2px dashed #2563A8; border-radius: 8px; padding: 20px; display: inline-block; margin-bottom: 24px;">
            <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #1E3A5F;">${code}</span>
          </div>
          <p style="font-size: 13px; color: #94A3B8; margin: 0;">Este código expira em 30 minutos.</p>
        </div>
      </div>
    `,
  };

  if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY !== "SG.mock.key") {
    await sgMail.send(msg);
    console.log(`[Email] Verification code sent to ${email}`);
  } else {
    console.log(`[Mock Email] Verification code for ${email}: ${code}`);
  }
}

// POST /api/auth/sync — called after Firebase login to create/update DB user
router.post("/sync", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { uid, email, name, picture } = req.user;
    
    // Debug log to identify synchronization issues
    console.log(`[Sync] User: ${name} (${email}), UID: ${uid}`);

    const allowedEmailsRaw = process.env.ALLOWED_EMAILS || "";
    const allowedEmails = allowedEmailsRaw.split(',').map(e => e.trim()).filter(e => e.length > 0);

    if (!isEmailAllowed(email, allowedEmails)) {
      res.status(403).json({ error: "Este domínio não tem permissão para aceder à plataforma." });
      return;
    }

    const existingUser = await db.query.users.findFirst({ where: eq(users.id, uid) });

    if (existingUser) {
      const updateData: any = { updatedAt: new Date() };
      if (picture) updateData.avatarUrl = picture;
      const updated = await db.update(users).set(updateData).where(eq(users.id, uid)).returning();
      res.json({ user: updated[0] });
      return;
    } else {
      // Use displayName as username (cleaned), fallback to email prefix
      const baseUsername = name
        ? name.toLowerCase().replace(/\s+/g, "_")
        : email ? email.split("@")[0] : "user";
      const username = baseUsername + Math.floor(Math.random() * 1000);

      const code = generateVerificationCode();
      const expiry = new Date(Date.now() + 30 * 60 * 1000); // 30 min

      const newUser = await db.insert(users).values({
        id: uid,
        email: email || "",
        username,
        avatarUrl: picture || null,
        isVerified: false,
        verificationCode: code,
        verificationExpiry: expiry,
      }).returning();

      // Send the verification code to the user's email
      if (email) {
        sendVerificationCode(email, code).catch(console.error);
      }

      res.status(201).json({ user: newUser[0] });
      return;
    }
  } catch (error) {
    console.error("Erro a sincronizar utilizador:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /api/auth/verify — verify code entered by user
router.post("/verify", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

// POST /api/auth/resend-code — resend verification code
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

    // Verifica expiração (30 min)
    if (isCodeExpired(userWithCode.updatedAt, 30)) {
      res.status(400).json({ error: "O código de verificação expirou." });
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
