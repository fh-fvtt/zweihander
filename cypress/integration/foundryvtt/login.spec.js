before(() => {
  // create a new world for testing
  cy.visit('localhost:30000');

  cy.get('#create-world').click();

  // wait for world configuration to render; not ideal, but other methods are inconsistent
  cy.wait(1000);

  cy.get('input[name="title"]').type('Cypress Zweihander Test');

  cy.get('select[name="system"]').select('Zweihänder Grim & Perilous RPG').should('have.value', 'zweihander');

  cy.get('button[title="Create World"]').click();

  // launch the newly created world
  cy.get('[data-package-id="cypress-zweihander-test"] > .package-controls > [name="action"]').click();

  cy.wait(1000);
})


describe('Character Creation', () => {
  it('enters Basic Tier', () => {
    console.log('a')
  });

  it('enters Intermediate Tier', () => {
    console.log('b')
  });
});

describe('Rolls', () => {
  it('rolls a Weapon attack', () => {
    console.log('c')
  });
});