# Algoritmo de Matchmaking

## Conceito e Objetivo
O algoritmo de matchmaking é o motor inteligente da plataforma. O seu objetivo não é forçar reservas de lugares automáticas, mas sim encontrar a viagem perfeita. Ele analisa as necessidades dos passageiros (pedidos NEEDRIDE) com as ofertas dos condutores (viagens PROVIDER), notificando os passageiros quando há compatibilidade, deixando a decisão final de reserva sempre nas mãos dos utilizadores.

## Quando é utilizado o Algoritmo?
Pode ser acionado em dois momentos diferentes:
- **Sempre que um utilizador cria uma oferta de viagem (PROVIDER).** O algoritmo procura se já existe algum pedido de NEEDRIDE no sistema, que possa ser compatível com essa viagem criada.
- **Sempre que um utilizador cria um pedido de viagem (NEEDRIDE).** O algoritmo procura se existe alguma oferta de viagem no sistema, que possa ser compatível com o pedido criado.

## Filtros de Validação
Para que duas viagens sejam consideradas um Match, têm de passar obrigatoriamente em 4 testes:
1. **Compatibilidade de Status**: O sistema garante que opostos se atraem. Uma viagem só é validada se o match for entre um PROVIDER (condutor) e um NEEDRIDE (passageiro).
2. **Coincidência de Data**: O sistema compara o `departureTime` das duas viagens. Para existir match, ambas têm de ocorrer no mesmo dia (comparação por data local, ignorando a hora).
3. **Coincidência de Rota**: O algoritmo cruza as cidades. A origem do pedido tem de estar na origem da oferta (e vice-versa), e o destino tem de coincidir com o destino. O sistema garante que a direção da viagem é a mesma.
4. **Disponibilidade de Lugares**: O sistema verifica ativamente se a viagem do condutor (PROVIDER) tem lugares disponíveis. Se o carro já estiver cheio, a viagem é ignorada.

## Resultado (Ação do Sistema)
Quando o algoritmo valida as regras com sucesso na sua pesquisa, executa a ação principal:
- **Notificação por E-mail**: Dispara um e-mail automático apenas para o passageiro (NEEDRIDE), informando-o de que foi encontrada uma boleia compatível com o seu pedido e incluindo um link direto para o dashboard. O condutor não é notificado nesta fase para evitar spam.
- **Aba 'Minhas Viagens'**: A viagem fica imediatamente disponível na secção 'Minhas Viagens' do passageiro para que este possa proceder à sua reserva manual.

## Fluxo de Matchmaking

[Fluxo de Matchmaking](fluxo-matchmaking.md)
