const { ActiveEffectConfig } = foundry.applications.sheets;

export default class ZweihanderActiveEffectConfig extends ActiveEffectConfig {
  static DEFAULT_OPTIONS = {
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

  // ---=== HELPER METHODS ===---

  _getChoicesKeys() {
    const pa = CONFIG.ZWEI.primaryAttributes.map((pa) => ({
      value: `system.stats.primaryAttributes.${pa}.value`,
      label: _loc('ZWEI.actor.primary.' + pa),
      group: _loc('ZWEI.actor.navigation.primary'),
    }));

    const pab = CONFIG.ZWEI.primaryAttributes.map((pab) => ({
      value: `system.stats.primaryAttributes.${pab}.bonus`,
      label: _loc('ZWEI.actor.primarybonuses.' + pab),
      group: _loc('ZWEI.actor.navigation.primarybonuses'),
    }));

    const sa = CONFIG.ZWEI.secondaryAttributes.map((sa) => ({
      value: `system.stats.secondaryAttributes.${sa}.value`,
      label: _loc(
        'ZWEI.actor.secondary.' +
          sa
            .split(/(?=[A-Z])/)
            .map((w) => w.toLowerCase())
            .join('')
      ),
      group: _loc('ZWEI.actor.navigation.secondary'),
    }));

    const cbt = Object.entries(CONFIG.ZWEI.combatAttributes).map(([value, label]) => ({
      value,
      label: _loc(label),
      group: _loc('ZWEI.actor.navigation.combat'),
    }));

    return [...pa, ...pab, ...sa, ...cbt];
  }

  // ---=== FOUNDRY METHODS ===---

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    context.isParentCarried = context.document.parent?.system?.carried ?? true;
    context.advancedMode = context.document.system.advancedMode;

    return context;
  }

  /** @override */
  async _renderChange(context) {
    const { change, index } = context;
    if (typeof change.value !== 'string') change.value = JSON.stringify(change.value);
    Object.assign(
      change,
      ['key', 'type', 'value', 'phase', 'priority'].reduce((paths, fieldName) => {
        paths[`${fieldName}Path`] = `system.changes.${index}.${fieldName}`;
        return paths;
      }, {})
    );
    Object.assign(change, { selectableKeys: this._getChoicesKeys() });

    context.advancedMode = this.options.document.system.advancedMode;

    return (
      CONFIG.ActiveEffect.changeTypes[change.type]?.render?.(context) ??
      renderTemplate('systems/zweihander/src/templates/app/active-effect/change.hbs', context)
    );
  }

  /** @override */
  _configureRenderParts(options) {
    const parts = super._configureRenderParts(options);

    delete parts.footer;

    return parts;
  }
}
