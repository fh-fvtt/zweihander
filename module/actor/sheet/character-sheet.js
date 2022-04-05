import ZweihanderActorConfig from "../../apps/actor-config";
import ZweihanderBaseActorSheet from "./base-actor-sheet";
import * as ZweihanderDice from "../../dice";
import { attachTabDefinitions } from "./character-sheet-tabs-def";
import { getPacks } from "../../utils";

/**
 * The Zweihänder actor sheet class for characters.
 * @extends {ActorSheet}
 */
export default class ZweihanderCharacterSheet extends ZweihanderBaseActorSheet {

  #actorConfig;

  constructor(...args) {
    super(...args);
    this.#actorConfig = new ZweihanderActorConfig(this.actor);
  }

  static unsupportedItemTypes = new Set([
    'quality',
    'skill'
  ]);

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: super.defaultOptions.classes.concat(['character']),
      template: "systems/zweihander/templates/character/main.hbs",
      width: 770,
      height: 900,
      tabs: [
        { navSelector: ".sheet-navigation", contentSelector: ".sheet-body", initial: "main" }
      ],
      scrollY: ['.save-scroll', '.items-list', '.tab']
    });
  }

  getData(options) {
    const sheetData = super.getData();
    // get actor config
    sheetData.actorConfig = ZweihanderActorConfig.getConfig(this.actor.data);
    // bind currency
    sheetData.settings.currencies = game.settings.get('zweihander', 'currencySettings');
    // calculate reward points automatically
    if (game.settings.get("zweihander", "trackRewardPoints")) {
      const tierMultiplier = {
        "Basic": 100,
        "Intermediate": 200,
        "Advanced": 300
      }
      sheetData.data.stats.rewardPoints.spent = sheetData.professions
        .map(profession => tierMultiplier[profession.data.tier] * profession.data.advancesPurchased)
        .concat(sheetData.uniqueAdvances.map(advance => advance.data.rewardPointCost))
        .reduce((a, b) => a + b, 0);
      sheetData.data.stats.rewardPoints.current = sheetData.data.stats.rewardPoints.total - sheetData.data.stats.rewardPoints.spent;
    }
    attachTabDefinitions(sheetData);
    const hidden = this.actor.limited;
    const ancestry = sheetData.ancestry?.[0]?.name;
    const pronoun = sheetData.data.details.pronoun || '?';
    sheetData.details = [
      {
        key: 'details.age',
        placeholder: 'Age Group',
        prefix: 'is a(n)'
      },
      {
        key: 'physical.sex.value',
        placeholder: 'Sex'
      },
      {
        value: sheetData.ancestry?.[0]?.name ?? '',
        placeholder: 'Ancestry',
        template: 'partials/detail-item-wrapper',
        packs: getPacks('character', 'ancestry'),
        type: 'ancestry',
        id: sheetData.ancestry?.[0]?._id ?? ''
      },
      {
        value: sheetData.professions?.[sheetData.professions.length - 1]?.name ?? '?',
        hidden
      },
      {
        prefix: 'of the',
        key: 'details.socialClass',
        placeholder: '?',
        postfix: 'social class.',
        hidden
      },
      {
        key: 'details.height',
        placeholder: '?',
        postfix: 'ft tall and'
      },
      {
        key: 'details.weight',
        placeholder: '?',
        postfix: 'lbs heavy,'
      },
      {
        key: 'details.pronoun',
        placeholder: 'Pronoun',
        postfix: 'is/are'
      },
      {
        prefix: 'of a',
        key: 'details.buildType',
        placeholder: '?',
        postfix: `build for a(n) ${ancestry ?? '?'}.`
      },
      {
        prefix: `${pronoun.capitalize()} has/have`,
        key: 'details.hairColor',
        placeholder: '?',
        postfix: 'hair,'
      },
      {

        key: 'details.eyeColor',
        placeholder: '?',
        postfix: 'eyes,'
      },
      {
        key: 'details.complexion',
        placeholder: '?',
        postfix: 'skin &'
      },
      {
        key: 'details.distinguishingMarks',
        placeholder: 'Distinguishing Marks',
        postfix: '.'
      },
      {
        prefix: 'Born in',
        key: 'details.seasonOfBirth',
        placeholder: '?',
        hidden
      },
      {
        prefix: `${pronoun} is/are of a(n)`,
        key: 'details.upbringing',
        placeholder: '?',
        hidden,
        postfix: `upbringing`
      },
      {
        prefix: 'and speaks',
        value: sheetData.data.languages,
        placeholder: '?',
        template: 'partials/detail-languages',
        hidden,
        postfix: '.'
      }
    ];
    return sheetData;
  }

  _prepareItems(data) {
    // set up collections for all item types
    const indexedTypes = [
      "trapping", "condition", "injury", "disease", "disorder", "profession",
      "ancestry", "armor", "weapon", "spell", "ritual", "talent", "trait",
      "drawback", "quality", "skill", "uniqueAdvance", "taint"
    ];
    const pluralize = t => ({
      'injury': 'injuries',
      'ancestry': 'ancestry',
      'armor': 'armor',
      'quality': 'qualities'
    }[t] ?? t + "s");
    indexedTypes.forEach(t => data[pluralize(t)] = []);
    data.items
      .filter(i => indexedTypes.includes(i.type))
      .sort((a, b) => (a.sort || 0) - (b.sort || 0))
      .forEach(i => data[pluralize(i.type)].push(i));
    // sort skills alphabetically
    data.skills = data.skills.sort((a, b) => a.name.localeCompare(b.name));
    // sort professions by tier
    data.professions = data.professions.sort((a, b) =>
      CONFIG.ZWEI.tiersInversed[a.data.tier] - CONFIG.ZWEI.tiersInversed[b.data.tier]
    );
    // add source information from flags
    const addSource = (items) => items.map(i => ({
      ...i,
      source: i.flags.zweihander?.source?.label ?? 'Manual',
      isManualSource: i.flags.zweihander?.source?.label ? false : true
    }));
    data.drawbacks = addSource(data.drawbacks);
    data.traits = addSource(data.traits);
    data.talents = addSource(data.talents);
    // filter purchased talents
    data.talents = data.talents.filter(talent => talent.isManualSource ||
      data.professions.some(p => p.data.talents.some(t => t.linkedId === talent._id && t.purchased))
    );
    // filter focuses data
    data.focuses = data.uniqueAdvances
      .filter((ua) => ua.data.associatedFocusSkill)
      .map((ua) => ({
          focusSkill: ua.data.associatedFocusSkill,
          focusName: ua.name
      }));
    data.skills.forEach((skill) => {
      const focuses = data.focuses.filter((focus) => focus.focusSkill === skill.name).map((focus) => focus.focusName);
      skill.data.focuses = focuses;
    });
  }

  activateListeners(html) {
    super.activateListeners(html);

    this._registerDimensionChangeListener(
      html.find('.skills-container'),
      this._getDimensionBreakpointsCallback('innerWidth', [{
        at: 275,
        callback: (toggle) => html.find('.skills-list').toggleClass('two-rows', toggle)
      }])
    );

    const resizePotrait = function () {
      const header = html.find('.actor-sheet-header');
      const fig = header.find('figure');
      const headerHeight = header.innerHeight();
      const spaceInDetails = header.find('.empty-placeholder').outerHeight();
      const figHeight = fig.height();
      if (spaceInDetails > 0) {
        fig.height(figHeight - spaceInDetails);
      } else if (figHeight < headerHeight) {
        fig.height(headerHeight);
      }
    };
    this._registerDimensionChangeListener(html.find('.actor-sheet-header'), resizePotrait);
    this._registerDimensionChangeListener(html.find('.actor-sheet-header .empty-placeholder'), resizePotrait);

    // Update the encumbrance meter
    this._updateEncumbranceMeter(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    const updatePurchased = async (event) => {
      const target = $(event.currentTarget);
      const field = target.data('purchaseType');
      const index = target.data('purchaseIndex');
      const professionElement = target.closest(".individual-description").parents(".item");
      const professionItem = this.actor.items.get($(professionElement).data("itemId"));
      const locked = professionItem.data.data.completed && this.actor.data.data.tier !== professionItem.data.data.tier;
      if (locked) {
        ui.notifications.error(`Cannot perform operation: ${professionItem.data.data.tier} Tier locked.`);
        return;
      }
      const updated = professionItem.data.data[field].map((x, i) => i === index ? { ...x, purchased: !x.purchased } : x);
      await professionItem.update({ [`data.${field}`]: updated });
    }
    html.find(".purchase-link").click(updatePurchased);

    html.find(".reset-ranks").click(() => {
      this.actor.update({
        "data.corruption.value": 0
      })
    })
    // Reset Order and Chaos Ranks
    html.find(".reset-ranks").contextmenu(() => {
      Dialog.confirm({
        title: `Reset Ranks?`,
        content: `<p>Are you sure?<br/>Your order and chaos ranks will reset to 0!</p>`,
        yes: () => this.actor.update({
          "data.chaosRanks.value": 0,
          "data.orderRanks.value": 0
        }),
        defaultYes: false
      });
    });

    html.find(".peril-rolls .image-container").click(async (event) => {
      const perilType = ZweihanderDice.PERIL_ROLL_TYPES[event.currentTarget.dataset.perilType.toUpperCase()];
      ZweihanderDice.rollPeril(perilType, this.actor);
    });

    // Modify numerable value by clicking '+' and '-' buttons on sheet, e.g. quantity, encumbrance 
    const updateNumerable = (i) => async (event) => {
      const lookup = (obj, key) => {
        const keys = key.split('.');
        let val = obj;
        for (let key of keys) {
          val = val?.[key];
        }
        return val;
      };

      const numerablePath = event.currentTarget.dataset.numerablePath;

      const itemElement = $(event.currentTarget).parents(".item");
      const item = this.actor.items.get($(itemElement).data("itemId"));

      const newNumerableValue = lookup(item.data, numerablePath) + i;

      await item.update({ [`${numerablePath}`]: newNumerableValue >= 0 ? newNumerableValue : 0 });
    };

    html.find('.numerable-field-subtract').click(updateNumerable(-1));
    html.find('.numerable-field-add').click(updateNumerable(1));

    html.find('.focus-indicator').hover(
      (event) => {
        const tooltip = $(event.currentTarget).parents('.skill-roll').find('.focus-tooltip').clone();
        if(!tooltip.length)
          return;

        const offset = $(event.currentTarget).offset();
        offset.top += 25;
        offset.left -= (125 / 2) - 7;
        tooltip.addClass('zh-focuses-tooltip-instance');
        tooltip.offset(offset);
        $('body').append(tooltip);
      },
      (event) => {
        $('.zh-focuses-tooltip-instance').remove();
      })
  }

  _updateEncumbranceMeter(html) {
    const encumbranceData = this.actor.data.data.stats.secondaryAttributes.encumbrance;
    const currentEncumbrance = encumbranceData.current;
    const totalEncumbrance = encumbranceData.value;
    let ratio = (currentEncumbrance / totalEncumbrance) * 100;
    if (ratio > 100) {
      ratio = 100;
      html.find(".encumbrance-bar-container").addClass("encumbrance-overage");
    }
    html.find(".encumbrance-bar").css("width", ratio + "%");
  }

  _getHeaderButtons() {
    let buttons = super._getHeaderButtons();
    const canConfigure = game.user.isGM || this.actor.isOwner;
    if (this.options.editable && canConfigure) {
      buttons.splice(1, 0, {
        label: 'Actor',
        class: 'configure-actor',
        icon: 'fas fa-user-cog',
        onclick: () => this.#actorConfig.render(true)
      });
    }
    return buttons;
  }

  async _render(force, options) {
    if (this.actor.limited) {
      const classesWithoutDamageTracker = this.constructor.defaultOptions.classes;
      classesWithoutDamageTracker.splice(classesWithoutDamageTracker.indexOf('damage-tracker'), 1);
      options.classes = ['limited', ...classesWithoutDamageTracker, ...(options.classes?.length ? options.classes : [])];
      options.height = 235;
      options.width = 650;
      options.resizable = false;
    }
    await super._render(force, options);
  }

}
