describe('Autenticação e Registo', () => {
  const randomEmail = `user${Math.floor(Math.random() * 100000)}@loba.com`;
  const newUser = {
    id: 'user_123',
    email: randomEmail,
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
    // Mock do sync que retorna utilizador não verificado
    cy.intercept('POST', '**/api/auth/sync', {
      statusCode: 201,
      body: { user: newUser }
    }).as('syncUser');

    cy.visit('/');
    
    cy.contains('Registo').click();

    cy.contains('input[type="email"]', randomEmail).should('not.exist'); // ensure clean
    cy.get('input[placeholder="O seu nome"]').type('Novo Worker');
    cy.get('input[type="email"]').last().type(randomEmail);
    cy.get('input[type="password"]').first().type('password123');
    cy.get('input[type="password"]').last().type('password123');
    
    cy.contains('button', 'Criar Conta').click();

    // Injetamos o mock para o AuthContext assumir o estado logado/pendente
    cy.window().then((win) => {
      win.localStorage.setItem('__CYPRESS_MOCK_USER__', JSON.stringify({
        user: { uid: newUser.id, email: newUser.email, displayName: newUser.username },
        dbUser: newUser
      }));
    });

    // Deve mostrar o ecrã de verificação
    cy.contains('Verifica o teu e-mail', { timeout: 15000 }).should('be.visible');
    cy.contains(randomEmail).should('be.visible');
  });

  it('deve permitir validar o código de verificação e entrar na app', () => {
    // Definimos estado inicial como pendente de verificação
    cy.login(newUser); 

    cy.intercept('POST', '**/api/auth/verify', {
      statusCode: 200,
      body: { user: { ...newUser, isVerified: true } }
    }).as('verifyCode');

    cy.visit('/dashboard');

    cy.get('input[placeholder="000000"]').type('123456');
    cy.contains('button', 'Verificar Conta').click();

    cy.wait('@verifyCode');

    // Agora deve carregar o Dashboard real
    cy.contains('Road Buddies').should('be.visible');
    cy.contains('Dashboard').should('be.visible');
  });

  it('deve mostrar erro ao inserir código inválido', () => {
    cy.login(newUser);
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
