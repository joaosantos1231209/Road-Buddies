describe('Fluxo de Correspondência (Matching)', () => {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const seekerUser = {
    id: 'seeker_123',
    email: 'seeker@loba.com',
    username: 'Buscador',
    isVerified: true
  };

  const mockTrip = {
    id: 10,
    userId: 'provider_456',
    type: 'PROVIDER',
    originId: 1,
    destinationId: 2,
    departureTime: tomorrow + 'T10:00:00',
    availableSeats: 3,
    status: 'ACTIVE',
    creator: { username: 'Condutor Fixo' }
  };

  const mockMatch = {
    id: 5,
    providerTripId: 10,
    seekerTripId: 20, // A viagem que o Seeker teria criado
    status: 'PENDING',
    isRead: false,
    providerTrip: mockTrip
  };

  beforeEach(() => {
    cy.login(seekerUser);
    cy.intercept('GET', '**/api/cities', {
      body: [
        { id: 1, name: 'Lisboa' },
        { id: 2, name: 'Porto' }
      ]
    }).as('getCities');
    cy.intercept('GET', '**/api/messages/unread', { body: { unreadCount: 0 } }).as('getUnread');
    cy.intercept('GET', '**/api/trips', { body: { trips: [] } }).as('getTrips');
  });

  it('deve mostrar notificação de match quando uma viagem compatível é encontrada', () => {
    // Simulamos que já existe um match não lido para o utilizador
    cy.intercept('GET', '**/api/matches', {
      body: { matches: [mockMatch] }
    }).as('getMatches');

    cy.visit('/dashboard');
    cy.waitForApp();
    cy.wait('@getMatches');

    // Verificamos se existe o badge de notificação na aba "Minhas Viagens"
    cy.contains('Minhas Viagens', { timeout: 10000 }).find('span').should('be.visible'); 
    
    cy.contains('Minhas Viagens').click();
    cy.get('button').contains('Matches').click();

    // Deve listar o match
    cy.contains('Match Encontrado').should('be.visible');
    cy.contains('Condutor Fixo').should('be.visible');
    cy.contains('Lisboa → Porto').should('be.visible');
  });

  it('deve permitir marcar um match como lido e remover o badge', () => {
    cy.intercept('GET', '**/api/matches', {
      body: { matches: [mockMatch] }
    }).as('getMatches');

    cy.intercept('POST', '**/api/matches/mark-read', {
      statusCode: 200,
      body: { success: true }
    }).as('markRead');

    cy.visit('/dashboard');
    cy.waitForApp();
    cy.wait('@getMatches');

    // Badge visível antes de entrar na aba
    cy.contains('Minhas Viagens').find('span').should('be.visible');

    // Redefinir o intercept após o primeiro request já ter sido servido,
    // para que as chamadas seguintes retornem o match como lido
    cy.intercept('GET', '**/api/matches', {
      body: { matches: [{ ...mockMatch, isRead: true }] }
    }).as('getMatchesAfterRead');

    cy.contains('Minhas Viagens').click();
    cy.get('button').contains('Matches').click();

    cy.wait('@markRead');

    // Badge deve desaparecer após marcar como lido
    cy.contains('Minhas Viagens').find('span').should('not.exist');
  });
});
