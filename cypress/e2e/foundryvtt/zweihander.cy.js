/// <reference types="cypress" />

const testWorldData = {
  name: 'cypress-zweihander-test',
  title: 'Cypress Zweihänder Test',
  system: 'zweihander',
  background: '',
  nextSession: null,
};

before(() => {
  cy.clearLocalStorage();

  cy.window().then((window) => {
    // lower performance requirements
    window.localStorage.setItem('core.performanceMode', "0");

    // turn off "New World Welcome Tour"
    window.localStorage.setItem("core.tourProgress", JSON.stringify({
      core: { welcome: 3 }
    }));
  });

  cy.visit('/setup')
    .url()
    .then((url) => {
      const { pathname } = new URL(url);
      if (!pathname.endsWith('/setup')) {
        if (pathname.endsWith('/auth')) {
          // Have to input setup key
          return cy
            .get('#key')
            .type(Cypress.env('adminKey'))
            .then(() => cy.get(`button[value="adminAuth"]`).click());
        }

        if (pathname.endsWith('/join')) {
          return exitWorld();
        }

        throw new Error('Cannot get to setup screen! Can handle /join and /auth but at ' + pathname);
      }

      return cy;
    });

  createWorld();
  launchWorld();
  joinWorld();
});

function createWorld() {
  return cy
    .request({
      method: 'POST',
      url: '/setup',
      body: {
        action: 'createWorld',
        ...testWorldData,
      },
    })
    .then((response) => handleError(response.body));
}

function launchWorld() {
  const worldId = testWorldData.name;
  cy.get(`[data-package-id="${worldId}"]`).rightclick();
  cy.get('.context-items').contains('Launch World').click();
}

function joinWorld() {
  cy.get('select').select('Gamemaster');
  cy.get('button[name="join"]').click();

  // wait for game initialization, hint: add timeout to window() if 4s is not enough
  cy.window().its('game.ready').should('equal', true);
  clearNotifications();
}

function clearNotifications() {
  cy.window().then((window) => {
    window.ui.notifications.clear();
  });
}

function exitWorld() {
  cy.get('input[name="adminPassword"]').type(Cypress.env('adminKey'));
  cy.get('button[name="shutdown"]').click()
}

function handleError(responseJSON) {
  const errorJSON = responseJSON;

  // This condition is being used as a dumb type guard
  if (errorJSON.error === 'string') {
    const error = new Error(game.i18n.localize(errorJSON.error));
    error.stack = errorJSON.stack;

    throw error;
  }
}

after(() => {
  // delete test world
  const worldId = testWorldData.name;
  cy.get('#sidebar-tabs > [data-tab="settings"]').click();
  cy.get('[data-action="setup"]').click();
  
  cy.get(`[data-package-id="${worldId}"]`).rightclick();
  cy.get('.context-items').contains('Delete World').click();

  cy.get('.reference').then((ref) => {
    const refText = ref.text();

    cy.get('#delete-confirm').type(refText);
    cy.get('.yes').click();
  });

  cy.get('.info').contains(`${worldId}`).should('contain.text', 'uninstalled successfully');
});

describe('Game world loads Zweihander system', () => {
  it('loads fully', () => {
    cy.window().its('game.ready').should('equal', true);
  });

  it('runs Zweihander system', () => {
    cy.get('#sidebar-tabs > [data-tab="settings"]').click();
    cy.get('.system-title').should('contain.text', 'Zweihänder');
  });
});

describe('Fortune Tracker', () => {
  it('should render correctly', () => {
    cy.get('#fortuneTrackerApp').should('be.visible');
  });
});

describe('Character Creation', () => {
  beforeEach(() => {
    clearNotifications();
  });

  it('can create an Actor (Player Character)', () => {
    cy.get('#sidebar-tabs > [data-tab="actors"]').click();
    cy.get('section[data-tab="actors"]').find('button.create-document').click();

    cy.get('input[name="name"]').type(Cypress.env('characterName'));
    cy.get('select[name="type"]').select('Player Character').should('have.value', 'character');
    cy.get('button[data-button="ok"]').click();

    cy.get('ol[class="directory-list"]')
      .find('h4.document-name')
      .find('a')
      .should('have.text', Cypress.env('characterName'));

    cy.get('.character').should('be.visible');
  });

  it('can enable Magick tab', () => {
    cy.wait(1000);
    cy.get('a.configure-actor').click();
    cy.contains(`${Cypress.env('characterName')}: Actor Configuration`)

    cy.get('[name="flags.isMagickUser"]').click();

    cy.contains(`${Cypress.env('characterName')}: Actor Configuration`)
      .parent()
      .find('.close')
      .click();

    cy.get('.character').get('[data-tab="magick"]').should('be.visible');
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

    cy.get('.compendium').parents('.window-app').find('.close').click();
  });

  describe('Basic Tier', () => {
    it('can purchase Profession', () => {
      cy.get('a[data-tab="tiers"]').click();

      cy.get('a[data-item-type="profession"]').rightclick();

      cy.wait(1000);

      cy.get('.compendium')
        .should('be.visible')
        .find(`img[title="${Cypress.env('professionBasic')}"]`)
        .parent()
        .dragTo('.character');

      cy.wait(1000);

      cy.get('div[data-tab="tiers"]')
        .find(`[data-testid="${Cypress.env('professionBasic')}"]`)
        .should('be.visible')
        .click();

      cy.get('.rp-spent').should('have.value', '900');
    });

    it('can purchase Skill Rank', () => {
      cy.get('[data-testid="skillsBasic"]').find('[data-purchase-index="0"]').click();

      cy.get('[data-testid="skillsBasic"]')
        .find('[data-purchase-index="0"]')
        .should('have.css', 'color', Cypress.env('purchasedColor'));

      cy.get('.rp-spent').should('have.value', '800');
    });

    it('can purchase Bonus Advance', () => {
      cy.get('[data-testid="advancesBasic"]').find('[data-purchase-index="0"]').click();

      cy.get('[data-testid="advancesBasic"]')
        .find('[data-purchase-index="0"]')
        .should('have.css', 'color', Cypress.env('purchasedColor'));

      cy.get('.rp-spent').should('have.value', '700');
    });

    it('can purchase Talent', () => {
      cy.get('[data-testid="talentsBasic"]').find('[data-purchase-index="0"]').click();

      cy.get('[data-testid="talentsBasic"]')
        .find('[data-purchase-index="0"]')
        .should('have.css', 'color', Cypress.env('purchasedColor'));

      cy.get('.rp-spent').should('have.value', '600');

      cy.get('[data-testid="Nerves of Steel"]').should('be.visible');
    });

    it('does not allow advancing if not complete', () => {
      cy.get('.compendium')
        .find(`img[title="${Cypress.env('professionIntermediate')}"]`)
        .parent()
        .dragTo('.character');

      cy.contains('A character must complete the previous Tier before entering a new Profession.').should('be.visible');
    });

    it('can complete Tier', () => {
      cy.get('[data-key="system.completed"]').click({ force: true });

      cy.wait(1000);

      cy.get('[data-button="yes"]').should('be.visible').click();

      cy.get('[data-testid="skillsBasic"]')
        .find('[data-purchase-index="9"]')
        .should('have.css', 'color', Cypress.env('purchasedColor'));

      cy.get('[data-testid="advancesBasic"]')
        .find('[data-purchase-index="6"]')
        .should('have.css', 'color', Cypress.env('purchasedColor'));

      cy.get('[data-testid="talentsBasic"]')
        .find('[data-purchase-index="2"]')
        .should('have.css', 'color', Cypress.env('purchasedColor'));
    });
  });

  describe('Intermediate Tier', () => {
    it('can purchase Profession')
  });
});

describe('Trappings', () => {
  it('can add a new Weapon', () => {
    cy.get('a[data-tab="trappings"]').click();

    cy.get('a[data-item-type="weapon"]').click();

    cy.get('.window-header').contains('weapon').should('be.visible').parent().find('.close').click();
  });

  it('can add new Armor', () => {
    cy.get('a[data-item-type="armor"]').click();

    cy.get('.window-header')
      .contains('armor')
      .should('be.visible')
      .parents('.window-app')
      .find('input[name="system.damageThresholdModifier"]')
      .clear()
      .type('1')
      .parents('.window-app')
      .find('.close')
      .click();
  });
});

describe('Rolls', () => {
  it('rolls a Weapon attack')
});
