# Road Buddies - Guia Completo de Funcionalidades

A **Road Buddies** é uma plataforma corporativa de carsharing (boleias) desenhada para ligar colaboradores da LOBA, otimizar deslocações e gerir a frota da empresa de forma eficiente. Abaixo encontras o resumo detalhado de tudo o que o sistema oferece.

---

## 1. Gestão de Conta e Perfil
- **Autenticação Flexível**: Login via Google ou e-mail/palavra-passe.
- **Verificação de E-mail**: Sistema de segurança que exige um código de 6 dígitos enviado por e-mail para ativar novas contas.
- **Perfil Personalizado**:
  - Edição de Nome e Telemóvel.
  - Registo de Viatura Pessoal (Marca, Modelo e Matrícula com formatação automática).
  - **Avatares Inteligentes**: Prioridade para a foto da conta Google. Se não existir (ou se a imagem falhar), o sistema gera automaticamente um círculo com as iniciais do utilizador seguindo a estética da plataforma.

## 2. Gestão de Viagens (Carsharing)
- **Oferecer Boleia (Condutor)**: Publicação de trajetos com definição de Origem, Destino, Data/Hora, Lugares e Viatura (Pessoal ou da Empresa).
- **Pedir Boleia (Passageiro)**: Publicação de necessidades de transporte para que o sistema possa encontrar condutores compatíveis.
- **Reservar Lugar**: Um passageiro pode juntar-se diretamente a uma oferta disponível. O condutor recebe um e-mail de notificação imediato.
- **Filtros Avançados**: Pesquisa de viagens por Origem, Destino e Data. Os filtros de cidade permitem escrever o nome para pesquisa rápida (autocomplete).

## 3. Inteligência e Validações
- **Matchmaking em Tempo Real**: O sistema cruza automaticamente Ofertas e Pedidos. Quando há uma correspondência, ambos os utilizadores são notificados.
- **Prevenção de Conflitos**:
  - Não é permitido criar ou juntar-se a viagens para o mesmo dia e trajeto se já tiver uma reserva ativa.
  - Não é permitido criar viagens onde a Origem e o Destino sejam iguais.
- **Validação de Viaturas**: Só é possível oferecer boleia se os dados da viatura (pessoal ou empresa) estiverem devidamente preenchidos.

## 4. Cancelamentos e Notificações
- **Fluxo de Cancelamento Robusto**:
  - Se um condutor cancela, os passageiros recebem um e-mail automático.
  - Se um passageiro tinha um pedido original que foi "escondido" ao ser aceite, esse pedido volta a ficar **Ativo** e visível no dashboard para que possa encontrar outra boleia.
- **Limpeza de Alertas**: Ao cancelar uma viagem, todas as notificações pendentes (bolinhas vermelhas) e matches associados são limpos automaticamente para manter o dashboard organizado.

## 5. Comunicação (Chat)
- **Chat por Viagem**: Cada viagem tem um canal de conversa privado para os participantes combinarem detalhes.
- **Contagem de Não Lidas**: Alerta visual no menu principal sempre que existem novas mensagens.

## 6. Solicitação de Viaturas (SP)
- **Pedidos Especiais**: Para quando um colaborador precisa de uma viatura da empresa (sem ser boleia).
- **Justificação**: Exige data e motivo, enviando um e-mail detalhado para a administração para aprovação.

## 7. Painel de Administração
- **Gestão de Utilizadores**:
  - Lista completa com ordenação alfabética obrigatória.
  - Pesquisa em tempo real por nome ou e-mail.
  - Paginação (20 utilizadores por página) para performance.
- **Gestão de Cidades**:
  - Adição de novas localidades com validação de duplicados (evita nomes repetidos).
  - Distinção entre Cidades e Escritórios oficiais da LOBA.

## 8. Interface e Experiência (UI/UX)
- **Design Premium**: Interface moderna baseada em tons de azul e cinza, com elementos de design "Shadcn/ui".
- **Paginação Global**: Listas de ofertas e pedidos paginadas para facilitar a navegação.
- **Histórico**: Acesso a todas as viagens passadas com detalhes sobre os participantes e viaturas utilizadas.

---
A Road Buddies é agora uma ferramenta completa, segura e automatizada para a gestão de mobilidade na LOBA!
