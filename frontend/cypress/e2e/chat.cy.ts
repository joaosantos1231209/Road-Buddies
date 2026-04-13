describe('Comunicação (Chat)', () => {
  const future = new Date(Date.now() + 86400000 * 30).toISOString();

  const myTrip = {
    id: 303,
    userId: 123, // o utilizador mockado É o criador
    type: 'PROVIDER',
    originId: 1,
    destinationId: 2,
    departureTime: future,
    availableSeats: 3,
    status: 'ACTIVE',
    creator: { username: 'João Santos' },
    participants: [
      {
        id: 'p1',
        userId: 456,
        status: 'ACCEPTED',
        user: { username: 'Passageiro Teste' }
      }
    ]
  };

  beforeEach(() => {
    cy.login(); // utilizador id:123
    cy.intercept('GET', '**/api/cities', {
      body: [
        { id: 1, name: 'Lisboa', isOffice: true, isActive: true },
        { id: 2, name: 'Porto', isOffice: true, isActive: true }
      ]
    }).as('getCities');
    cy.intercept('GET', '**/api/matches', { body: { matches: [] } }).as('getMatches');
    cy.intercept('GET', '**/api/messages/unread', {
      body: { unreadCount: 1, unreadByTrip: { '303': 1 } }
    }).as('getUnread');
    cy.intercept('GET', '**/api/trips', { body: { trips: [myTrip] } }).as('getTrips');
  });

  it('deve visualizar a viagem em Minhas Viagens e ter botão de chat', () => {
    cy.visit('/dashboard');
    cy.waitForApp();

    cy.contains('Minhas Viagens').click();

    // A viagem deve aparecer na lista de Minhas Viagens (na subtáb de Próximas viagens)
    cy.contains('Minha Oferta', { timeout: 15000 }).should('be.visible');
    // Deve mostrar o participante inscrito
    cy.contains('Passageiro Teste').should('be.visible');
    // O botão de chat deve existir
    cy.contains('Chat').should('be.visible');
  });

  it('deve abrir o chat da viagem e mostrar mensagens', () => {
    const messages = [
      {
        id: 1,
        senderId: 456,
        content: 'Olá, encontramo-nos às 9h?',
        createdAt: new Date().toISOString(),
        sender: { username: 'Passageiro Teste' }
      }
    ];

    cy.intercept('GET', '**/api/messages/trip/303', {
      body: { messages }
    }).as('getMessages');
    cy.intercept('POST', '**/api/messages/trip/303', {
      statusCode: 201,
      body: {
        message: {
          id: 2,
          senderId: 123,
          content: 'Confirmado!',
          createdAt: new Date().toISOString(),
          sender: { username: 'João Santos' }
        }
      }
    }).as('sendMessage');

    cy.visit('/dashboard');
    cy.waitForApp();

    cy.contains('Minhas Viagens').click();

    // Aguardar pela viagem aparecer
    cy.contains('Chat', { timeout: 15000 }).first().click();
    cy.wait('@getMessages');

    // A mensagem do passageiro deve aparecer
    cy.contains('Olá, encontramo-nos às 9h?').should('be.visible');
  });
});
