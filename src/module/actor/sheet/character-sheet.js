import ZweihanderActorConfig from '../../apps/actor-config';
import ZweihanderBaseActorSheet from './base-actor-sheet';
import * as ZweihanderDice from '../../dice';
import { attachTabDefinitions, getItemGroups } from './character-sheet-tabs-def';
import { getPacks } from '../../utils';

/**
 * The Zweihänder actor sheet class for characters.
 * @extends {ActorSheet}
 */
export default class ZweihanderCharacterSheet extends ZweihanderBaseActorSheet {
  constructor(...args) {
    super(...args);
  }

  static unsupportedItemTypes = new Set(['quality', 'skill']);

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: super.defaultOptions.classes.concat(['character']),
      template: 'systems/zweihander/src/templates/character/main.hbs',
      width: 780,
      height: 920,
      tabs: [
        {
          navSelector: '.sheet-navigation',
          contentSelector: '.sheet-body',
          initial: 'main',
        },
      ],
      scrollY: ['.save-scroll', '.items-list', '.tab'],
    });
  }

  async getData(options) {
    const sheetData = await super.getData();

    // get actor config
    sheetData.actorConfig = ZweihanderActorConfig.getConfig(this.actor);

    // bind currency
    sheetData.settings.currencies = game.settings.get('zweihander', 'currencySettings');

    // calculate reward points automatically
    sheetData.settings.trackRewardPoints = game.settings.get('zweihander', 'trackRewardPoints');

    // @todo: see if can be expanded to bonuses and SAs
    // source (unmodified) values required to know fields by Active Effects
    for (let pa of CONFIG.ZWEI.primaryAttributes)
      sheetData.system.stats.primaryAttributes[`${pa}`].baseValue =
        this.actor._source.system.stats.primaryAttributes[`${pa}`].value;

    if (sheetData.settings.trackRewardPoints) {
      const tierMultiplier = {
        Basic: 100,
        Intermediate: 200,
        Advanced: 300,
      };
      sheetData.system.stats.rewardPoints.spent = sheetData.professions
        .map((profession) => tierMultiplier[profession.system.tier] * profession.system.advancesPurchased)
        .concat(sheetData.uniqueAdvances.map((advance) => advance.system.rewardPointCost))
        .reduce((a, b) => a + b, 0);
      sheetData.system.stats.rewardPoints.current =
        sheetData.system.stats.rewardPoints.total - sheetData.system.stats.rewardPoints.spent;
    }
    attachTabDefinitions(sheetData);
    const hidden = this.actor.limited;
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
            const tiers = { Basic: 1, Intermediate: 2, Advanced: 3 };
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
    return sheetData;
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
      const aloc = game.i18n.localize('ZWEI.actor.skills.' + a.name.toLowerCase().replace(/\s+/g, ''));
      const bloc = game.i18n.localize('ZWEI.actor.skills.' + b.name.toLowerCase().replace(/\s+/g, ''));
      return aloc.localeCompare(bloc);
    });
    // sort professions by tier
    sheetData.professions = sheetData.professions.sort(
      (a, b) => CONFIG.ZWEI.tiersInversed[a.system.tier] - CONFIG.ZWEI.tiersInversed[b.system.tier]
    );

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
      if (!e.system.isActive) groups.effectsInactive.push(e);
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

  activateListeners(html) {
    super.activateListeners(html);

    this._registerDimensionChangeListener(
      html.find('.skills-container'),
      this._getDimensionBreakpointsCallback('innerWidth', [
        {
          at: 275,
          callback: (toggle) => html.find('.skills-list').toggleClass('two-rows', toggle),
        },
      ])
    );

    // Update the encumbrance meter
    this._updateEncumbranceMeter(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    const updatePurchased = async (event) => {
      const target = $(event.currentTarget);
      const field = target.data('purchaseType');
      const index = target.data('purchaseIndex');
      const professionElement = target.closest('.individual-description').parents('.item');
      const professionItem = this.actor.items.get($(professionElement).data('itemId'));
      const locked = professionItem.system.completed && this.actor.system.tier !== professionItem.system.tier;
      if (locked) {
        ui.notifications.error(`Cannot perform operation: ${professionItem.system.tier} Tier locked.`);
        return;
      }
      const updated = professionItem.system[field].map((x, i) => (i === index ? { ...x, purchased: !x.purchased } : x));
      await professionItem.update({ [`system.${field}`]: updated });
    };
    html.find('.purchase-link').click(updatePurchased);

    html.find('.reset-ranks').click(async () => {
      await this.actor.update({
        'system.alignment.corruption': 0,
      });
    });
    // Reset Order and Chaos Ranks
    html.find('.reset-ranks').contextmenu(() => {
      Dialog.confirm({
        title: `${this.actor.name}: ` + game.i18n.localize('ZWEI.othermessages.resetranks'),
        content: game.i18n.localize('ZWEI.othermessages.sureranks'),
        yes: async () =>
          await this.actor.update({
            'system.alignment.chaos.rank': 0,
            'system.alignment.order.rank': 0,
          }),
        defaultYes: false,
      });
    });

    html.find('.peril-rolls .image-container').click(async (event) => {
      const perilType = ZweihanderDice.PERIL_ROLL_TYPES[event.currentTarget.dataset.perilType.toUpperCase()];
      ZweihanderDice.rollPeril(perilType, this.actor);
    });

    // Modify numerable value by clicking '+' and '-' buttons on sheet, e.g. quantity, encumbrance
    // const updateNumerable = (i) => async (event) => {
    //   const lookup = (obj, key) => {
    //     const keys = key.split('.');
    //     let val = obj;
    //     for (let key of keys) {
    //       val = val?.[key];
    //     }
    //     return val;
    //   };

    //   const numerablePath = event.currentTarget.dataset.numerablePath;

    //   const itemElement = $(event.currentTarget).parents('.item');
    //   const item = this.actor.items.get($(itemElement).data('itemId'));

    //   const newNumerableValue = lookup(item, numerablePath) + i;

    //   await item.update({
    //     [`${numerablePath}`]: newNumerableValue >= 0 ? newNumerableValue : 0,
    //   });
    // };

    // html.find('.numerable-field-subtract').click(updateNumerable(-1));
    // html.find('.numerable-field-add').click(updateNumerable(1));

    html.find('.focus-indicator').hover(
      (event) => {
        const tooltip = $(event.currentTarget).parents('.skill-roll').find('.focus-tooltip').clone();
        if (!tooltip.length) return;

        const offset = $(event.currentTarget).offset();
        offset.top += 25;
        offset.left -= 125 / 2 - 7;
        tooltip.addClass('zh-focuses-tooltip-instance');
        tooltip.offset(offset);
        $('body').append(tooltip);
      },
      (event) => {
        $('.zh-focuses-tooltip-instance').remove();
      }
    );

    // currency exchange
    html.find('.exchange-currency').click(async (event) => {
      const biggerIndex = Number(event.currentTarget.dataset.biggerIndex);
      const smallerIndex = biggerIndex + 1;
      await this._exchangeCurrency(biggerIndex, smallerIndex);
    });
    html.find('.exchange-currency').contextmenu(async (event) => {
      event.preventDefault();
      const biggerIndex = Number(event.currentTarget.dataset.biggerIndex);
      const smallerIndex = biggerIndex + 1;
      await this._exchangeCurrency(smallerIndex, biggerIndex);
    });
  }

  _updateEncumbranceMeter(html) {
    const encumbranceData = this.actor.system.stats.secondaryAttributes.encumbrance;
    const currentEncumbrance = encumbranceData.current;
    const totalEncumbrance = encumbranceData.value;
    let ratio = (currentEncumbrance / totalEncumbrance) * 100;
    if (ratio > 100) {
      ratio = 100;
      html.find('.encumbrance-bar-container').addClass('encumbrance-overage');
    }
    html.find('.encumbrance-bar').css('width', ratio + '%');
  }

  async _render(force, options) {
    if (this.actor.limited) {
      const classesWithoutDamageTracker = this.constructor.defaultOptions.classes;
      classesWithoutDamageTracker.splice(classesWithoutDamageTracker.indexOf('damage-tracker'), 1);
      options.classes = [
        'limited',
        ...classesWithoutDamageTracker,
        ...(options.classes?.length ? options.classes : []),
      ];
      options.height = 235;
      options.width = 650;
      options.resizable = false;
    }
    await super._render(force, options);
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
