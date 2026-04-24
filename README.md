# Rode Buddies

Plataforma interna de carpooling para colaboradores da LOBA. Permite criar e encontrar boleia entre colegas, com notificações push, e-mails automáticos e PWA instalável no telemóvel.

---

## Pré-requisitos

- **Node.js** v18 ou superior
- **npm** v9 ou superior
- Conta **Firebase** (Auth + Cloud Messaging)
- Base de dados **PostgreSQL** (recomendado: [Supabase](https://supabase.com))
- Conta **SendGrid** (envio de e-mails)

---

## Estrutura do Projeto

```
Rode_Buddies/
├── backend/          # API REST — Express 5 + Drizzle ORM + PostgreSQL
│   ├── src/
│   │   ├── db/       # Schema Drizzle e configuração da BD
│   │   ├── lib/      # Utilitários partilhados (constantes, logger, validação)
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── services/ # Lógica de negócio (auth, e-mail, matchmaking, …)
│   └── tests/
└── frontend/         # SPA React 19 + Vite + PWA
    └── src/
        ├── components/
        ├── contexts/
        ├── hooks/
        ├── lib/
        └── pages/
```

---

## Instalação

### 1. Clonar o repositório

```bash
git clone <url-do-repo>
cd Rode_Buddies
```

### 2. Instalar dependências

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

---

## Configuração — Backend

### 2a. Criar ficheiro `.env`

```bash
cp backend/.env.example backend/.env
```

Editar `backend/.env` com os valores reais:

```env
DATABASE_URL="postgresql://user:password@host:port/database"
PORT=3000

# Firebase Admin SDK — obtido em Project Settings > Service Accounts > Generate new private key
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk@your-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# SendGrid
SENDGRID_API_KEY="SG.your-key"

# E-mail remetente
EMAIL_FROM_ADDRESS="noreply@loba.com"

# E-mail para solicitações de viatura
SP_REQUEST_TO_EMAIL="gestor@empresa.pt"
SP_REQUEST_FROM_EMAIL="noreply@empresa.pt"

# E-mails permitidos além de @loba.com (separados por vírgula)
ALLOWED_EMAILS="user1@gmail.com, user2@gmail.com"

# URL do frontend (para links nos e-mails e CORS) — múltiplos separados por vírgula
FRONTEND_URL="http://localhost:5173,http://localhost:4173"
```

> **Nota CORS:** IPs locais da rede (192.168.x.x, 10.x.x.x) são aceites automaticamente para acesso pelo telemóvel na mesma rede.

### 2b. Aplicar o schema na base de dados

```bash
cd backend
npx drizzle-kit push
```

---

## Configuração — Frontend

### 3a. Criar ficheiro `.env`

```bash
cp frontend/.env.example frontend/.env
```

Editar `frontend/.env`:

```env
VITE_API_BASE_URL="http://localhost:3000"

# Firebase Web App — obtido em Project Settings > General > Your apps
VITE_FIREBASE_API_KEY="AIza..."
VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789"
VITE_FIREBASE_APP_ID="1:123456789:web:abc123"
VITE_FIREBASE_VAPID_KEY="BA..."
```

---

## Correr em Desenvolvimento

Abrir **dois terminais**:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```
API disponível em `http://localhost:3000`

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```
App disponível em `http://localhost:5173`

---

## Aceder pelo Telemóvel (mesma rede Wi-Fi)

1. Descobrir o IP da máquina:
   - Windows: `ipconfig` — procurar "Endereço IPv4" (ex: `192.168.1.100`)
   - Linux/Mac: `ip addr` ou `ifconfig`

2. Abrir no telemóvel: `http://192.168.1.100:5173`

3. Atualizar `frontend/.env`:
   ```env
   VITE_API_BASE_URL="http://192.168.1.100:3000"
   ```

> **PWA e notificações push** requerem HTTPS em produção. Em desenvolvimento local (HTTP), as notificações funcionam apenas com a app aberta.

---

## PWA — Instalar no Telemóvel

Para uma experiência completa com notificações push, instalar a versão de produção:

```bash
cd frontend
npm run build
npm run preview
```

App disponível em `http://localhost:4173` (ou IP da rede).

No browser Android/iOS: botão "Adicionar ao ecrã inicial" / "Install app".

---

## Testes

```bash
# Backend (Vitest)
cd backend && npm test

# Frontend (Vitest)
cd frontend && npm test

# Frontend com UI
cd frontend && npm run test:ui
```

---

## Build de Produção

```bash
# Backend
cd backend && npm run build && npm start

# Frontend
cd frontend && npm run build
# Servir a pasta dist/ com qualquer servidor estático (nginx, etc.)
```

---

## Configuração Firebase

### Authentication
1. Firebase Console → Authentication → Sign-in methods
2. Ativar **Google** e **Email/Password**
3. Em "Authorized domains" adicionar o domínio de produção

### Cloud Messaging (FCM) — Notificações Push
1. Firebase Console → Project Settings → Cloud Messaging
2. Gerar **VAPID key** (Web Push certificates)
3. Copiar para `VITE_FIREBASE_VAPID_KEY` no `.env` do frontend

### Admin SDK — Backend
1. Firebase Console → Project Settings → Service Accounts
2. "Generate new private key" → descarregar JSON
3. Copiar `project_id`, `client_email`, e `private_key` para o `.env` do backend

---

## Configuração SendGrid

1. Criar conta em [sendgrid.com](https://sendgrid.com)
2. Settings → API Keys → Create API Key (Full Access)
3. Verificar o domínio remetente em Sender Authentication
4. Copiar a API key para `SENDGRID_API_KEY` no `.env` do backend

---

## Referência de Variáveis de Ambiente

### Backend (`backend/.env`)

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | Sim | Connection string PostgreSQL |
| `PORT` | Não (3000) | Porta do servidor |
| `FIREBASE_PROJECT_ID` | Sim | ID do projeto Firebase |
| `FIREBASE_CLIENT_EMAIL` | Sim | E-mail do service account |
| `FIREBASE_PRIVATE_KEY` | Sim | Chave privada do service account |
| `SENDGRID_API_KEY` | Sim | Chave API do SendGrid |
| `EMAIL_FROM_ADDRESS` | Sim | E-mail remetente dos e-mails da plataforma |
| `SP_REQUEST_TO_EMAIL` | Sim | E-mail destinatário das solicitações de viatura |
| `SP_REQUEST_FROM_EMAIL` | Sim | E-mail remetente das solicitações de viatura |
| `ALLOWED_EMAILS` | Não | E-mails extra permitidos além de @loba.com |
| `FRONTEND_URL` | Sim | URL(s) do frontend para CORS e links em e-mails |

### Frontend (`frontend/.env`)

| Variável | Obrigatória | Descrição |
|---|---|---|
| `VITE_API_BASE_URL` | Sim | URL base da API backend |
| `VITE_FIREBASE_API_KEY` | Sim | API Key da Web App Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | Sim | Auth domain Firebase |
| `VITE_FIREBASE_PROJECT_ID` | Sim | ID do projeto Firebase |
| `VITE_FIREBASE_STORAGE_BUCKET` | Sim | Storage bucket Firebase |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sim | Sender ID FCM |
| `VITE_FIREBASE_APP_ID` | Sim | App ID Firebase |
| `VITE_FIREBASE_VAPID_KEY` | Sim | VAPID key para notificações push |

---

## Comandos Rápidos

```bash
# Instalar tudo
cd backend && npm install && cd ../frontend && npm install

# Aplicar schema na BD
cd backend && npx drizzle-kit push

# Correr em dev (dois terminais)
cd backend && npm run dev
cd frontend && npm run dev

# Testes
cd backend && npm test
cd frontend && npm test

# Build produção
cd backend && npm run build
cd frontend && npm run build
```
