/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      login(dbUser?: any): Chainable<void>;
      waitForApp(): Chainable<void>;
    }
  }
}

/**
 * cy.login() — Injeta um utilizador mockado no localStorage antes de visitar a página.
 * Isto garante que o AuthContext o detete instantaneamente, sem precisar do Firebase.
 */
Cypress.Commands.add('login', (customDbUser?: any) => {
  const dbUser = customDbUser ?? {
    id: 123,
    email: 'joaosantos@loba.com',
    username: 'João Santos',
    role: 'USER',
    isAdmin: false,
    isVerified: true,
    vehicleInfo: null,
  };

  const mockUser: any = {
    uid: String(dbUser.id),
    email: dbUser.email,
    displayName: dbUser.username,
    emailVerified: true,
    getIdToken: () => Promise.resolve('fake-cypress-token-123'),
  };

  const payload = { user: mockUser, dbUser };
  localStorage.setItem('__CYPRESS_MOCK_USER__', JSON.stringify(payload));
});

/**
 * cy.waitForApp() — Aguarda que o conteúdo principal do Dashboard apareça.
 */
Cypress.Commands.add('waitForApp', () => {
  // Esperar que a app saia do estado de loading (A carregar Road Buddies...)
  cy.contains('A carregar Road Buddies...').should('not.exist');
  // E que o sidebar esteja visível
  cy.contains('Road Buddies', { timeout: 15000 }).should('be.visible');
});

export {};
