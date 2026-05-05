# Road Buddies — Frontend

Interface web progressiva (PWA) da plataforma de carpooling interno da LOBA.

## Stack

- **React 19** + **TypeScript**
- **Vite 8** (bundler + dev server)
- **TanStack Query** (server state / cache)
- **Wouter** (client-side routing)
- **Tailwind CSS** + **Radix UI** (estilos e componentes)
- **Firebase** (autenticação + FCM push notifications)
- **vite-plugin-pwa** (Service Worker + instalação como PWA)

## Comandos

```bash
npm install       # instalar dependências
npm run dev       # servidor de desenvolvimento (http://localhost:5173)
npm run build     # build de produção (dist/)
npm run preview   # pré-visualizar build de produção
npm test          # correr testes unitários (Vitest)
npx cypress open  # abrir Cypress (testes E2E)
```

## Variáveis de Ambiente

Criar um ficheiro `.env` na raiz do `frontend/`:

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_VAPID_KEY=...
```

## Estrutura

```
src/
├── components/     # componentes reutilizáveis (CitySelector, ConfirmDialog, etc.)
├── contexts/       # AuthContext, ToastContext
├── hooks/          # useTripsData, useTripsActions, useFCM
├── lib/            # design tokens, utils, tripFormatters, constants
├── pages/          # páginas (Dashboard, ProximasViagens, MinhasViagens, ...)
└── types/          # tipos TypeScript partilhados
```
