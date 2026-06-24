describe('Autenticação e Registo', () => {
  const pendingUser = {
    id: 'user_123',
    email: 'worker_pending@loba.com',
    username: 'Novo Worker',
    isVerified: false
  };

  beforeEach(() => {
    // Interceptar chamadas base
    cy.intercept('GET', '**/api/cities', { body: [] }).as('getCities');
    cy.intercept('GET', '**/api/messages/unread', { body: { unreadCount: 0 } }).as('getUnread');
    cy.intercept('GET', '**/api/matches', { body: { matches: [] } }).as('getMatches');
    cy.intercept('GET', '**/api/trips', { body: { trips: [] } }).as('getTrips');
  });

  it('deve permitir o registo de um novo utilizador e carregar ecrã de verificação', () => {
    const localUser = {
      id: 'user_reg_test',
      email: `worker_reg_${Date.now()}@loba.com`,
      username: 'Worker Registo',
      isVerified: false
    };

    cy.intercept('POST', '**/api/auth/sync', {
      statusCode: 201,
      body: { user: localUser }
    }).as('syncUser');

    cy.visit('/');

    cy.contains('Registo').click();

    cy.get('input[placeholder="O seu nome"]').type(localUser.username);
    cy.get('input[type="email"]').last().type(localUser.email);
    cy.get('input[type="password"]').first().type('password123');
    cy.get('input[type="password"]').last().type('password123');

    cy.contains('button', 'Criar Conta').click();

    cy.window().then((win) => {
      win.localStorage.setItem('__CYPRESS_MOCK_USER__', JSON.stringify({
        user: { uid: localUser.id, email: localUser.email, displayName: localUser.username },
        dbUser: localUser
      }));
    });

    cy.contains('Verifica o teu e-mail', { timeout: 15000 }).should('be.visible');
    cy.contains(localUser.email).should('be.visible');
  });

  it('deve permitir validar o código de verificação e entrar na app', () => {
    cy.login(pendingUser);

    cy.intercept('POST', '**/api/auth/verify', {
      statusCode: 200,
      body: { user: { ...pendingUser, isVerified: true } }
    }).as('verifyCode');

    cy.visit('/dashboard');

    cy.get('input[placeholder="000000"]').type('123456');
    cy.contains('button', 'Verificar Conta').click();

    cy.wait('@verifyCode');

    cy.contains('Road Buddies').should('be.visible');
    cy.contains('Dashboard').should('be.visible');
  });

  it('deve mostrar erro ao inserir código inválido', () => {
    cy.login(pendingUser);

    cy.intercept('POST', '**/api/auth/verify', {
      statusCode: 400,
      body: { error: 'Código incorreto' }
    }).as('verifyCodeFail');

    cy.visit('/dashboard');

    cy.get('input[placeholder="000000"]').type('000000');
    cy.contains('button', 'Verificar Conta').click();

    cy.contains('Código incorreto').should('be.visible');
  });
});
