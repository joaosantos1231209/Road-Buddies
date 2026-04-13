describe('Administração', () => {
  const adminUser = {
    id: 999,
    email: 'admin@loba.com',
    username: 'Admin LOBA',
    role: 'ADMIN',
    isAdmin: true,
    isVerified: true,
    vehicleInfo: null,
  };

  const mockUsers = [
    {
      id: 1,
      username: 'User Um',
      email: 'u1@loba.com',
      role: 'USER',
      isVerified: true,
      isAdmin: false
    },
    {
      id: 2,
      username: 'User Dois',
      email: 'u2@loba.com',
      role: 'USER',
      isVerified: false,
      isAdmin: false
    }
  ];

  beforeEach(() => {
    cy.login(adminUser);
    cy.intercept('GET', '**/api/cities', { body: [] }).as('getCities');
    cy.intercept('GET', '**/api/trips', { body: { trips: [] } }).as('getTrips');
    cy.intercept('GET', '**/api/messages/unread', { body: { unreadCount: 0 } }).as('getUnread');
    cy.intercept('GET', '**/api/matches', { body: { matches: [] } }).as('getMatches');
    // Intercept admin users -- fired on AdminPanel mount, aliased for reference
    cy.intercept('GET', '**/api/users', { body: mockUsers }).as('getUsers');
  });

  it('deve mostrar o link de Administração na sidebar', () => {
    cy.visit('/dashboard');
    cy.waitForApp();

    // Como é admin, deve ter o link "Administração" na sidebar
    cy.contains('Administração').should('be.visible');
  });

  it('deve navegar para o painel de administração e listar utilizadores', () => {
    cy.visit('/dashboard');
    cy.waitForApp();

    cy.contains('Administração').click();

    // Aguardar pelo conteúdo diretamente (o request pode já ter ocorrido)
    cy.contains('User Um', { timeout: 15000 }).should('be.visible');
    cy.contains('User Dois').should('be.visible');
    // O utilizador pendente deve ter label "Pendente"
    cy.contains('Pendente').should('be.visible');
  });

  it('deve conseguir aprovar um utilizador pendente', () => {
    cy.intercept('PUT', '**/api/users/2/verify', {
      statusCode: 200,
      body: { user: { ...mockUsers[1], isVerified: true } }
    }).as('verifyUser');

    cy.visit('/dashboard');
    cy.waitForApp();

    cy.contains('Administração').click();

    // Aguardar pelo conteúdo do painel
    cy.contains('Aprovar Conta', { timeout: 15000 }).first().click();
    cy.wait('@verifyUser');
  });
});
