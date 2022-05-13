/// <reference types="cypress" />

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

  cy.get('select[name="userid"]').select('Gamemaster');

  cy.get('button[name="join"]').click();

  cy.wait(2000);

  cy.get('#logo').should('be.visible');
});

describe('Fortune Tracker', () => {
  it('should render correctly', () => {
    cy.get('a[title="Game Settings"]').click();

    cy.get('button[data-action="modules"]').click();

    cy.wait(1000);

    cy.get('li[data-module-name="socketlib"]').find('input[type="checkbox"]').click();

    cy.contains('Save Module Settings').click();

    cy.wait(1000);

    cy.get('#fortuneTrackerApp').should('be.visible');
  });
});

describe('Character Creation', () => {
  it('can create an Actor (Player Character)', () => {
    cy.get('a[title="Actors Directory"]').click();

    cy.get('section[data-tab="actors"]')
      .find('button[class="create-document"]')
      .click();

    cy.wait(1000);

    cy.get('input[name="name"]').type(Cypress.env("characterName"));

    cy.get('select[name="type"]').select('Player Character').should('have.value', 'character');

    cy.get('button[data-button="ok"]').click();

    cy.wait(1000);

    cy.get('ol[class="directory-list"]')
      .find('h4[class="document-name"]')
      .find('a')
      .should('have.text', Cypress.env("characterName"));

    cy.get('.character').should('be.visible');
  });

  it('can change Primary Attributes', () => {
    const primaryAttributes = ['combat', 'brawn', 'agility', 'perception', 'intelligence', 'willpower', 'fellowship'];

    for (let pa of primaryAttributes) {
      cy.get(`.pa-${pa}`).find('.pa-value').clear().type('40{enter}');

      cy.get(`.pa-${pa}`).find('.pa-bonus').should('have.text', '4');
    }

    cy.get('[data-testid="movement"]').should('have.text', '7');

    cy.get('[data-testid="initiative"]').should('have.text', '7');

    cy.get('[data-testid="dodge"]').should('have.text', '40');

    cy.get('[data-testid="parry"]').should('have.text', '40');

    cy.get('[data-testid="peril"]').should('have.text', '7');

    // contain is used because of partial template complications
    cy.get('[data-testid="damage"]').should('contain.text', '4');
  });

  it('can add Ancestry (Human)', () => {
    cy.get('[data-item-type="ancestry"]').rightclick({ force: true });

    cy.wait(1000);
  
    cy.get('.compendium').should('be.visible').find('img[title="Human"]').parent().dragTo('.character');

    cy.wait(1000);

    cy.get('.pa-combat').find('.pa-bonus').should('have.text', '5');

    cy.get('.pa-agility').find('.pa-bonus').should('have.text', '3');

    cy.get('.compendium').parents('.window-app').find('.close').click()

    cy.wait(1000);
  });

  describe('Basic Tier', () => {
    it('can purchase Profession', () => {
      cy.get('a[data-tab="tiers"]').click();
  
      cy.get('a[data-item-type="profession"]').rightclick();
  
      cy.wait(1000);
  
      cy.get('.compendium').should('be.visible').find('img[title="Berserker"]').parent().dragTo('.character');
  
      cy.wait(1000);
  
      cy.get('div[data-tab="tiers"]').find('[data-testid="Berserker"]').should('be.visible').click();
  
      cy.wait(1000);

      cy.get('.rp-spent').should('have.value', '900');
    });
  
    it('can purchase Skill Rank', () => {
      cy.get('[data-testid="skillsBasic"]')
        .find('[data-purchase-index="0"]').click();
  
      cy.get('[data-testid="skillsBasic"]')
        .find('[data-purchase-index="0"]')
        .should('have.css', 'color', 'rgb(142, 192, 124)');

      cy.get('.rp-spent').should('have.value', '800');
    });
  
    it('can purchase Bonus Advance', () => {
      cy.get('[data-testid="advancesBasic"]')
        .find('[data-purchase-index="0"]').click();
  
      cy.get('[data-testid="advancesBasic"]')
        .find('[data-purchase-index="0"]')
        .should('have.css', 'color', 'rgb(142, 192, 124)');

      cy.get('.rp-spent').should('have.value', '700');
    });
  
    it('can purchase Talent', () => {
      cy.get('[data-testid="talentsBasic"]')
        .find('[data-purchase-index="0"]').click();
  
      cy.get('[data-testid="talentsBasic"]')
        .find('[data-purchase-index="0"]')
        .should('have.css', 'color', 'rgb(142, 192, 124)');

      cy.get('.rp-spent').should('have.value', '600');
  
      cy.get('[data-testid="Nerves of Steel"]').should('be.visible');
    });

    it('Skill Rank bonus is visible', () => {
      cy.get('a[data-tab="main"]').click();
    })
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