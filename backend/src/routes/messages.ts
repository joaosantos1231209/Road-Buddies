import { Router } from "express";
import type { Request, Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { db } from "../db/index.js";
import { messages, trips, tripParticipants, chatReads, users } from "../db/schema.js";
import { eq, and, inArray, desc } from "drizzle-orm";
import { sendMessageNotification } from "../services/fcm.js";

const router = Router();
router.use(requireAuth);

const verifyChatAccess = async (tripId: number, userId: string) => {
  const trip = await db.query.trips.findFirst({
    where: eq(trips.id, tripId),
    with: { participants: true }
  });
  if (!trip) return null;
  const isDriver = trip.userId === userId;
  const isPassenger = trip.participants.some((p) => p.userId === userId);
  return (isDriver || isPassenger) ? trip : null;
};

// BUSCAR CONTADOR DE NÃO LIDAS (Definitivo e inclusivo)
router.get("/unread", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.uid;

    const myOwned = await db.query.trips.findMany({ where: eq(trips.userId, userId) });
    const myJoined = await db.query.tripParticipants.findMany({ where: eq(tripParticipants.userId, userId) });
    const relatedTripIds = [...new Set([...myOwned.map(t => t.id), ...myJoined.map(p => p.tripId)])];

    if (relatedTripIds.length === 0) {
      res.json({ unreadCount: 0, unreadByTrip: {} });
      return;
    }

    const userReads = await db.query.chatReads.findMany({ where: eq(chatReads.userId, userId) });
    const readMap = new Map<number, number>();
    for (const r of userReads) {
      const time = new Date(r.lastReadAt).getTime();
      const existing = readMap.get(r.tripId) || 0;
      if (time > existing) readMap.set(r.tripId, time);
    }

    const recentMsgs = await db.query.messages.findMany({
      where: inArray(messages.tripId, relatedTripIds)
    });

    const unreadMap: Record<number, number> = {};
    let totalUnread = 0;

    for (const m of recentMsgs) {
      if (m.senderId === userId) continue;
      const lastReadTime = readMap.get(m.tripId) || 0;
      const msgTime = new Date(m.createdAt).getTime();

      // Fix Sniper: Comparação direta. Adicionamos 50ms de margem de segurança
      if (msgTime > lastReadTime + 50) {
        unreadMap[m.tripId] = (unreadMap[m.tripId] || 0) + 1;
        totalUnread++;
      }
    }

    res.json({ unreadCount: totalUnread, unreadByTrip: unreadMap });
  } catch (error) {
    console.error("[UNREAD] Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// MARCAR COMO LIDO (Sniper: Baseado na mensagem mais recente)
router.post("/trip/:tripId/read", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tripId = parseInt(req.params.tripId as string);
    const userId = req.user.uid;

    const trip = await verifyChatAccess(tripId, userId);
    if (!trip) return res.status(403).json({ error: "Forbidden" });

    // Sniper: Buscar o tempo da mensagem MAIS RECENTE daquela viagem
    const lastMsg = await db.query.messages.findFirst({
      where: eq(messages.tripId, tripId),
      orderBy: [desc(messages.createdAt)]
    });

    // Se houver mensagens, usamos o tempo dela. Se não, usamos o agora.
    const readTime = lastMsg ? new Date(lastMsg.createdAt) : new Date();

    // Limpar duplicados e sincronizar o marcador
    await db.delete(chatReads).where(and(eq(chatReads.userId, userId), eq(chatReads.tripId, tripId)));
    await db.insert(chatReads).values({
      userId,
      tripId,
      lastReadAt: readTime
    });

    res.json({ success: true, ok: true });
  } catch (error) {
    console.error("[READ] Sniper Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/trip/:tripId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tripId = parseInt(req.params.tripId as string);
    const userId = req.user.uid;
    const trip = await verifyChatAccess(tripId, userId);
    if (!trip) return res.status(403).json({ error: "Forbidden" });
    const tripMessages = await db.query.messages.findMany({
      where: eq(messages.tripId, tripId),
      orderBy: (m, { asc }) => [asc(m.createdAt)],
      with: { sender: { columns: { id: true, username: true, avatarUrl: true } } }
    });
    res.json({ messages: tripMessages });
  } catch (error) { res.status(500).json({ error: "Internal Server Error" }); }
});

router.post("/trip/:tripId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tripId = parseInt(req.params.tripId as string);
    const senderId = req.user.uid;
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: "Missing content" });
    const trip = await verifyChatAccess(tripId, senderId);
    if (!trip) return res.status(403).json({ error: "Forbidden" });

    const newMessage = await db.insert(messages).values({ tripId, senderId, content, isRead: false }).returning();

    const notifyParticipants = async () => {
      try {
        const fullTrip = await db.query.trips.findFirst({
           where: eq(trips.id, tripId),
           with: { participants: true }
        });
        if (!fullTrip) return;
        const allUserIds = [fullTrip.userId, ...fullTrip.participants.map(p => p.userId)];
        const targetIds = [...new Set(allUserIds)].filter(id => id !== senderId);
        if (targetIds.length > 0) {
           const usersData = await db.query.users.findMany({ where: inArray(users.id, targetIds) });
           const sender = await db.query.users.findFirst({ where: eq(users.id, senderId) });
           for (const u of usersData) {
              if (u.fcmToken) await sendMessageNotification(u.fcmToken, sender?.username || "Um colega", content, tripId.toString()).catch(() => {});
           }
        }
      } catch (err) { console.error("[FCM] Error:", err); }
    };
    notifyParticipants();
    res.status(201).json({ message: newMessage[0] });
  } catch (error) { res.status(500).json({ error: "Internal Server Error" }); }
});

export default router;
