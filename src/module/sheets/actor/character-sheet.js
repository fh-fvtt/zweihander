import * as ZweihanderDice from '../../system/rolls/dice';
import * as ZweihanderUtils from '../../system/utils';

import ZweihanderActorConfig from '../../apps/actor-config';
import ZweihanderBaseActorSheet from './base-actor-sheet';

import { attachTabDefinitions, getItemGroups } from './character-sheet-tabs-def';
import { getPacks } from '../../system/utils';

const { getProperty, setProperty } = foundry.utils;
const { DialogV2 } = foundry.applications.api;

/**
 * The Zweihänder actor sheet class for characters.
 * @extends {ZweihanderBaseActorSheet}
 */
export default class ZweihanderCharacterSheet extends ZweihanderBaseActorSheet {
  static unsupportedItemTypes = new Set(['quality', 'skill']);

  static DEFAULT_OPTIONS = {
    classes: ['character'],
    position: {
      width: 785,
      height: 950,
    },
    window: {
      contentClasses: ['sheet-body'],
      icon: 'fa-solid fa-user',
    },
  };

  static PARTS = {
    header: { template: 'systems/zweihander/src/templates/character/header.hbs' },
    tabs: { template: 'systems/zweihander/src/templates/character/tabs-navigation.hbs' },
    attributes: {
      template: 'systems/zweihander/src/templates/character/tabs/attributes.hbs',
      scrollable: ['.skills-list'],
    },
    tiers: {
      template: 'systems/zweihander/src/templates/character/tabs/generic-item-list.hbs',
      scrollable: ['.items-list'],
    },
    trappings: {
      template: 'systems/zweihander/src/templates/character/tabs/generic-item-list.hbs',
      scrollable: ['.items-list'],
    },
    magick: {
      template: 'systems/zweihander/src/templates/character/tabs/generic-item-list.hbs',
      scrollable: ['.items-list'],
    },
    afflictions: {
      template: 'systems/zweihander/src/templates/character/tabs/generic-item-list.hbs',
      scrollable: ['.items-list'],
    },
    background: { template: 'systems/zweihander/src/templates/character/tabs/background.hbs' },
  };

  static TABS = {
    primary: {
      tabs: [
        { id: 'attributes' },
        { id: 'tiers' },
        { id: 'trappings' },
        { id: 'magick' },
        { id: 'afflictions' },
        { id: 'background' },
      ],
      initial: 'attributes',
      labelPrefix: 'ZWEI.actor.navigation',
    },
  };

  constructor(...args) {
    super(...args);
  }

  get actor() {
    return this.document;
  }

  _initializeApplicationOptions(options) {
    const initialized = super._initializeApplicationOptions(options);

    const limited = initialized.document.limited;

    if (limited) {
      initialized.classes.push('limited');
      initialized.window.resizable = false;
      initialized.position.height = 'auto';
    }

    return initialized;
  }

  _configureRenderParts(options) {
    const parts = super._configureRenderParts(options);

    if (this.document.limited) {
      const { header, background } = parts;
      return { header, background };
    }

    const isMagickUser = this.document.system.settings.isMagickUser;

    if (!isMagickUser) {
      const { header, tabs, attributes, tiers, trappings, afflictions, background } = parts;
      return { header, tabs, attributes, tiers, trappings, afflictions, background };
    }

    return parts;
  }

  _prepareTabs(group) {
    const tabs = super._prepareTabs(group);

    if (group === 'primary') {
      if (this.document.limited) {
        tabs.background.active = true;
        tabs.background.cssClass = 'active';

        return { background: tabs.background };
      }

      const isMagickUser = this.document.system.settings.isMagickUser;

      if (!isMagickUser) {
        delete tabs.magick;
      }
    }

    return tabs;
  }

  async _prepareContext(options) {
    const sheetData = await super._prepareContext(options);

    const actor = this.actor;

    sheetData.html = {
      description: await ZweihanderUtils.enrichLocalized(sheetData.document.system.description),
      notes: await ZweihanderUtils.enrichLocalized(sheetData.document.system.notes),
    };

    sheetData.actorConfig = actor.system.settings;

    // bind currency
    sheetData.settings.currencies = game.settings.get('zweihander', 'currencySettings');

    // calculate reward points automatically
    sheetData.settings.trackRewardPoints = game.settings.get('zweihander', 'trackRewardPoints');

    // data for select elements
    sheetData.choices = {};

    const setAssociatedSkillChoices = (mappings) => {
      mappings.forEach(({ configKey, attrKey }) => {
        sheetData.choices[configKey] = ZweihanderUtils.selectedChoice(
          sheetData.document.system.stats.secondaryAttributes[attrKey].associatedSkill,
          sheetData.actorConfig[configKey].map((skill) => ({
            value: skill,
            label: skill,
          }))
        );
      });
    };

    setAssociatedSkillChoices([
      { configKey: 'magickSkills', attrKey: 'magick' },
      { configKey: 'dodgeSkills', attrKey: 'dodge' },
      { configKey: 'parrySkills', attrKey: 'parry' },
      { configKey: 'perilSkills', attrKey: 'madness' },
    ]);

    // @todo: see if can be expanded to bonuses and SAs
    // source (unmodified) values required to know fields by Active Effects
    for (let pa of CONFIG.ZWEI.primaryAttributes)
      sheetData.system.stats.primaryAttributes[`${pa}`].baseValue =
        actor._source.system.stats.primaryAttributes[`${pa}`].value;

    sheetData.modifiersLookup = actor
      .allApplicableEffects()
      .flatMap((e) =>
        e.active ? e.system.changes.filter((c) => c.key.startsWith('system')).map((c) => ({ ...c, name: e.name })) : []
      )
      .reduce((acc, { key, ...rest }) => {
        (acc[key] ??= []).push(rest);
        return acc;
      }, {});

    attachTabDefinitions(sheetData);

    const hidden = actor.limited;
    const ancestry = sheetData.ancestry?.[0]?.name;
    const pronoun = sheetData.system.details.pronoun || '?';

    sheetData.details = [
      {
        key: 'details.age',
        placeholder: game.i18n.localize('ZWEI.actor.details.placeholders.agegroup'),
        prefix: game.i18n.localize('ZWEI.actor.details.prefixes.agegroup'),
      },
      {
        key: 'details.sex',
        placeholder: game.i18n.localize('ZWEI.actor.details.placeholders.sex'),
      },
      {
        value: sheetData.ancestry?.[0]?.name ?? '',
        placeholder: game.i18n.localize('ZWEI.actor.details.placeholders.ancestry'),
        template: 'partials/detail-item-wrapper',
        packs: getPacks('character', 'ancestry'),
        type: 'ancestry',
        isParentCharacter: true,
        id: sheetData.ancestry?.[0]?._id ?? '',
      },
      {
        value:
          [...sheetData.professions]?.sort((professionA, professionB) => {
            const tiers = ZweihanderUtils.getLocalizedTierMapping();
            return tiers[professionA.system.tier] - tiers[professionB.system.tier];
          })[sheetData.professions.length - 1]?.name ?? '?',
        hidden,
      },
      {
        prefix: game.i18n.localize('ZWEI.actor.details.prefixes.socialclass'),
        key: 'details.socialClass',
        placeholder: game.i18n.localize('ZWEI.actor.details.placeholders.socialclass'),
        postfix: game.i18n.localize('ZWEI.actor.details.postfixes.socialclass'),
        hidden,
      },
      {
        key: 'details.height',
        placeholder: game.i18n.localize('ZWEI.actor.details.placeholders.height'),
        postfix: game.i18n.localize('ZWEI.actor.details.postfixes.height'),
      },
      {
        key: 'details.weight',
        placeholder: game.i18n.localize('ZWEI.actor.details.placeholders.weight'),
        postfix: game.i18n.localize('ZWEI.actor.details.postfixes.weight'),
      },
      {
        key: 'details.pronoun',
        placeholder: game.i18n.localize('ZWEI.actor.details.placeholders.pronoun'),
        postfix: game.i18n.localize('ZWEI.actor.details.postfixes.pronoun'),
      },
      {
        prefix: game.i18n.localize('ZWEI.actor.details.prefixes.build'),
        key: 'details.buildType',
        placeholder: game.i18n.localize('ZWEI.actor.details.placeholders.build'),
        postfix: game.i18n.format('ZWEI.actor.details.postfixes.build', { ancestry: `${ancestry ?? '?'}` }),
      },
      {
        prefix: game.i18n.format('ZWEI.actor.details.prefixes.hair', { pronoun: `${pronoun.capitalize() ?? '?'}` }),
        key: 'details.hairColor',
        placeholder: game.i18n.localize('ZWEI.actor.details.placeholders.hair'),
        postfix: game.i18n.localize('ZWEI.actor.details.postfixes.hair'),
      },
      {
        key: 'details.eyeColor',
        placeholder: game.i18n.localize('ZWEI.actor.details.placeholders.eyes'),
        postfix: game.i18n.localize('ZWEI.actor.details.postfixes.eyes'),
      },
      {
        key: 'details.complexion',
        placeholder: game.i18n.localize('ZWEI.actor.details.placeholders.complexion'),
        postfix: game.i18n.localize('ZWEI.actor.details.postfixes.complexion'),
      },
      {
        key: 'details.distinguishingMarks',
        placeholder: game.i18n.localize('ZWEI.actor.details.placeholders.marks'),
        postfix: game.i18n.localize('ZWEI.actor.details.postfixes.marks'),
      },
      {
        prefix: game.i18n.localize('ZWEI.actor.details.prefixes.born'),
        key: 'details.seasonOfBirth',
        placeholder: game.i18n.localize('ZWEI.actor.details.placeholders.born'),
        hidden,
      },
      {
        prefix: game.i18n.format('ZWEI.actor.details.prefixes.upbringing', { pronoun: `${pronoun ?? '?'}` }),
        key: 'details.upbringing',
        placeholder: game.i18n.localize('ZWEI.actor.details.placeholders.upbringing'),
        hidden,
        postfix: game.i18n.localize('ZWEI.actor.details.postfixes.upbringing'),
      },
      {
        prefix: game.i18n.localize('ZWEI.actor.details.prefixes.languages'),
        value: sheetData.system.languages,
        placeholder: game.i18n.localize('ZWEI.actor.details.placeholders.languages'),
        template: 'partials/detail-languages',
        hidden,
        postfix: game.i18n.localize('ZWEI.actor.details.postfixes.languages'),
      },
    ];

    // console.log('ACTOR CONTEXT:', sheetData);

    return sheetData;
  }

  async _preparePartContext(partId, context, options) {
    await super._preparePartContext(partId, context, options);

    if (partId in context.tabs) context.tab = context.tabs[partId];

    return context;
  }

  async _prepareItems(sheetData) {
    await super._prepareItems(sheetData);
    // set up collections for all item types
    const indexedTypes = [
      'trapping',
      'condition',
      'injury',
      'disease',
      'disorder',
      'profession',
      'ancestry',
      'armor',
      'weapon',
      'spell',
      'ritual',
      'talent',
      'trait',
      'drawback',
      'quality',
      'skill',
      'uniqueAdvance',
      'taint',
      'effect',
    ];
    const pluralize = (t) =>
      ({
        injury: 'injuries',
        ancestry: 'ancestry',
        armor: 'armor',
        quality: 'qualities',
      }[t] ?? t + 's');
    indexedTypes.forEach((t) => (sheetData[pluralize(t)] = []));
    sheetData.items
      .filter((i) => indexedTypes.includes(i.type))
      .sort((a, b) => (a.sort || 0) - (b.sort || 0))
      .forEach((i) => sheetData[pluralize(i.type)].push(i));

    // sort skills alphabetically
    sheetData.skills = sheetData.skills.sort((a, b) => {
      const aloc = a.name;
      const bloc = b.name;
      return aloc.localeCompare(bloc);
    });

    // sort professions by tier
    sheetData.professions = sheetData.professions.sort((a, b) => {
      const tiersInversed = ZweihanderUtils.getLocalizedTierMapping();
      return tiersInversed[a.system.tier] - tiersInversed[b.system.tier];
    });

    const effectGroups = this.prepareActiveEffectGroups();

    sheetData.effectsTemporary = effectGroups.effectsTemporary;
    sheetData.effectsPassive = effectGroups.effectsPassive;
    sheetData.effectsInactive = effectGroups.effectsInactive;

    // add source information from flags
    const addSource = (items) =>
      items.map((i) => ({
        ...i,
        source: i.flags.zweihander?.source?.label ?? 'Manual',
        isManualSource: i.flags.zweihander?.source?.label ? false : true,
      }));
    sheetData.drawbacks = addSource(sheetData.drawbacks);
    sheetData.traits = addSource(sheetData.traits);
    sheetData.talents = addSource(sheetData.talents);
    // filter purchased talents
    sheetData.talents = sheetData.talents.filter(
      (talent) =>
        talent.isManualSource ||
        sheetData.professions.some((p) => p.system.talents.some((t) => t.linkedId === talent._id && t.purchased))
    );
    // filter focuses data
    sheetData.focuses = sheetData.uniqueAdvances
      .filter((ua) => ua.system.associatedFocusSkill)
      .map((ua) => ({
        skillName: ua.system.associatedFocusSkill,
        name: ua.name,
      }));
    sheetData.skills.forEach((skill) => {
      const focuses = sheetData.focuses.filter((focus) => focus.skillName === skill.name).map((focus) => focus.name);
      skill.system.focuses = focuses;
    });
    return sheetData;
  }

  prepareActiveEffectGroups() {
    const groups = {
      effectsTemporary: [],
      effectsPassive: [],
      effectsInactive: [],
    };

    for (const e of this.actor.allApplicableEffects()) {
      if (!e.active) groups.effectsInactive.push(e);
      else if (e.isTemporary) groups.effectsTemporary.push(e);
      else groups.effectsPassive.push(e);
    }

    for (const g of Object.values(groups)) {
      g.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    }

    return groups;
  }

  _getItemGroups(data) {
    return getItemGroups(data);
  }

  _setBackground(sheet, backgroundPath) {
    const isSheetCompact = sheet.classList.contains('zweihander-compact-sheet');

    const elements = {
      sheet: sheet,
      header: sheet.querySelector('.window-header'),
      body: sheet.querySelector('.sheet-body'),
      characterInfo: sheet.querySelector('.character-info'),
    };

    const className = 'fancy';

    if (backgroundPath) {
      elements.sheet.style.setProperty(
        'background-image',
        `linear-gradient(0deg, var(--zh-clr-bg0) ${
          isSheetCompact ? '87%' : '70%'
        }, rgba(0, 0, 0, 0.45)), url('${backgroundPath}')`
      );

      for (const el of Object.values(elements)) el?.classList.add(className);
    } else {
      for (const el of Object.values(elements)) el?.classList.remove(className);
    }
  }

  async _onRender(context, options) {
    await super._onRender(context, options);

    const html = this.element;
    const sheet = this.element.closest('.zweihander.sheet.character');

    this._setBackground(sheet, context.actorConfig.headerBackground);

    this._registerDimensionChangeListener(
      html.querySelector('.skills-container'),
      this._getDimensionBreakpointsCallback('innerWidth', [
        {
          at: 275,
          callback: (toggle) => html.querySelector('.skills-list').classList.toggle('two-rows', toggle),
        },
      ])
    );

    // Update the encumbrance meter
    this._updateEncumbranceMeter(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    const updatePurchased = async (event) => {
      const target = event.currentTarget;
      const field = target.dataset.purchaseType;
      const index = Number(target.dataset.purchaseIndex);
      const professionElement = target.closest('.individual-description').closest('.item');
      const professionItem = this.actor.items.get(professionElement.dataset.itemId);
      const locked = professionItem.system.completed && this.actor.system.tier !== professionItem.system.tier;
      if (locked) {
        ui.notifications.error(
          game.i18n.format('ZWEI.othermessages.cannotperformtier', { tier: professionItem.system.tier })
        );
        return;
      }
      const updated = professionItem.system[field].map((x, i) => (i === index ? { ...x, purchased: !x.purchased } : x));
      await professionItem.update({ [`system.${field}`]: updated });
    };

    html.querySelectorAll('.purchase-link').forEach((el) => el.addEventListener('click', updatePurchased));

    html.querySelector('.reset-ranks').addEventListener('contextmenu', async () => {
      await this.actor.update({
        'system.alignment.corruption': 0,
      });
    });

    // Reset Order and Chaos Ranks
    html.querySelector('.reset-ranks').addEventListener('click', async () => {
      await DialogV2.confirm({
        window: { title: `${this.actor.name}: ` + game.i18n.localize('ZWEI.othermessages.resetranks') },
        content: game.i18n.localize('ZWEI.othermessages.sureranks'),
        yes: {
          callback: async () =>
            await this.actor.update({
              'system.alignment.chaos.rank': 0,
              'system.alignment.order.rank': 0,
            }),
        },
        position: { width: 455 },
        rejectClose: false,
        defaultYes: false,
      });
    });

    // currency exchange
    html.querySelectorAll('.exchange-currency').forEach((el) =>
      el.addEventListener('click', async (event) => {
        const biggerIndex = Number(event.currentTarget.dataset.biggerIndex);
        const smallerIndex = biggerIndex + 1;
        await this._exchangeCurrency(biggerIndex, smallerIndex);
      })
    );

    html.querySelectorAll('.exchange-currency').forEach((el) =>
      el.addEventListener('contextmenu', async (event) => {
        event.preventDefault();
        const biggerIndex = Number(event.currentTarget.dataset.biggerIndex);
        const smallerIndex = biggerIndex + 1;
        await this._exchangeCurrency(smallerIndex, biggerIndex);
      })
    );
  }

  _updateEncumbranceMeter(html) {
    const encumbranceData = this.actor.system.stats.secondaryAttributes.encumbrance;
    const currentEncumbrance = encumbranceData.current;
    const totalEncumbrance = encumbranceData.value;
    let ratio = (currentEncumbrance / totalEncumbrance) * 100;
    if (ratio > 100) {
      ratio = 100;
      html.querySelector('.encumbrance-bar-container').classList.add('encumbrance-overage');
    }
    html.querySelector('.encumbrance-bar').style.width = ratio + '%';
  }

  async _exchangeCurrency(sourceCurrencyIndex, targetCurrencyIndex) {
    const currencies = game.settings.get('zweihander', 'currencySettings');
    const actorMoney = this.actor.system.currency;
    const source = currencies[sourceCurrencyIndex];
    const target = currencies[targetCurrencyIndex];
    const equivalent = currencies[Math.min(sourceCurrencyIndex, targetCurrencyIndex)].equivalentOfLower;
    let conversion = {};
    if (sourceCurrencyIndex < targetCurrencyIndex) {
      // bigger to lower conversion
      conversion.sourceDebit = 1;
      conversion.targetCredit = equivalent;
    } else {
      // lower to bigger conversion
      conversion.sourceDebit = equivalent;
      conversion.targetCredit = 1;
    }
    const newSourceAmount = actorMoney[source.abbreviation] - conversion.sourceDebit;
    if (newSourceAmount >= 0) {
      await this.actor.update({
        [`system.currency.${source.abbreviation}`]: newSourceAmount,
        [`system.currency.${target.abbreviation}`]: actorMoney[target.abbreviation] + conversion.targetCredit,
      });
    } else {
      console.warn(`not enough ${source.abbreviation} to perform money conversion`);
    }
  }
}
