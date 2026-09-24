# Road Buddies — Plataforma Corporativa de Carpooling & Gestão de Frotas

<!-- VIDEO_PLACEHOLDER -->

Plataforma corporativa *Full-Stack* desenvolvida para a **LOBA** focada em otimizar a mobilidade corporativa, promover a sustentabilidade e simplificar a gestão de viagens e viaturas de empresa entre diferentes escritórios e polos da organização.

---

## 🎯 Proposta de Valor & Visão Geral

O **Road Buddies** resolve problemas reais de logística interna corporativa. A solução permite aos colaboradores partilhar deslocações (*carpooling*) ou requisitar viaturas da frota da empresa para deslocações de trabalho, reduzindo custos operacionais, pegada de carbono e melhorando a coesão interna.

Construído com uma arquitetura moderna, escalável e resiliente, o sistema integra autenticação segura por código OTP, sincronização e notificações em tempo real, suporte *offline-first* via PWA instalável, e um algoritmo inteligente de *match-making*.

---

## 🚀 Funcionalidades de Negócio & Engenharia

### 🧠 Algoritmo de Match-Making Inteligente
* **Cruzamento Automatizado:** Sistema determinístico que cruza pedidos e ofertas de boleia com base em janelas temporais, escritórios/cidades de origem e destino, e disponibilidade de lugares.
* **Sugestões em Tempo Real:** Identificação e notificação automática de correspondências (*matches*) relevantes para condutores e passageiros.

### 💬 Comunicação em Tempo Real & Chat por Viagem
* **Chat Dedicado:** Canal de chat em tempo real isolado por viagem para coordenação precisa de pontos de encontro e horários.
* **Badges de Mensagens Não Lidas & Alertas:** Indicadores visuais de presença e notificação imediata aos condutores e passageiros.

### 🛡️ Controlo de Acessos Baseado em Funções (RBAC) & Painel Administrativo
* **Gestão Centralizada:** Painel de administração seguro para gestão completa de utilizadores/colaboradores, aprovação de contas e perfis de acesso.
* **Gestão de Infraestrutura:** Administração de escritórios/localidades corporativas e frota de viaturas de empresa.

### 🚘 Fluxo de Requisição de Viaturas de Empresa (Serviços Partilhados)
* **Workflow Formal:** Processo parametrizado para solicitação formal de viaturas de frota (*SP - Serviços Partilhados*) com justificação de negócio, datas e itinerário.
* **Automação via SendGrid:** Notificações transacionais por e-mail para aprovação/rejeição e alertas de gestão.

### 📱 Arquitetura PWA & Push Notifications (Firebase FCM)
* **Progressive Web App (PWA):** Aplicação instalável nativamente em dispositivos móveis (iOS/Android) e desktop.
* **Firebase Cloud Messaging (FCM):** Notificações *Push* em background para alertas imediatos sobre boleias aceites, novas mensagens e pedidos de viatura.
* **Autenticação OTP:** Fluxo de autenticação seguro com verificação de e-mail por código único (OTP) e restrição por domínio corporativo (`@loba.com`).

---

## 🛠️ Arquitetura & Stack Tecnológica

```
┌─────────────────────────────────────────────────────────────────┐
│                      Frontend (SPA / PWA)                       │
│           React 19 • Vite • Tailwind CSS • Lucide Icons         │
└─────────────────────────────────┬───────────────────────────────┘
                                  │ REST API / CORS
┌─────────────────────────────────▼───────────────────────────────┐
│                       Backend (Node.js)                         │
│       Express 5 • Drizzle ORM • Service Layer Architecture      │
└──────────────┬──────────────────┬──────────────────┬────────────┘
               │                  │                  │
┌──────────────▼──────┐  ┌────────▼─────────┐  ┌─────▼────────────┐
│   MySQL 8 Database  │  │  Firebase Cloud  │  │ SendGrid Service │
│   (Relational DB)   │  │   Auth OTP & FCM │  │  Transactional   │
└─────────────────────┘  └──────────────────┘  └──────────────────┘
```

* **Frontend:**
  * **Framework:** React 19 (SPA) com Vite para *builds* de alta performance.
  * **Estilização:** Tailwind CSS e Shadcn/UI (Design System coeso e responsivo).
  * **PWA:** Service Workers, Web App Manifest e suporte para utilização offline/instalável.
* **Backend:**
  * **Runtime & Server:** Node.js com Express 5.
  * **ORM & Database:** Drizzle ORM com MySQL 8 (migrações tipadas e *queries* de alta performance).
  * **Arquitetura:** Camadas modulares desacopladas (Controllers/Routes, Service Layer, Middleware, DB Schema).
* **Serviços & Infraestrutura:**
  * **Firebase Admin & Web SDK:** Autenticação corporativa, validação de tokens e FCM (Firebase Cloud Messaging).
  * **SendGrid API:** Serviço robusto de e-mails transacionais.
  * **Docker:** Suporte para ambiente de base de dados MySQL 8 em contentores.

---

## 📋 Pré-requisitos

- **Node.js** v18 ou superior
- **npm** v9 ou superior
- Conta **Firebase** (Auth + Cloud Messaging)
- Base de dados **MySQL 8** (local via Docker ou serviço cloud)
- Conta **SendGrid** (envio de e-mails transacionais)

---

## 📂 Estrutura do Projeto

```
Rode_Buddies/
├── backend/          # API REST — Express 5 + Drizzle ORM + MySQL
│   ├── src/
│   │   ├── db/       # Schema Drizzle e configuração da BD
│   │   ├── lib/      # Utilitários partilhados (constantes, logger, validação, email)
│   │   ├── middleware/# Middlewares de autenticação e validação (RBAC)
│   │   ├── routes/   # Definições de endpoints REST
│   │   └── services/ # Lógica de negócio (auth, email, matchmaking, viaturas, …)
│   └── tests/        # Suíte de testes unitários e de integração (Vitest)
└── frontend/         # SPA React 19 + Vite + PWA
    └── src/
        ├── components/ # Componentes reutilizáveis de UI
        ├── contexts/   # Contextos globais (Auth, Toast)
        ├── hooks/      # Custom Hooks React
        ├── lib/        # Utilitários e formatação
        └── pages/      # Páginas da aplicação
```

---

## ⚙️ Instalação & Setup

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

## 🔒 Configuração de Variáveis de Ambiente

### Backend (`backend/.env`)

Criar o ficheiro `backend/.env` com as configurações do servidor e integrações:

```env
DATABASE_URL="mysql://user:password@localhost:3306/rode_buddies"
PORT=3000

# Firebase Admin SDK — Project Settings > Service Accounts > Generate new private key
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk@your-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# SendGrid API Key
SENDGRID_API_KEY="SG.your-key"

# Remetente dos e-mails
EMAIL_FROM_ADDRESS="noreply@loba.com"

# E-mail para solicitações de viatura de empresa (Serviços Partilhados)
SP_REQUEST_TO_EMAIL="gestor@empresa.pt"
SP_REQUEST_FROM_EMAIL="noreply@empresa.pt"

# E-mails permitidos além de @loba.com (separados por vírgula)
ALLOWED_EMAILS="user1@gmail.com, user2@gmail.com"

# URL do frontend (para links nos e-mails e CORS) — múltiplos separados por vírgula
FRONTEND_URL="http://localhost:5173,http://localhost:4173"
```

> **Nota CORS:** IPs locais da rede (192.168.x.x, 10.x.x.x) são aceites automaticamente para acesso pelo telemóvel na mesma rede local.

### Aplicar Schema na Base de Dados (Drizzle Push / Docker MySQL)

Se estiver a usar Docker para executar o MySQL 8 localmente:

```bash
docker run --name rode-buddies-mysql -e MYSQL_ROOT_PASSWORD=password -e MYSQL_DATABASE=rode_buddies -p 3306:3306 -d mysql:8
```

Para sincronizar o esquema do Drizzle ORM com a base de dados:

```bash
cd backend
npx drizzle-kit push
```

---

### Frontend (`frontend/.env`)

Criar o ficheiro `frontend/.env`:

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

## 🏃 Execução em Desenvolvimento

Abrir **dois terminais**:

**Terminal 1 — Backend API:**
```bash
cd backend
npm run dev
```
Servidor disponível em `http://localhost:3000`

**Terminal 2 — Frontend Web / PWA:**
```bash
cd frontend
npm run dev
```
Aplicação disponível em `http://localhost:5173`

---

## 📲 Acesso em Dispositivos Móveis (Rede Local Wi-Fi)

1. Descobrir o IP da máquina local:
   - **Windows:** `ipconfig` (procurar por *Endereço IPv4*, ex: `192.168.1.100`)
   - **Linux / Mac:** `ip addr` ou `ifconfig`

2. Abrir no browser do telemóvel: `http://192.168.1.100:5173`

3. Atualizar a variável no `frontend/.env` se necessário:
   ```env
   VITE_API_BASE_URL="http://192.168.1.100:3000"
   ```

---

## 📱 Instalação PWA no Telemóvel

Para testar a experiência nativa PWA com notificações Push:

```bash
cd frontend
npm run build
npm run preview
```

Navegar até `http://localhost:4173` (ou IP local) no browser móvel e selecionar **"Adicionar ao ecrã principal" / "Instalar Aplicação"**.

---

## 🧪 Suíte de Testes (Vitest)

O projeto possui cobertura de testes unitários e de integração para garantir a estabilidade das regras de negócio e rotas da API:

```bash
# Executar testes no Backend (Vitest)
cd backend && npm test

# Executar testes no Frontend (Vitest)
cd frontend && npm test

# Executar testes no Frontend com UI interativa
cd frontend && npm run test:ui
```

---

## 🏗️ Build de Produção

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
# Os ficheiros gerados em dist/ podem ser servidos por Nginx, Vercel ou qualquer servidor estático.
```

---

## ⚡ Referência Completa de Variáveis de Ambiente

### Backend (`backend/.env`)

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | Sim | Connection string do MySQL (`mysql://user:pass@host:port/db`) |
| `PORT` | Não (3000) | Porta de execução da API Express |
| `FIREBASE_PROJECT_ID` | Sim | ID do projeto Firebase |
| `FIREBASE_CLIENT_EMAIL` | Sim | E-mail da conta de serviço Firebase Admin |
| `FIREBASE_PRIVATE_KEY` | Sim | Chave privada da conta de serviço Firebase |
| `SENDGRID_API_KEY` | Sim | Chave API do SendGrid |
| `EMAIL_FROM_ADDRESS` | Sim | E-mail remetente oficial das notificações |
| `SP_REQUEST_TO_EMAIL` | Sim | E-mail destinatário dos pedidos de viaturas de empresa |
| `SP_REQUEST_FROM_EMAIL` | Sim | E-mail remetente dos pedidos de viaturas de empresa |
| `ALLOWED_EMAILS` | Não | E-mails adicionais permitidos além do domínio corporativo |
| `FRONTEND_URL` | Sim | URLs do frontend autorizadas para CORS e hiperligações |

### Frontend (`frontend/.env`)

| Variável | Obrigatória | Descrição |
|---|---|---|
| `VITE_API_BASE_URL` | Sim | URL base da API REST do backend |
| `VITE_FIREBASE_API_KEY` | Sim | API Key da aplicação Web Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | Sim | Domínio de autenticação Firebase |
| `VITE_FIREBASE_PROJECT_ID` | Sim | ID do projeto Firebase |
| `VITE_FIREBASE_STORAGE_BUCKET` | Sim | Storage bucket do Firebase |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sim | Sender ID para notificações FCM |
| `VITE_FIREBASE_APP_ID` | Sim | App ID da aplicação Web Firebase |
| `VITE_FIREBASE_VAPID_KEY` | Sim | Chave VAPID para Web Push Notifications |

---

## 🚀 Comandos Rápidos

```bash
# Instalar dependências completas
cd backend && npm install && cd ../frontend && npm install

# Sincronizar esquema da BD MySQL via Drizzle
cd backend && npx drizzle-kit push

# Executar Backend e Frontend em desenvolvimento
cd backend && npm run dev
cd frontend && npm run dev

# Executar suítes de teste
cd backend && npm test
cd frontend && npm test
```
