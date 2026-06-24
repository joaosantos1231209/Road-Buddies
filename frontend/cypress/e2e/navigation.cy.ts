describe('Navegação e Autenticação Geral', () => {
  beforeEach(() => {
    cy.login(); 
    cy.intercept('GET', '**/api/cities', { body: [] }).as('getCities');
    cy.intercept('GET', '**/api/messages/unread', { body: { unreadCount: 0 } }).as('getUnread');
    cy.intercept('GET', '**/api/matches', { body: { matches: [] } }).as('getMatches');
    cy.intercept('GET', '**/api/trips', { body: { trips: [] } }).as('getTrips');
  });

  it('deve conseguir navegar entre os modos da aplicação sem falhas', () => {
    cy.visit('/dashboard');
    cy.waitForApp();

    // Dashboard — verifica conteúdo específico da secção
    cy.contains('Dashboard').should('be.visible');
    cy.contains('Criar Oferta / Pedido').should('be.visible');

    // Próximas Viagens — verifica que carrega a lista (mesmo que vazia)
    cy.contains('Próximas Viagens').click();
    cy.url().should('include', '/dashboard');
    cy.contains('Nenhuma viagem encontrada com os filtros selecionados.').should('be.visible');

    // Minhas Viagens — verifica tabs de conteúdo
    cy.contains('Minhas Viagens').click();
    cy.contains('Histórico').should('be.visible');
    cy.contains('Matches').should('be.visible');

    // Perfil — verifica dados do utilizador mockado
    cy.contains('Perfil').click();
    cy.contains('Informações Pessoais').should('be.visible');
    cy.contains('João Santos').should('be.visible');
  });

  it('deve realizar logout com sucesso e limpar sessão', () => {
    cy.visit('/dashboard');
    cy.waitForApp();

    cy.contains('Log Out').click();

    // Validar que o botão de logout desapareceu (indicando que saímos do Dashboard)
    cy.contains('Log Out').should('not.exist');

    // LocalStorage deve estar limpa da chave Cypress
    cy.window().its('localStorage').invoke('getItem', '__CYPRESS_MOCK_USER__').should('be.null');

    // Deve mostrar o painel de Login
    cy.contains('Login', { timeout: 10000 }).should('be.visible');
  });
});
