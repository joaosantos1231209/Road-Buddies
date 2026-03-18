# Arquitetura da Base de Dados

## Conceito e Objetivo
A plataforma utiliza uma base de dados relacional PostgreSQL, gerida através da ferramenta Drizzle ORM. A arquitetura foi desenhada para garantir a integridade dos dados, evitar duplicação de informação e suportar consultas rápidas e complexas (como as exigidas pelo Algoritmo de Matchmaking). O modelo de dados gira em torno de 6 entidades principais:

1. **Utilizadores (users)**: É a tabela central de identidades. Guarda tanto a informação de segurança gerida pela sincronização com o Firebase (como o Firebase ID, email e tokens de verificação) como os dados de perfil preenchidos pelo colaborador (veículo, regras de viagem, telemóvel). Também define quem tem privilégios de administração (is_admin).

2. **Viagens (trips)**: É o pilar central da organização. Esta tabela guarda dois tipos de registos distintos através da coluna 'status':
    - as ofertas de boleias dos condutores (PROVIDER);
    - os pedidos de viagem dos passageiros (NEEDRIDE).
    Guarda ainda informações exatas de origem, destino, datas, lugares disponíveis e relaciona-se diretamente com o utilizador que a criou.

3. **Participantes da Viagem (trip_participants)**: É uma tabela de ligação. Quando um passageiro se junta à boleia de um condutor, o sistema não duplica viagens. Em vez disso, cria um registo nesta tabela que liga o ID do utilizador ao ID da viagem do condutor. Guarda também o estado dessa participação (por exemplo: 'JOINED') e o ID do pedido oculto gerado automaticamente.

4. **Mensagens (messages)**: Suporta o chat interno da plataforma. Cada mensagem liga um remetente a um destinatário, ambos correspondentes à tabela de utilizadores. Para dar contexto, a mensagem pode também estar ligada diretamente a uma viagem específica.

5. **Matches (matches)**: É a tabela de histórico de matches encontrados. Regista o momento em que o algoritmo encontrou compatibilidade entre duas viagens diferentes.

6. **Cidades (cities)**: Tabela de referência e gestão administrativa. Guarda o catálogo de cidades (nome) usadas nos formulários de criação de viagem. Sendo uma tabela independente, permite aos administradores 'ligar ou desligar' cidades sem quebrar os registos existentes. 

7. **Pedidos de Viatura (sp_requests)**: Tabela de histórico de gestão de veículos. Regista todos os pedidos formais de viaturas da empresa feitos pelos colaboradores aos Serviços Partilhados, guardando a data pretendida, a origem, o destino e a justificação. Funciona como um comprovativo para o utilizador na plataforma

[Diagrama da Base de Dados](base-dados.md)