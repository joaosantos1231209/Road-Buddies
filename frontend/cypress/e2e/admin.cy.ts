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

    cy.contains('Aprovar Conta', { timeout: 15000 }).first().click();
    cy.wait('@verifyUser');
  });

  it('deve conseguir revogar acesso de um utilizador aprovado', () => {
    cy.intercept('PUT', '**/api/users/1/verify', {
      statusCode: 200,
      body: { user: { ...mockUsers[0], isVerified: false } }
    }).as('revokeUser');

    cy.visit('/dashboard');
    cy.waitForApp();

    cy.contains('Administração').click();

    cy.contains('Revogar Acesso', { timeout: 15000 }).first().click();
    cy.wait('@revokeUser');
  });

  it('deve conseguir tornar um utilizador administrador', () => {
    cy.intercept('PUT', '**/api/users/*/admin', {
      statusCode: 200,
      body: { user: { ...mockUsers[1], isAdmin: true } }
    }).as('promoteUser');

    cy.visit('/dashboard');
    cy.waitForApp();

    cy.contains('Administração').click();

    // Localizar o botão pelo utilizador específico, sem depender da ordem da tabela
    cy.contains('User Dois', { timeout: 15000 })
      .closest('tr')
      .contains('Tornar Admin')
      .click();

    cy.wait('@promoteUser');
  });

  it('deve navegar para a aba de cidades e listar localidades', () => {
    cy.intercept('GET', '**/api/cities', {
      body: [
        { id: 1, name: 'Lisboa', isOffice: true, isActive: true },
        { id: 2, name: 'Aveiro', isOffice: false, isActive: true }
      ]
    }).as('getCities');

    cy.visit('/dashboard');
    cy.waitForApp();

    cy.contains('Administração').click();

    cy.contains('Escritórios e Cidades', { timeout: 15000 }).click();

    cy.contains('Lisboa').should('be.visible');
    cy.contains('Aveiro').should('be.visible');
    cy.contains('Nova Localidade').should('be.visible');
  });

  it('deve conseguir adicionar uma nova cidade', () => {
    cy.intercept('GET', '**/api/cities', { body: [] }).as('getCities');
    cy.intercept('POST', '**/api/cities', {
      statusCode: 201,
      body: { id: 10, name: 'Braga', isOffice: false, isActive: true }
    }).as('addCity');

    cy.visit('/dashboard');
    cy.waitForApp();

    cy.contains('Administração').click();
    cy.contains('Escritórios e Cidades', { timeout: 15000 }).click();

    cy.contains('label', 'Nome da Localidade').next('input').type('Braga');
    cy.contains('button', 'Adicionar Localidade').click();

    cy.wait('@addCity');
  });

  it('deve conseguir pesquisar utilizadores por nome', () => {
    cy.visit('/dashboard');
    cy.waitForApp();

    cy.contains('Administração').click();

    cy.contains('User Um', { timeout: 15000 }).should('be.visible');

    cy.get('input[placeholder="Pesquisar por nome ou e-mail..."]').type('User Dois');

    cy.contains('User Um').should('not.exist');
    cy.contains('User Dois').should('be.visible');
  });
});
