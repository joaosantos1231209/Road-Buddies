# Road Buddies - Projeto Estágio

Projeto de João Santos, supervisionado por Nuno Alves. Desenvolvido na GLOBAZ SA, em Oliveira de Azeméis.

## Contexto

A LOBA conta com vários escritórios em Portugal (7 escritórios: Oliveira de Azeméis, Aveiro, Guarda, Lisboa, Porto, Braga, Leiria) e existe constante necessidade de deslocações entre eles. Muitos colaboradores viajam com frequência, mas existe dificuldade em coordenar boleias e partilhar viagens, o que potencia custos e tempo desperdiçado.
O objetivo deste projeto é criar uma plataforma que potencie o carsharing entre colaboradores, que permita:
- Registar uma viagem futura (local de partida, destino, horários e lugares disponíveis)
- Que outros colaboradores se associem à viagem, podendo reservar lugar e deixar comentários.
- Que um colaborador possa indicar que quer viajar de A para B num dia específico, recebendo notificação caso surja uma viagem compatível.

## Utilizadores

Existem neste projeto 2 utilizadores essenciais:

- **User**: É o colaborador que pode atuar de duas formas diferentes. Pode ser como condutor (PROVIDER), que usa o seu carro e disponibiliza lugares para os colegas. E pode ser como passageiro (NEEDRIDE), que precisa de arranjar transporte de outro colega.
- **Administrador**: É, antes de mais, um colaborador comum (podendo atuar como condutor ou passageiro). No entanto, possui privilégios adicionais de sistema que lhe dão acesso a uma área restrita para gerir configurações gerais, como a lista de cidades e a promoção de outros perfis a administradores.

## Autenticação

A autenticação dos diversos utilizadores é realizada através da conta google, podendo ser a conta da empresa, mas também a conta pessoal. Em alternativa, pode ser utilizado o método tradicional de e-mail e palavra-passe para quem preferir não associar a conta Google.

[Fluxo de Autenticação - Explicação](Diagramas/fluxo-autenticacao1.md)

[Fluxo de Autenticação - Diagrama](Diagramas/fluxo-autenticacao.md)

## Funcionalidades

- **Dashboard**: Lista as próximas viagens disponíveis, ordenadas por data ou por localizações.
- **Minhas Viagens**: Organizada por viagens ativas, correspondências (matches) e histórico de viagens.
- **Detalhes da Viagem**: Informação detalhada sobre o trajeto, condutor, observações e lista de participantes atualizada.
- **Perfil**: Gerir dados pessoais, preferências de condutor (veículo, lugares), regras de passageiros e o registo da viatura pessoal (para preenchimento automático em futuras viagens).
- **Administração de Cidades**: Área restrita para administradores gerirem a lista de cidades portuguesas disponíveis e as suas coordenadas geográficas.
- **Autenticação**: Login e verificação de e-mail.
- **Gestão de Frota (Serviços Partilhados)**: Capacidade de o colaborador solicitar uma viatura da empresa para uma deslocação específica, gerando um pedido formal por e-mail e mantendo um histórico de solicitações na plataforma.

## Tecnologias Utilizadas

- **Frontend**: React com TypeScript, utilizando Tailwind CSS para estilização e ShadcnUI/Radix UI para componentes.
- **Backend**: Node.js com a framework Express.
- **Base de Dados**: Relacional, utilizando PostgreSQL gerida através do Drizzle ORM.

[Arquitetura da Base de Dados - Explicação](Diagramas/base-dados1.md)

[Arquitetura da Base de Dados - Diagrama](Diagramas/base-dados.md)

- **Autenticação**: Firebase Auth, para gestão de logins (suportando Google OAuth e Email/Password).
- **Envio de e-mail**: SendGrid, para o envio de e-mails automáticos de notificações (matches, participações, cancelamentos).

## Fluxos de Utilização
[Fluxo Global dos Utilizadores - Diagrama](Diagramas/fluxo-global.md)

[Fluxo de Colaboradores - Diagrama](Diagramas/fluxo-utilizadores.md)
### Fluxo do Condutor (PROVIDER)
1. O colaborador acede à plataforma e cria uma nova viagem.
2. O formulário adapta-se e pede dados precisos: origem, destino, data e hora de partida, lugares disponíveis e o tipo de veículo a utilizar (Viatura pessoal ou da Empresa). Se selecionar viatura pessoal, os dados são preenchidos automaticamente através do seu perfil.
3. Após submeter, a viagem fica visível no dashboard para todos os colegas visualizarem.
4. O condutor pode acompanhar na aba "Minhas Viagens" quem se juntou à viagem, os lugares disponíveis e pode usar o sistema de mensagens para combinar detalhes com os passageiros.

### Fluxo do Passageiro (NEEDRIDE)
O passageiro pode fazer 2 coisas:
1. Verificar no dashboard que viagens estão disponíveis e juntar-se a uma das viagens disponíveis, ficando o lugar reservado.
2. O passageiro não encontra nenhuma data conveniente e cria um pedido de boleia. Indicando de onde parte e para onde vai. Fica a aguardar que o sistema encontre um condutor disponível.

### Fluxo de Solicitação de Viatura (Serviços Partilhados)
[Fluxo de Solicitação de Viatura - Diagrama](Diagramas/fluxo-viat.md)
1. O colaborador necessita de um carro da empresa para uma deslocação e acede à funcionalidade de 'Solicitar Viatura'.
2. O formulário pré-preenche os seus dados (nome e e-mail) e solicita a origem, o destino, data e uma breve justificação.
3. Ao submeter, a aplicação envia automaticamente um e-mail formatado para os Serviços Partilhados (SP) com os detalhes do pedido. 
4. O processo de aprovação e entrega da chave decorre fora da aplicação (via e-mail direto entre o colaborador e os SP).
5. O colaborador tem acesso a um histórico na plataforma onde pode consultar todas as solicitações de viaturas que já realizou.

### Fluxo do Administrador
[Fluxo de Administrador - Diagrama](Diagramas/fluxo-admin.md)
1. O administrador faz login e acede à área reservada da administração.
2. Na secção 'Cidades', pode fazer a gestão das cidades: adicionar ou editar as existentes e as suas coordenadas geográficas.
3. Ao gravar, o sistema é imediatamente atualizado para todos os colaboradores.
4. Na secção 'Perfis', tem acesso à gestão de utilizadores, onde pode selecionar um colaborador comum e promovê-lo a administrador.

### O Sistema
Para que os utilizadores não tenham de perder tempo a procurar manualmente, a aplicação faz boas partes automaticamente.
- **Matchmaking Automático**: Assim que um pedido é criado (NEEDRIDE), o sistema procura se existe algum condutor (PROVIDER) com datas compatíveis. Se houver, a plataforma avisa o utilizador.

[Fluxo de Matchmaking - Explicação](Diagramas/fluxo-matchmaking1.md)

[Fluxo de Matchmaking - Diagrama](Diagramas/fluxo-matchmaking.md)
- **Gestão de Lugares**: Sempre que um passageiro junta-se a uma viagem, o número de lugares disponíveis nessa viagem é automaticamente atualizado, evitando excesso de reservas.

[Fluxo da Gestão de Lugares - Diagrama](Diagramas/fluxo-lugares.md)
- **Gestão de Datas**: O formulário adapta-se consoante o tipo de utilizador; se for um condutor, exige que se coloque data e hora exatas, mas se for um pedido de boleia dá para colocar intervalos de tempo flexíveis.
- **Ocultação**: Se um utilizador tinha feito um pedido de boleia, mas juntou-se a uma viagem coincidente, então o seu pedido de boleia é ocultado da dashboard.
- **Notificações**: O sistema envia e-mails em momentos-chave: quando um match é encontrado, para informar que um utilizador se juntou à viagem, para avisar caso a viagem seja cancelada, e para encaminhar pedidos de viaturas diretamente para o departamento de Serviços Partilhados.

[Fluxo de Notificações por E-Mail - Explicação](Diagramas/fluxo-email1.md)

[Fluxo de Notificações por E-Mail - Diagrama](Diagramas/fluxo-email.md)

