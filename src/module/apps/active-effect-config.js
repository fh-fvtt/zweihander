const { ActiveEffectConfig } = foundry.applications.sheets;

export default class ZweihanderActiveEffectConfig extends ActiveEffectConfig {
  static DEFAULT_OPTIONS = {
    ...super.DEFAULT_OPTIONS,
    classes: ['sheet', 'active-effect-sheet'],
    position: { width: 585 },
    form: { closeOnSubmit: false, submitOnClose: true, submitOnChange: true },
  };

  static PARTS = {
    ...super.PARTS,
    details: { template: 'systems/zweihander/src/templates/app/active-effect/details.hbs', scrollable: [''] },
    changes: {
      template: 'systems/zweihander/src/templates/app/active-effect/changes.hbs',
      scrollable: ['ol[data-changes]'],
    },
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    const pa = CONFIG.ZWEI.primaryAttributes.map((pa) => ({
      value: `system.stats.primaryAttributes.${pa}.value`,
      label: game.i18n.localize('ZWEI.actor.primary.' + pa),
      group: game.i18n.localize('ZWEI.actor.navigation.primary'),
    }));

    const pab = CONFIG.ZWEI.primaryAttributes.map((pab) => ({
      value: `system.stats.primaryAttributes.${pab}.bonus`,
      label: game.i18n.localize('ZWEI.actor.primarybonuses.' + pab),
      group: game.i18n.localize('ZWEI.actor.navigation.primarybonuses'),
    }));

    const sa = CONFIG.ZWEI.secondaryAttributes.map((sa) => ({
      value: `system.stats.secondaryAttributes.${sa}.value`,
      label: game.i18n.localize(
        'ZWEI.actor.secondary.' +
          sa
            .split(/(?=[A-Z])/)
            .map((w) => w.toLowerCase())
            .join('')
      ),
      group: game.i18n.localize('ZWEI.actor.navigation.secondary'),
    }));

    context.selectableKeys = [...pa, ...pab, ...sa];

    console.log(context);

    return context;
  }

  async _preparePartContext(partId, context) {
    return await super._preparePartContext(partId, context);
  }

  _configureRenderParts(options) {
    const parts = super._configureRenderParts(options);

    delete parts.footer;

    return parts;
  }
}
