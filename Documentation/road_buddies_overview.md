# Road Buddies - Guia Completo e Especificações da Plataforma

A **Road Buddies** é uma plataforma corporativa de carsharing (boleias) topo de gama, desenhada exclusivamente para a **LOBA**. O seu objetivo é ligar colaboradores, otimizar deslocações entre escritórios e gerir a frota da empresa com uma experiência de utilizador premium e totalmente responsiva.

---

## 1. Gestão de Utilizadores e Segurança
*   **Autenticação Google Integrada**: Acesso rápido e seguro utilizando a conta corporativa. O sistema extrai automaticamente o nome, e-mail e foto de perfil.
*   **Sistema de Verificação**: Novos utilizadores entram num estado "Pendente". Apenas Administradores podem verificar contas, garantindo que apenas colaboradores autorizados acedem à rede.
*   **Perfis de Utilizador**:
    *   **Identidade**: Nome, e-mail e telemóvel.
    *   **Viatura Pessoal**: Possibilidade de registar marca/modelo e matrícula (com validação estrita de formato português `XX-XX-XX`).
    *   **Avatares Dinâmicos**: O sistema utiliza a imagem do Google por defeito. Caso falhe ou não exista, gera iniciais automáticas com cores condizentes com a marca.

## 2. Ecossistema de Viagens
A plataforma divide-se em dois fluxos principais que se cruzam inteligentemente:
*   **Ofertas de Boleia (Condutor)**:
    *   Publicação com escolha de viatura (Pessoal ou da Empresa).
    *   Definição de lugares disponíveis e horário preciso.
*   **Pedidos de Boleia (Passageiro)**:
    *   Registo de necessidade de transporte para um determinado trajeto e data.
*   **Dashboards Inteligentes**:
    *   **Próximas Viagens**: Lista filtrável por data e cidade (com autocomplete).
    *   **Minhas Viagens**: Central de controlo para as viagens onde o utilizador participa, dividida em:
        *   *Próximas*: Viagens agendadas.
        *   *Matches*: Sugestões automáticas do sistema.
        *   *Histórico*: Registo completo de todas as viagens passadas (mostrando condutor, participantes e viatura).
        *   *Pedidos de Viatura*: Histórico de requisições SP.

## 3. Motor de Matchmaking e Notificações
*   **Cruzamento Automático**: O sistema analiza constantemente os pedidos e ofertas. Se houver compatibilidade de trajeto e horário, ambos os utilizadores vêem a sugestão no separador "Matches".
*   **Alertas Visuais**: Notificações em tempo real (bolas vermelhas) no menu lateral para novas mensagens de chat ou novos matches.
*   **Notificações por E-mail**: Envio automático de e-mails quando:
    *   Um passageiro reserva lugar numa viagem.
    *   Uma viagem é cancelada pelo condutor.

## 4. Comunicação Integrada (Chat)
*   **Canais Privados**: Cada viagem ativa cria automaticamente um chat de grupo para os participantes.
*   **Gestão de Lidas**: Contagem inteligente de mensagens não lidas por utilizador e por viagem.

## 5. Solicitação de Viaturas da Empresa (SP)
*   Funcionalidade dedicada para deslocações de trabalho que requerem uma viatura da frota mas não envolvem carsharing.
*   Inclui formulário de justificação e envio de relatório para a administração.

## 6. Experiência Mobile (Responsividade Total)
*   **Layout Adaptativo**: A interface transforma-se completamente em dispositivos móveis.
*   **Menu Lateral (Sidebar)**: Toggle inteligente que permite navegar sem obstruir o conteúdo.
*   **Ações de Topo**: Para manter o design limpo em ecrãs pequenos, as ações de "Criar Viagem" movem-se do cabeçalho para a sidebar, com indicações claras no topo do ecrã.
*   **Tabelas de Scroll**: Todas as tabelas de dados suportam scroll horizontal em mobile, garantindo que colunas como "Detalhes" ou "Estado" nunca fiquem cortadas.

## 7. Painel de Administração (Backoffice)
*   **Controlo de Utilizadores**: Alteração de permissões (Tornar Admin), Verificação de contas e pesquisa global.
*   **Base de Dados de Cidades**: Gestão da lista de destinos permitidos, com distinção entre cidades gerais e escritórios oficiais (LOBA Offices).

## 8. Especificações Técnicas
*   **Frontend**: React.js com Vite, Tailwind CSS para design responsivo e Lucide Icons.
*   **Estado e Dados**: TanStack Query (React Query) para sincronização de dados e Wouter para rotas.
*   **Backend**: Node.js com Express.
*   **Base de Dados**: PostgreSQL (via Drizzle ORM) para persistência robusta.
*   **Autenticação**: Firebase Auth (Google Provider).

---
*Documento atualizado em: 27 de Março de 2026*
