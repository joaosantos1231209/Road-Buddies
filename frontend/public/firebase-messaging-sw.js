importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker.
// Values from .env to ensure FCM works in background.
firebase.initializeApp({
  apiKey: "AIzaSyD7ESDMs3R69fQW1T3DgBa5D1CSbdWAFfU",
  authDomain: "road-buddies-bcdba.firebaseapp.com",
  projectId: "road-buddies-bcdba",
  storageBucket: "road-buddies-bcdba.firebasestorage.app",
  messagingSenderId: "568355013929",
  appId: "1:568355013929:web:9b5748a15efc7046276338"
});

const messaging = firebase.messaging();

// Background message handler
// Por padrão, se o backend enviar o objeto "notification", o Firebase SDK 
// já mostra a notificação automaticamente em background. 
// Não precisamos da chamada manual showNotification a menos que enviemos apenas "data".
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensagem em background recebida:', payload);
  // O SDK trata o resto automaticamente para o objeto 'notification'
});
