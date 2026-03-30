import { Router } from "express";
import type { Request, Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { db } from "../db/index.js";
import { messages, trips, tripParticipants, chatReads, users } from "../db/schema.js";
import { eq, and, inArray, ne } from "drizzle-orm";
import { sendMessageNotification } from "../services/fcm.js";

const router = Router();
router.use(requireAuth);

// Helper to check access
const verifyChatAccess = async (tripId: number, userId: string) => {
  const trip = await db.query.trips.findFirst({
    where: eq(trips.id, tripId),
    with: { participants: true }
  });

  if (!trip) return null;

  const isDriver = trip.userId === userId;
  const isPassenger = trip.participants.some((p) => p.userId === userId);

  if (!isDriver && !isPassenger) return null;
  return trip;
};

router.get("/unread", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;

    const myTrips = await db.query.trips.findMany({
      where: and(eq(trips.userId, userId), ne(trips.status, 'CANCELLED'))
    });
    const myJoined = await db.query.tripParticipants.findMany({
      where: eq(tripParticipants.userId, userId),
      with: {
        trip: true
      }
    });

    const activeJoinedTripIds = myJoined
      .filter(p => p.trip.status !== 'CANCELLED')
      .map(p => p.tripId);

    const relatedTripIds = [...new Set([...myTrips.map(t => t.id), ...activeJoinedTripIds])];

    if (relatedTripIds.length === 0) {
      res.json({ unreadCount: 0, unreadByTrip: {} });
      return;
    }

    const userReads = await db.query.chatReads.findMany({ where: eq(chatReads.userId, userId) });
    const readMap = new Map(userReads.map(r => [r.tripId, new Date(r.lastReadAt).getTime()]));

    const recentMsgs = await db.query.messages.findMany({
      where: inArray(messages.tripId, relatedTripIds)
    });

    const unreadMap: Record<number, number> = {};
    let totalUnread = 0;

    for (const m of recentMsgs) {
      if (m.senderId === userId) continue;
      const lastRead = readMap.get(m.tripId) || 0;
      if (new Date(m.createdAt).getTime() > lastRead) {
        unreadMap[m.tripId] = (unreadMap[m.tripId] || 0) + 1;
        totalUnread++;
      }
    }

    res.json({ unreadCount: totalUnread, unreadByTrip: unreadMap });
  } catch (error) {
    console.error("Error fetching unread messages:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/trip/:tripId/read", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tripId = parseInt(req.params.tripId as string);
    const userId = req.user.uid;

    const trip = await verifyChatAccess(tripId, userId);
    if (!trip) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const existing = await db.query.chatReads.findFirst({
      where: and(eq(chatReads.userId, userId), eq(chatReads.tripId, tripId))
    });

    if (existing) {
      await db.update(chatReads).set({ lastReadAt: new Date() }).where(eq(chatReads.id, existing.id));
    } else {
      await db.insert(chatReads).values({ userId, tripId, lastReadAt: new Date() });
    }

    res.json({ ok: true });
  } catch (error) {
    console.error("Error marking chat read:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/trip/:tripId", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tripId = parseInt(req.params.tripId as string);
    const userId = req.user.uid;

    const trip = await verifyChatAccess(tripId, userId);
    if (!trip) {
      res.status(403).json({ error: "Forbidden: Not a participant of this trip" });
      return;
    }

    const tripMessages = await db.query.messages.findMany({
      where: eq(messages.tripId, tripId),
      orderBy: (m, { asc }) => [asc(m.createdAt)],
      with: {
        sender: {
          columns: { id: true, username: true, avatarUrl: true }
        }
      }
    });

    res.json({ messages: tripMessages });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/trip/:tripId", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tripId = parseInt(req.params.tripId as string);
    const senderId = req.user.uid;
    const { content } = req.body;

    if (!content) {
      res.status(400).json({ error: "Missing content" });
      return;
    }

    const trip = await verifyChatAccess(tripId, senderId);
    if (!trip) {
      res.status(403).json({ error: "Forbidden: Not a participant of this trip" });
      return;
    }

    const newMessage = await db.insert(messages).values({
      tripId,
      senderId,
      content,
      isRead: false
    }).returning();

    // Notificar em background
    const notifyParticipants = async () => {
      try {
        console.log(`[FCM] A preparar notificações para a viagem ${tripId}...`);

        const fullTrip = await db.query.trips.findFirst({
          where: eq(trips.id, tripId),
          with: { participants: true }
        });

        if (!fullTrip) return;

        // IDs únicos (Condutor + Passageiros)
        const allUserIds = [fullTrip.userId, ...fullTrip.participants.map(p => p.userId)];
        // Filtrar quem enviou a mensagem e remover duplicados
        const targetIds = [...new Set(allUserIds)].filter(id => id !== senderId);

        console.log(`[FCM] Alvos encontrados: ${targetIds.length} utilizadores.`);

        if (targetIds.length > 0) {
          const usersData = await db.query.users.findMany({
            where: inArray(users.id, targetIds)
          });

          const sender = await db.query.users.findFirst({ where: eq(users.id, senderId) });

          for (const u of usersData) {
            if (u.fcmToken) {
              console.log(`[FCM] A enviar para ${u.username} (Token: ${u.fcmToken.substring(0, 10)}...)`);
              await sendMessageNotification(u.fcmToken, sender?.username || "Um colega", content, tripId.toString()).catch(e => console.error(`[FCM] Erro ao enviar para ${u.id}:`, e));
            } else {
              console.log(`[FCM] O utilizador ${u.username} não tem token de notificações.`);
            }
          }
        }
      } catch (err) {
        console.error("[FCM] Erro no processo de notificação de chat:", err);
      }
    };
    notifyParticipants();

    res.status(201).json({ message: newMessage[0] });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
