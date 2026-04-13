describe('Solicitar Viatura SP', () => {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  beforeEach(() => {
    cy.login(); 
    cy.intercept('GET', '**/api/cities', {
      body: [
        { id: 1, name: 'Lisboa', isOffice: true, isActive: true },
        { id: 2, name: 'Porto', isOffice: true, isActive: true }
      ]
    }).as('getCities');
    cy.intercept('GET', '**/api/messages/unread', { body: { unreadCount: 0 } }).as('getUnread');
    cy.intercept('GET', '**/api/matches', { body: { matches: [] } }).as('getMatches');
    cy.intercept('GET', '**/api/trips', { body: { trips: [] } }).as('getTrips');
  });

  it('deve submeter o formulário de Solicitação de Viatura (SP)', () => {
    cy.intercept('POST', '**/api/sp-requests', {
      statusCode: 201,
      body: { 
        id: 50, 
        userId: 123, 
        originId: 1,
        destinationId: 2,
        dateNeeded: tomorrow,
        justification: 'Reunião de negócios com o cliente importante',
        status: 'PENDING'
      }
    }).as('createSpRequest');

    cy.visit('/dashboard');
    cy.waitForApp();

    // Em mobile seria no menu, mas em desktop temos header actions
    // Para ser testável flexivelmente, asseguramos janela grande
    cy.viewport(1280, 720);
    cy.contains('Solicitar Viatura (SP)').click();

    // Verificamos elementos no DOM da rota "solicitar"
    cy.contains('Solicitar Viatura').should('be.visible');

    // Preencher origem e destino (selectors das Cidades em Popover Command)
    cy.contains('label', 'Origem').parent().find('button').click();
    cy.get('[role="dialog"]', { timeout: 5000 }).contains('Lisboa').click();
    cy.get('[role="dialog"]').should('not.exist'); // Garantir que fechou antes de seguir

    cy.contains('label', 'Destino').parent().find('button').click();
    cy.get('[role="dialog"]', { timeout: 5000 }).contains('Porto').click();
    cy.get('[role="dialog"]').should('not.exist');

    // Preencher data e justificação (usando force:true se necessário, mas type deve funcionar)
    cy.contains('label', 'Data Necessária').next('input').type(tomorrow);
    cy.contains('label', 'Justificação').next('textarea').type('Reunião de negócios com o cliente importante');

    // Submeter o pedido via form para garantir trigger da mutation
    cy.get('form').submit();
    cy.wait('@createSpRequest', { timeout: 20000 });

    // Após sucesso, a app redireciona para "Minhas Viagens"
    cy.contains('Minhas Viagens').should('be.visible');
    cy.contains('Histórico').should('be.visible');
  });
});
