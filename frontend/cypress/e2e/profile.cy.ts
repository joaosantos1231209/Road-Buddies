describe('Perfil de Utilizador', () => {
  beforeEach(() => {
    cy.login(); // utilizador normal mockado
    cy.intercept('GET', '**/api/cities', { body: [] }).as('getCities');
    cy.intercept('GET', '**/api/messages/unread', { body: { unreadCount: 0 } }).as('getUnread');
    cy.intercept('GET', '**/api/matches', { body: { matches: [] } }).as('getMatches');
    cy.intercept('GET', '**/api/trips', { body: { trips: [] } }).as('getTrips');
  });

  it('deve navegar para a página de perfil', () => {
    cy.visit('/dashboard');
    cy.waitForApp();

    cy.contains('Perfil').click();

    // Validar se dados pessoais estão visíveis referenciando os do mock inserido (João Santos)
    cy.contains('Informações Pessoais').should('be.visible');
    cy.contains('João Santos').should('be.visible');
  });

  it('deve conseguir editar informações pessoais', () => {
    cy.intercept('PUT', '**/api/users/profile', {
      statusCode: 200,
      body: { 
        id: 123, 
        username: 'João Silva Editado', 
        email: 'joao.santos@loba.pt',
        phone: '912345678',
        vehicleInfo: ''
      }
    }).as('updateProfile');

    cy.visit('/dashboard');
    cy.waitForApp();
    cy.contains('Perfil').click();

    cy.contains('Informações Pessoais')
      .parent()
      .contains('Editar')
      .click();

    cy.contains('label', 'Telemóvel').next('input').clear().type('912345678');
    cy.contains('label', 'Nome').next('input').clear().type('João Silva Editado');

    cy.contains('button', 'Guardar').first().click();
    cy.wait('@updateProfile');
    
    // Validar atualização de UI visualmente
    cy.contains('João Silva Editado').should('be.visible');
    cy.contains('912345678').should('be.visible');
  });

  it('deve conseguir editar informações da viatura pessoal', () => {
    cy.intercept('PUT', '**/api/users/profile', {
      statusCode: 200,
      body: { 
        id: 123, 
        username: 'João Santos', 
        email: 'joao.santos@loba.pt',
        vehicleInfo: JSON.stringify({ brand: 'Renault Clio', plate: 'AA-00-BB' })
      }
    }).as('updateVehicle');

    cy.visit('/dashboard');
    cy.waitForApp();
    cy.contains('Perfil').click();

    // O botão de Editar na tab de Veículo Pessoal
    cy.contains('Veículo Pessoal')
      .parent()
      .contains('Editar')
      .click();

    cy.contains('label', 'Viatura (Marca e Modelo)').next('input').clear().type('Renault Clio');
    cy.contains('label', 'Matrícula').next('input').clear().type('AA00BB'); // auto formataçado para AA-00-BB

    cy.contains('button', 'Guardar').last().click();

    cy.wait('@updateVehicle');
    
    // Verificar se guardou na interface
    cy.contains('Renault Clio').should('be.visible');
    cy.contains('AA-00-BB').should('be.visible');
  });
});
