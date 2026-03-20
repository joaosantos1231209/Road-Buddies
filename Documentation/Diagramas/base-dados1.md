# Arquitetura da Base de Dados

## Conceito e Objetivo
A plataforma utiliza uma base de dados relacional PostgreSQL, gerida através da ferramenta Drizzle ORM. A arquitetura foi desenhada para garantir a integridade dos dados, evitar duplicação de informação e suportar consultas rápidas e complexas (como as exigidas pelo Algoritmo de Matchmaking). O modelo de dados gira em torno de 7 entidades principais:

1. **Utilizadores (users)**: É a tabela central de identidades. Guarda tanto a informação de segurança gerida pela sincronização com o Firebase (onde o Firebase ID atua como a Chave Primária) como os dados de perfil preenchidos pelo colaborador (veículo pessoal, telemóvel, avatar). Também define quem tem privilégios de administração (is_admin).

2. **Viagens (trips)**: É o pilar central da organização. Esta tabela guarda dois tipos de registos distintos através da coluna 'type':
    - as ofertas de boleias dos condutores (PROVIDER);
    - os pedidos de viagem dos passageiros (NEEDRIDE).
    Guarda ainda informações exatas de origem, destino, datas, lugares disponíveis e relaciona-se diretamente com o utilizador que a criou. Regista também se a viatura a ser utilizada é pessoal ou da empresa e os seus detalhes.

3. **Participantes da Viagem (trip_participants)**: É uma tabela de ligação. Quando um passageiro se junta à boleia de um condutor, o sistema não duplica viagens. Em vez disso, cria um registo nesta tabela que liga o ID do utilizador ao ID da viagem do condutor, registando o momento exato em que a pessoa se juntou (joined_at).

4. **Mensagens (messages)**: Suporta o chat interno da plataforma. Para garantir que as conversas têm o contexto certo, o sistema não liga a mensagem a um destinatário específico, mas sim à tabela de Viagens. Cada mensagem liga um remetente (users) a uma viagem (trips), funcionando como um chat focado nessa boleia.

5. **Matches (matches)**: É a tabela de histórico de matches encontrados. Regista o momento em que o algoritmo encontrou compatibilidade entre duas viagens diferentes.

6. **Cidades (cities)**: Tabela de referência e gestão administrativa. Guarda o catálogo de cidades (nome) usadas nos formulários de criação de viagem. Sendo uma tabela independente, permite aos administradores 'ligar ou desligar' cidades sem quebrar os registos existentes. Permite identificar quais destas localidades são escritórios oficiais da empresa (is_office).

7. **Pedidos de Viatura (sp_requests)**: Tabela de histórico de gestão de veículos. Regista todos os pedidos formais de viaturas da empresa feitos pelos colaboradores aos Serviços Partilhados, guardando a data pretendida, o destino e a justificação. Funciona como um comprovativo para o utilizador na plataforma.

[Diagrama da Base de Dados](base-dados.md)