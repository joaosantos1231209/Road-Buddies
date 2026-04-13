// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

import '@testing-library/cypress/add-commands';

// Limpar o localStorage mockado antes de cada teste para garantir isolamento
beforeEach(() => {
  // Preservar o mock se o cy.login() já o definiu antes do beforeEach do spec
  // (o localStorage é limpo pelo Cypress entre specs automaticamente)
});

// Garantir limpeza entre specs
afterEach(() => {
  // Não limpar aqui - o Cypress já faz clear entre specs.
  // Se limparmos aqui, quebramos o isolamento do beforeEach.
});
