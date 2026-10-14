import { useEffect } from 'react';
import { API_BASE_URL } from "../lib/constants";
import { auth, messaging } from "../lib/firebase";

const VAPID_KEY = "BIew4Cz159PG0ExELlVDIZeapwZsGyadfjv3ck-iPIpxdS0-TqovHuEWyIuEqGMIegpSwMIF7JTjOS8YBJ_bPSI";

export const useFCM = (user: any) => {
  useEffect(() => {
    // 1. Verificações Básicas de Segurança
    if (!user || typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    // Se o messaging for null (porque falhou no firebase.ts), saímos sem erro
    if (!messaging) return;

    const setupFCM = async () => {
      try {
        // Importação dinâmica das funções do Firebase Messaging para evitar erros de parsing
        const { getToken, onMessage } = await import("firebase/messaging");

        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          let swRegistration: ServiceWorkerRegistration | undefined;
          if ('serviceWorker' in navigator) {
            try {
              const swQuery = new URLSearchParams({
                apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
                authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
                projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
                storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
                messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
                appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
              }).toString();
              swRegistration = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${swQuery}`);
            } catch (swErr) {
              console.warn('[FCM] Falha ao registar service worker dinâmico:', swErr);
            }
          }

          const token = await getToken(messaging, { 
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: swRegistration
          });
          
          if (token) {
            console.log('[FCM] Token sincronizado.');
            const idToken = await auth.currentUser?.getIdToken();
            await fetch(`${API_BASE_URL}/users/fcm-token`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
              },
              body: JSON.stringify({ token })
            });
          }
        }

        // Listener foreground
        const unsubscribe = onMessage(messaging, (payload) => {
          if (payload.notification && 'Notification' in window) {
             new Notification(payload.notification.title || 'Road Buddies', {
                body: payload.notification.body,
                icon: '/pwa-icon-192.png'
             });
          }
        });

        return unsubscribe;
      } catch (error) {
        console.warn('[FCM] Notificações não disponíveis neste contexto:', error);
      }
    };

    let unsubscribeFn: (() => void) | undefined;
    setupFCM().then(unsub => {
      unsubscribeFn = unsub;
    });

    return () => {
      if (unsubscribeFn) unsubscribeFn();
    };
  }, [user]);
};
