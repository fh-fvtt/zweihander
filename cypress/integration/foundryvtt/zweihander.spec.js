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

  it('can enable Magick tab', () => {
    cy.get('.configure-actor').click();

    cy.wait(1000);

    cy.get('[name="flags.isMagickUser"]').click();

    cy.contains(`${Cypress.env('characterName')}: Actor Configuration`).parent().find('.close').click();
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

  it('can add Ancestry', () => {
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
  
      cy.get('.compendium').should('be.visible')
        .find(`img[title="${Cypress.env("professionBasic")}"]`)
        .parent()
        .dragTo('.character');
  
      cy.wait(1000);
  
      cy.get('div[data-tab="tiers"]')
        .find(`[data-testid="${Cypress.env("professionBasic")}"]`)
        .should('be.visible')
        .click();
  
      cy.wait(1000);

      cy.get('.rp-spent').should('have.value', '900');
    });
  
    it('can purchase Skill Rank', () => {
      cy.get('[data-testid="skillsBasic"]')
        .find('[data-purchase-index="0"]').click();
  
      cy.get('[data-testid="skillsBasic"]')
        .find('[data-purchase-index="0"]')
        .should('have.css', 'color', Cypress.env("purchasedColor"));

      cy.get('.rp-spent').should('have.value', '800');
    });
  
    it('can purchase Bonus Advance', () => {
      cy.get('[data-testid="advancesBasic"]')
        .find('[data-purchase-index="0"]').click();
  
      cy.get('[data-testid="advancesBasic"]')
        .find('[data-purchase-index="0"]')
        .should('have.css', 'color', Cypress.env("purchasedColor"));

      cy.get('.rp-spent').should('have.value', '700');
    });
  
    it('can purchase Talent', () => {
      cy.get('[data-testid="talentsBasic"]')
        .find('[data-purchase-index="0"]').click();
  
      cy.get('[data-testid="talentsBasic"]')
        .find('[data-purchase-index="0"]')
        .should('have.css', 'color', Cypress.env("purchasedColor"));

      cy.get('.rp-spent').should('have.value', '600');
  
      cy.get('[data-testid="Nerves of Steel"]').should('be.visible');
    });

    it('does not allow advancing if not complete', () => {
      cy.get('.compendium')
        .find(`img[title="${Cypress.env("professionIntermediate")}"]`)
        .parent()
        .dragTo('.character');

      cy.contains('A character must complete the previous Tier before entering a new Profession.').should('be.visible');
    });

    it('can complete Tier', () => {
      cy.get('[data-key="data.completed"]').click({ force: true });

      cy.wait(1000);

      cy.get('[data-button="yes"]').should('be.visible').click();

      cy.get('[data-testid="skillsBasic"]')
        .find('[data-purchase-index="9"]')
        .should('have.css', 'color', Cypress.env("purchasedColor"));

      cy.get('[data-testid="advancesBasic"]')
        .find('[data-purchase-index="6"]')
        .should('have.css', 'color', Cypress.env("purchasedColor"));

      cy.get('[data-testid="talentsBasic"]')
        .find('[data-purchase-index="2"]')
        .should('have.css', 'color', Cypress.env("purchasedColor"));
    });
  });

  describe('Intermediate Tier', () => {
    it('can purchase Profession', () => {
      console.log('b')
    });
  })
});

describe('Trappings', () => {
  it('can add a new Weapon', () => {
    cy.get('a[data-tab="trappings"]').click();

    cy.get('a[data-item-type="weapon"]').click();

    cy.wait(1000);

    cy.get('.window-header').contains('weapon').should('be.visible').parent().find('.close').click();
  });

  it('can add new Armor', () => {
    cy.get('a[data-item-type="armor"]').click();

    cy.wait(1000);

    cy.get('.window-header')
      .contains('armor')
      .should('be.visible')
      .parents('.window-app')
      .find('input[name="data.damageThresholdModifier"]')
      .clear()
      .type("1")
      .parents('.window-app')
      .find('.close')
      .click();
  })
});

describe('Rolls', () => {
  it('rolls a Weapon attack', () => {
    console.log('c')
  });
});

after(() => {
  cy.get('a[title="Game Settings"]').click();

  cy.get('[data-action="setup"]').click();

  cy.wait(1000);

  // weird Foundry behaviour where 'Return to Setup' doesn't actually do what it says
  if (cy.get('select[name="userid"]')) {
    cy.get('select[name="userid"]').select('Gamemaster');

    cy.get('button[name="join"]').click();

    cy.wait(2000);

    cy.get('a[title="Game Settings"]').click();

    cy.get('[data-action="setup"]').click();

    cy.wait(1000);
  }

  cy.get('[data-package-id="cypress-zweihander-test"]').contains('Delete World').click();

  cy.get('.window-content').find('b').then(($confirmationText) => {
    cy.get('#delete-confirm').type($confirmationText.text());

    cy.get('[data-button="yes"]').click();
  });
});