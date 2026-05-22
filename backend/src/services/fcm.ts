import { getMessaging } from "firebase-admin/messaging";

/**
 * Sends a push notification to a specific user via their FCM token.
 * 
 * @param fcmToken The registration token for the target device
 * @param title Notification title
 * @param body Notification body
 * @param data Optional data payload for the notification
 */
export const sendPushNotification = async (fcmToken: string, title: string, body: string, data?: Record<string, string>) => {
  if (!fcmToken) return;

  const message = {
    notification: {
      title,
      body,
    },
    data: data || {},
    token: fcmToken,
  };

  try {
    const response = await getMessaging().send(message);
    console.log('[FCM] Notificação enviada com sucesso:', response);
    return response;
  } catch (error) {
    console.error('[FCM] Erro ao enviar notificação:', error);
    // If the token is invalid or expired, we might want to handle it (e.g., clear it from DB)
    throw error;
  }
};

/**
 * Sends a notification related to a new match.
 */
export const sendMatchNotification = async (fcmToken: string, tripInfo: string) => {
  return sendPushNotification(
    fcmToken,
    "Novo Match Encontrado! 🚗",
    `Encontrámos uma viagem compatível para o teu trajeto: ${tripInfo}.`,
    { type: 'MATCH_FOUND' }
  );
};

/**
 * Sends a notification for a new message in a chat.
 */
export const sendMessageNotification = async (fcmToken: string, senderName: string, messageContent: string, tripId: string) => {
  return sendPushNotification(
    fcmToken,
    `Nova mensagem de ${senderName}`,
    messageContent,
    { type: 'NEW_MESSAGE', tripId }
  );
};

/**
 * Sends a notification to the driver when a passenger joins.
 */
export const sendPassengerJoinedNotification = async (fcmToken: string, passengerName: string, tripInfo: string) => {
  return sendPushNotification(
    fcmToken,
    "Novo Passageiro! 👥",
    `${passengerName} juntou-se à sua viagem: ${tripInfo}.`,
    { type: 'PASSENGER_JOINED' }
  );
};

/**
 * Sends a notification to a subscriber when a new PROVIDER trip matches their subscription.
 */
export const sendSubscriptionTripNotification = async (fcmToken: string, origin: string, destination: string, driverName: string) => {
  return sendPushNotification(
    fcmToken,
    `Nova Oferta: ${origin} → ${destination}`,
    `${driverName} publicou uma boleia para o teu trajeto subscrito.`,
    { type: 'SUBSCRIPTION_TRIP_ALERT' }
  );
};

/**
 * Sends a notification to passengers when a trip is cancelled.
 */
export const sendTripCancelledNotification = async (fcmToken: string, driverName: string, tripInfo: string) => {
  return sendPushNotification(
    fcmToken,
    "Viagem Cancelada! 🛑",
    `${driverName} cancelou a viagem: ${tripInfo}.`,
    { type: 'TRIP_CANCELLED' }
  );
};
