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

    // O botão de criar viagem está no header (desktop)
    cy.contains('Criar Oferta / Pedido').click();

    // Deve aparecer o formulário de criação
    cy.contains('Publicar Viagem').should('be.visible');
    // Com os campos de origem e destino
    cy.contains('Origem').should('be.visible');
    cy.contains('Destino').should('be.visible');
  });
});
