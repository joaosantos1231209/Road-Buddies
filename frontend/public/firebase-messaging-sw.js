importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Configuração dinâmica passada via query parameters na rota de registo
const params = new URLSearchParams(self.location.search);
const apiKey = params.get('apiKey');
const authDomain = params.get('authDomain');
const projectId = params.get('projectId');
const storageBucket = params.get('storageBucket');
const messagingSenderId = params.get('messagingSenderId');
const appId = params.get('appId');

if (apiKey && projectId) {
  firebase.initializeApp({
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  });

  const messaging = firebase.messaging();

  // Background message handler
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Mensagem em background recebida:', payload);
  });
}

