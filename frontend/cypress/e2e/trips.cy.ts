describe('Gestão de Viagens', () => {
  const future = new Date(Date.now() + 86400000 * 30).toISOString();

  const mockTrips = [
    {
      id: 201,
      userId: 999, // outro utilizador
      type: 'PROVIDER',
      originId: 1,
      destinationId: 2,
      departureTime: future,
      availableSeats: 3,
      status: 'ACTIVE',
      creator: { username: 'Condutor Mocked' },
      participants: []
    }
  ];

  beforeEach(() => {
    cy.login(); // utilizador id:123
    cy.intercept('GET', '**/api/cities', {
      body: [
        { id: 1, name: 'Lisboa', isOffice: true, isActive: true },
        { id: 2, name: 'Porto', isOffice: true, isActive: true }
      ]
    }).as('getCities');
    cy.intercept('GET', '**/api/messages/unread', { body: { unreadCount: 0 } }).as('getUnread');
    cy.intercept('GET', '**/api/matches', { body: { matches: [] } }).as('getMatches');
  });

  it('deve listar viagens disponíveis para reservar', () => {
    cy.intercept('GET', '**/api/trips', { body: { trips: mockTrips } }).as('getTrips');

    cy.visit('/dashboard');
    cy.waitForApp();

    // Navegar para Próximas Viagens
    cy.contains('Próximas Viagens').click();

    // Deve aparecer a viagem Lisboa → Porto do condutor mockado (com timeout)
    cy.contains('Condutor Mocked', { timeout: 15000 }).should('be.visible');
    // Deve ter um botão de Reservar
    cy.contains('Reservar').should('be.visible');
  });
  it('deve reservar uma viagem com sucesso', () => {
    cy.intercept('GET', '**/api/trips', { body: { trips: mockTrips } }).as('getTrips');
    cy.intercept('POST', '**/api/trips/201/join', {
      statusCode: 200,
      body: { message: 'Reserva confirmada' }
    }).as('joinTrip');

    cy.visit('/dashboard');
    cy.waitForApp();

    cy.contains('Próximas Viagens').click();

    // Validar que o fetch injetou o dado antes de clicar (evita Clicks em botões não existentes/limpos)
    cy.contains('Condutor Mocked', { timeout: 15000 }).should('be.visible');

    // Mudar o interceptor do react query logo antes de ele recarregar com getTrips após onSuccess
    cy.intercept('GET', '**/api/trips', {
      body: {
        trips: [{
          ...mockTrips[0],
          participants: [{ userId: 123, status: 'ACCEPTED', user: { username: 'João Santos' } }]
        }]
      }
    }).as('getTripsAfterJoin');
    
    cy.contains('Reservar').first().click();
    cy.wait('@joinTrip');
  });

  it('deve navegar para o formulário de criação de viagem', () => {
    cy.intercept('GET', '**/api/trips', { body: { trips: [] } }).as('getTrips');

    cy.visit('/dashboard');
    cy.waitForApp();

    cy.contains('Criar Oferta / Pedido').click();

    cy.contains('Publicar Viagem').should('be.visible');
    cy.contains('Origem').should('be.visible');
    cy.contains('Destino').should('be.visible');
  });

  it('deve criar um pedido de boleia (NEEDRIDE) com sucesso', () => {
    const future = new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 16);

    cy.intercept('GET', '**/api/trips', { body: { trips: [] } }).as('getTrips');
    cy.intercept('POST', '**/api/trips', {
      statusCode: 201,
      body: { id: 301, type: 'NEEDRIDE', status: 'ACTIVE' }
    }).as('createTrip');

    cy.visit('/dashboard');
    cy.waitForApp();

    cy.contains('Criar Oferta / Pedido').click();
    cy.contains('Publicar Viagem').should('be.visible');

    // Selecionar tipo NEEDRIDE (já é o default, mas confirmamos)
    cy.get('select').select('Passageiro (pede boleia)');

    // Origem (CitySelector é um Popover, não um <select>)
    cy.contains('label', 'Origem').parent().find('button').click();
    cy.get('[role="dialog"]', { timeout: 5000 }).contains('Lisboa').click();
    cy.get('[role="dialog"]').should('not.exist');

    // Destino
    cy.contains('label', 'Destino').parent().find('button').click();
    cy.get('[role="dialog"]', { timeout: 5000 }).contains('Porto').click();
    cy.get('[role="dialog"]').should('not.exist');

    // Data
    cy.get('input[type="datetime-local"]').type(future);

    cy.contains('button', 'Publicar Viagem').click();
    cy.wait('@createTrip');

    // Após sucesso navega para Próximas Viagens
    cy.contains('Próximas Viagens').should('be.visible');
  });

  it('deve criar uma oferta de boleia (PROVIDER) com viatura pessoal', () => {
    const future = new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 16);

    // Utilizador com viatura pessoal
    cy.login({
      id: 123,
      email: 'joaosantos@loba.com',
      username: 'João Santos',
      role: 'USER',
      isAdmin: false,
      isVerified: true,
      vehicleInfo: JSON.stringify({ brand: 'Toyota Corolla', plate: 'AA-00-BB' })
    });

    cy.intercept('GET', '**/api/trips', { body: { trips: [] } }).as('getTrips');
    cy.intercept('POST', '**/api/trips', {
      statusCode: 201,
      body: { id: 302, type: 'PROVIDER', status: 'ACTIVE' }
    }).as('createTrip');

    cy.visit('/dashboard');
    cy.waitForApp();

    cy.contains('Criar Oferta / Pedido').click();
    cy.contains('Publicar Viagem').should('be.visible');

    cy.get('select').select('Condutor (oferece boleia)');

    cy.contains('label', 'Origem').parent().find('button').click();
    cy.get('[role="dialog"]', { timeout: 5000 }).contains('Lisboa').click();
    cy.get('[role="dialog"]').should('not.exist');

    cy.contains('label', 'Destino').parent().find('button').click();
    cy.get('[role="dialog"]', { timeout: 5000 }).contains('Porto').click();
    cy.get('[role="dialog"]').should('not.exist');

    cy.get('input[type="datetime-local"]').type(future);
    cy.get('input[type="number"]').clear().type('2');

    // Viatura Pessoal já selecionada por defeito — verificar que mostra os dados
    cy.contains('Toyota Corolla').should('be.visible');

    cy.contains('button', 'Publicar Viagem').click();
    cy.wait('@createTrip');

    cy.contains('Próximas Viagens').should('be.visible');
  });

  it('deve mostrar erro ao tentar criar viagem com origem igual ao destino', () => {
    cy.intercept('GET', '**/api/trips', { body: { trips: [] } }).as('getTrips');

    cy.visit('/dashboard');
    cy.waitForApp();

    cy.contains('Criar Oferta / Pedido').click();

    cy.contains('label', 'Origem').parent().find('button').click();
    cy.get('[role="dialog"]', { timeout: 5000 }).contains('Lisboa').click();
    cy.get('[role="dialog"]').should('not.exist');

    cy.contains('label', 'Destino').parent().find('button').click();
    cy.get('[role="dialog"]', { timeout: 5000 }).contains('Lisboa').click();
    cy.get('[role="dialog"]').should('not.exist');

    const future = new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 16);
    cy.get('input[type="datetime-local"]').type(future);

    cy.contains('button', 'Publicar Viagem').click();

    cy.contains('A origem e o destino têm de ser diferentes').should('be.visible');
  });

  it('deve cancelar uma viagem como criador', () => {
    const future = new Date(Date.now() + 86400000 * 30).toISOString();
    const myOwnTrip = {
      id: 401,
      userId: 123,
      type: 'PROVIDER',
      originId: 1,
      destinationId: 2,
      departureTime: future,
      availableSeats: 2,
      status: 'ACTIVE',
      creator: { username: 'João Santos' },
      participants: []
    };

    cy.intercept('GET', '**/api/trips', { body: { trips: [myOwnTrip] } }).as('getTrips');
    cy.intercept('DELETE', '**/api/trips/401', {
      statusCode: 200,
      body: { message: 'Viagem cancelada' }
    }).as('cancelTrip');

    cy.visit('/dashboard');
    cy.waitForApp();

    cy.contains('Minhas Viagens').click();
    cy.contains('Minha Oferta', { timeout: 15000 }).should('be.visible');

    cy.contains('Cancelar').click();

    // Diálogo de confirmação
    cy.contains('Tem a certeza que deseja cancelar esta viagem?').should('be.visible');
    cy.contains('button', 'Confirmar').click();

    cy.wait('@cancelTrip');
  });

  it('deve sair de uma viagem como passageiro', () => {
    const future = new Date(Date.now() + 86400000 * 30).toISOString();
    const tripAsParticipant = {
      id: 402,
      userId: 999, // outra pessoa é o criador
      type: 'PROVIDER',
      originId: 1,
      destinationId: 2,
      departureTime: future,
      availableSeats: 1,
      status: 'ACTIVE',
      creator: { username: 'Condutor Mocked' },
      participants: [{ id: 'p1', userId: 123, status: 'ACCEPTED', user: { username: 'João Santos' } }]
    };

    cy.intercept('GET', '**/api/trips', { body: { trips: [tripAsParticipant] } }).as('getTrips');
    cy.intercept('POST', '**/api/trips/402/leave', {
      statusCode: 200,
      body: { message: 'Saiu da viagem' }
    }).as('leaveTrip');

    cy.visit('/dashboard');
    cy.waitForApp();

    cy.contains('Minhas Viagens').click();
    cy.contains('Boleia Reservada', { timeout: 15000 }).should('be.visible');

    cy.contains('Sair da Viagem').click();

    cy.contains('Tem a certeza que deseja sair desta viagem?').should('be.visible');
    cy.contains('button', 'Confirmar').click();

    cy.wait('@leaveTrip');
  });
});
