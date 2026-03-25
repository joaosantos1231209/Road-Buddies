import { Router } from "express";
import type { Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { db } from "../db/index.js";
import { spRequests, users, cities } from "../db/schema.js";
import { eq } from "drizzle-orm";
import sgMail from "@sendgrid/mail";
import * as dotenv from "dotenv";
dotenv.config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY || "SG.mock.key");

const router = Router();
router.use(requireAuth);

// Create a new SP request and send notification email
router.post("/", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { originId, destinationId, dateNeeded, justification } = req.body;
    const userId = req.user.uid;

    if (originId && destinationId && originId.toString() === destinationId.toString()) {
      res.status(400).json({ error: "A origem e o destino têm de ser diferentes." });
      return;
    }

    // Fetch collaborator info
    const collaborator = await db.query.users.findFirst({ where: eq(users.id, userId) });
    const originCity = originId ? await db.query.cities.findFirst({ where: eq(cities.id, parseInt(originId)) }) : null;
    const destCity = await db.query.cities.findFirst({ where: eq(cities.id, parseInt(destinationId)) });

    const [request] = await db.insert(spRequests).values({
      userId,
      originId: originId ? parseInt(originId) : null,
      destinationId: parseInt(destinationId),
      dateNeeded: new Date(dateNeeded),
      justification,
    }).returning();

    const collaboratorEmail = collaborator?.email || "colaborador@empresa.pt";
    const collaboratorName = collaborator?.username || "Colaborador";
    const collaboratorPhone = collaborator?.phone || "Não fornecido";

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background: #1E3A5F; padding: 24px; text-align: center;">
          <h2 style="color: white; margin: 0; font-size: 20px;">🚗 Nova Solicitação de Viatura</h2>
          <p style="color: rgba(255,255,255,0.75); margin: 6px 0 0; font-size: 14px;">Road Buddies · Carsharing LOBA</p>
        </div>
        <div style="padding: 24px;">
          <h3 style="color: #1E3A5F; margin-top: 0;">Dados do Colaborador</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr><td style="padding: 8px 0; color: #64748B; width: 40%;">Nome</td><td style="padding: 8px 0; font-weight: 600;">${collaboratorName}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748B;">E-mail</td><td style="padding: 8px 0; font-weight: 600;">${collaboratorEmail}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748B;">Telemóvel</td><td style="padding: 8px 0; font-weight: 600;">${collaboratorPhone}</td></tr>
          </table>
          <h3 style="color: #1E3A5F;">Detalhes da Solicitação</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr><td style="padding: 8px 0; color: #64748B; width: 40%;">Origem</td><td style="padding: 8px 0; font-weight: 600;">${originCity?.name || "Não especificada"}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748B;">Destino</td><td style="padding: 8px 0; font-weight: 600;">${destCity?.name || "—"}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748B;">Data Necessária</td><td style="padding: 8px 0; font-weight: 600;">${new Date(dateNeeded).toLocaleDateString("pt-PT")}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748B;">Justificação</td><td style="padding: 8px 0; font-weight: 600;">${justification || "Sem justificação fornecida."}</td></tr>
          </table>
          <div style="background: #EBF2FA; border-left: 4px solid #2563A8; padding: 14px 16px; border-radius: 4px;">
            <p style="margin: 0; font-size: 14px; color: #1E3A5F;">
              <strong>📧 Para dar seguimento a esta solicitação</strong>, responda diretamente ao colaborador pelo e-mail: 
              <a href="mailto:${collaboratorEmail}" style="color: #2563A8;">${collaboratorEmail}</a>
            </p>
          </div>
        </div>
        <div style="background: #F8FAFC; padding: 14px 24px; text-align: center; font-size: 12px; color: #94A3B8;">
          Este e-mail foi gerado automaticamente pela plataforma Road Buddies.
        </div>
      </div>
    `;

    const msg = {
      to: "jpgomessantos1@gmail.com",
      from: "joaosantos@loba.com",
      subject: `[Road Buddies] Solicitação de Viatura - ${collaboratorName}`,
      html: emailHtml,
    };

    if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY !== "SG.mock.key") {
      await sgMail.send(msg);
      console.log(`[Email] SP request sent for ${collaboratorName}`);
    } else {
      console.log(`[Mock Email] SP request would be sent for ${collaboratorName} to jpgomessantos1@gmail.com`);
    }

    res.status(201).json({ request });
  } catch (error) {
    console.error("Error creating SP request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get all SP requests for the current user
router.get("/", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const requests = await db.query.spRequests.findMany({
      where: eq(spRequests.userId, userId),
      with: { origin: true, destination: true },
      orderBy: (sp, { desc }) => [desc(sp.createdAt)],
    });
    res.json({ requests });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
