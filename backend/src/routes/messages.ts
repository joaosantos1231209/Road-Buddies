import { Router } from "express";
import type { Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { db } from "../db/index.js";
import { messages, trips, tripParticipants, chatReads, users } from "../db/schema.js";
import { eq, and, inArray, desc, gt } from "drizzle-orm";
import { sendMessageNotification } from "../services/fcm.js";
import { validateBody, parseIntParam, sendMessageSchema } from "../lib/validate.js";

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

router.get("/unread", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.uid;

    // Single query: get all trip IDs the user is involved in
    const [myOwned, myJoined] = await Promise.all([
      db.query.trips.findMany({ where: eq(trips.userId, userId), columns: { id: true } }),
      db.query.tripParticipants.findMany({ where: eq(tripParticipants.userId, userId), columns: { tripId: true } }),
    ]);
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
      where: and(
        inArray(messages.tripId, relatedTripIds),
      ),
      columns: { tripId: true, senderId: true, createdAt: true },
    });

    const unreadMap: Record<number, number> = {};
    let totalUnread = 0;

    for (const m of recentMsgs) {
      if (m.senderId === userId) continue;
      const lastReadTime = readMap.get(m.tripId) || 0;
      const msgTime = new Date(m.createdAt).getTime();
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

router.post("/trip/:tripId/read", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tripId = parseIntParam(req.params.tripId);
    if (!tripId) return res.status(400).json({ error: "ID inválido" });
    const userId = req.user.uid;

    const trip = await verifyChatAccess(tripId, userId);
    if (!trip) return res.status(403).json({ error: "Forbidden" });

    const lastMsg = await db.query.messages.findFirst({
      where: eq(messages.tripId, tripId),
      orderBy: [desc(messages.createdAt)],
      columns: { createdAt: true },
    });

    const readTime = lastMsg ? new Date(lastMsg.createdAt) : new Date();

    await db.delete(chatReads).where(and(eq(chatReads.userId, userId), eq(chatReads.tripId, tripId)));
    await db.insert(chatReads).values({ userId, tripId, lastReadAt: readTime });

    res.json({ success: true, ok: true });
  } catch (error) {
    console.error("[READ] Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/read-all", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.uid;

    const [myOwned, myJoined] = await Promise.all([
      db.query.trips.findMany({ where: eq(trips.userId, userId), columns: { id: true } }),
      db.query.tripParticipants.findMany({ where: eq(tripParticipants.userId, userId), columns: { tripId: true } }),
    ]);
    const relatedTripIds = [...new Set([...myOwned.map(t => t.id), ...myJoined.map(p => p.tripId)])];

    if (relatedTripIds.length > 0) {
      await db.delete(chatReads).where(and(eq(chatReads.userId, userId), inArray(chatReads.tripId, relatedTripIds)));
      await db.insert(chatReads).values(relatedTripIds.map(tripId => ({ userId, tripId, lastReadAt: new Date() })));
    }

    res.json({ success: true, ok: true });
  } catch (error) {
    console.error("[READ-ALL] Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/trip/:tripId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tripId = parseIntParam(req.params.tripId);
    if (!tripId) return res.status(400).json({ error: "ID inválido" });
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

router.post("/trip/:tripId", validateBody(sendMessageSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tripId = parseIntParam(req.params.tripId);
    if (!tripId) return res.status(400).json({ error: "ID inválido" });
    const senderId = req.user.uid;
    const { content } = req.body;
    const trip = await verifyChatAccess(tripId, senderId);
    if (!trip) return res.status(403).json({ error: "Forbidden" });
    if (trip.status === 'CANCELLED') return res.status(400).json({ error: "Não é possível enviar mensagens numa viagem cancelada." });

    const insertResult = await db.insert(messages).values({ tripId, senderId, content, isRead: false });
    const insertId = (insertResult as any)[0]?.insertId;
    const newMessage = await db.query.messages.findFirst({ where: eq(messages.id, insertId) });

    // Fire-and-forget FCM notifications
    (async () => {
      try {
        const fullTrip = await db.query.trips.findFirst({
          where: eq(trips.id, tripId),
          with: { participants: { columns: { userId: true } } },
          columns: { userId: true },
        });
        if (!fullTrip) return;
        const targetIds = [...new Set([fullTrip.userId, ...fullTrip.participants.map(p => p.userId)])].filter(id => id !== senderId);
        if (targetIds.length === 0) return;
        const [usersData, sender] = await Promise.all([
          db.query.users.findMany({ where: inArray(users.id, targetIds), columns: { fcmToken: true } }),
          db.query.users.findFirst({ where: eq(users.id, senderId), columns: { username: true } }),
        ]);
        const senderName = sender?.username || "Um colega";
        for (const u of usersData) {
          if (u.fcmToken) await sendMessageNotification(u.fcmToken, senderName, content, tripId.toString()).catch(() => {});
        }
      } catch (err) { console.error("[FCM] Error:", err); }
    })();

    res.status(201).json({ message: newMessage });
  } catch (error) { res.status(500).json({ error: "Internal Server Error" }); }
});

export default router;
