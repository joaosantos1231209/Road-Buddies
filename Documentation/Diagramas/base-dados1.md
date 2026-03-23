# Arquitetura da Base de Dados

## Conceito e Objetivo
A plataforma utiliza uma base de dados relacional PostgreSQL, gerida através da ferramenta Drizzle ORM. A arquitetura foi desenhada para garantir a integridade dos dados, evitar duplicação de informação e suportar consultas rápidas e complexas (como as exigidas pelo Algoritmo de Matchmaking). O modelo de dados gira em torno de 8 entidades principais:

1. **Utilizadores (users)**: É a tabela central de identidades. Guarda a informação de segurança gerida pela sincronização com o Firebase (onde o Firebase ID atua como a Chave Primária), bem como os dados de perfil preenchidos pelo colaborador (veículo pessoal, telemóvel, avatar). Define quem tem privilégios de administração (is_admin) e agora suporta também a autenticação OTP, guardando temporariamente o código de verificação de 6 dígitos e a sua respetiva validade de expiração.

2. **Viagens (trips)**: É o pilar central da organização. Esta tabela guarda dois tipos de registos distintos através da coluna 'type':
    - as ofertas de boleias dos condutores (PROVIDER);
    - os pedidos de viagem dos passageiros (NEEDRIDE).
    Guarda ainda informações exatas de origem, destino, datas, lugares disponíveis e relaciona-se diretamente com o utilizador que a criou. Regista também se a viatura a ser utilizada é pessoal ou da empresa e os seus detalhes.

3. **Participantes da Viagem (trip_participants)**: É uma tabela de ligação. Quando um passageiro se junta à boleia de um condutor, o sistema não duplica viagens. Em vez disso, cria um registo nesta tabela que liga o ID do utilizador ao ID da viagem do condutor, registando o momento exato em que a pessoa se juntou (joined_at).

4. **Mensagens (messages)**: Suporta o chat interno da plataforma. Para garantir que as conversas têm o contexto certo, o sistema não liga a mensagem a um destinatário específico, mas sim à tabela de Viagens. Cada mensagem liga um remetente (users) a uma viagem (trips), funcionando como um chat focado nessa boleia.

5. **Leituras de Chat (chat_reads)**: Tabela especializada para gestão granular de notificações. Guarda, para cada utilizador e para cada viagem que ele integra, a data e hora exata em que o chat foi aberto pela última vez. Isto permite à plataforma calcular individualmente quem tem mensagens novas/não lidas num chat de grupo e ativar as notificações In-App.

6. **Matches (matches)**: É a tabela de matches encontrados. Regista o momento em que o algoritmo encontrou compatibilidade entre duas viagens diferentes. Inclui um estado de leitura fundamental (is_read) para gerir as notificações In-App e os alertas visuais nos menus.

7. **Cidades (cities)**: Tabela de referência e gestão administrativa. Guarda o catálogo de cidades (nome) usadas nos formulários de criação de viagem. Sendo uma tabela independente, permite aos administradores 'ligar ou desligar' cidades sem quebrar os registos existentes. Permite identificar quais destas localidades são escritórios oficiais da empresa (is_office).

8. **Pedidos de Viatura (sp_requests)**: Tabela de histórico de gestão de veículos. Regista todos os pedidos formais de viaturas da empresa feitos pelos colaboradores aos Serviços Partilhados, relacionando as chaves estrangeiras de origem e destino diretamente com a tabela de cidades. Guarda também a data pretendida e a justificação, funcionando como um histórico e comprovativo para o utilizador na plataforma.

[Diagrama da Base de Dados](base-dados.md)