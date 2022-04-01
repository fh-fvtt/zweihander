import ZweihanderBaseActorSheet from "./base-actor-sheet";
import { assignPacks, selectedChoice } from "../../utils";
export default class ZweihanderCreatureSheet extends ZweihanderBaseActorSheet {


  static unsupportedItemTypes = new Set([
    'ancestry',
    'profession',
    'quality',
    'skill',
    'uniqueAdvance',
    'talent',
    'armor',
    'ritual',
    'disorder',
    'disease'
  ]);

  static get defaultOptions() {
    const compactMode = game.settings.get("zweihander", "openInCompactMode");
    const classes = ["zweihander", "sheet", "actor", "creature", "damage-tracker"];
    if (compactMode) {
      classes.push("zweihander-compact-sheet");
    }
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes,
      template: "systems/zweihander/templates/creature/main.hbs",
      width: compactMode ? 540 : 620,
      height: compactMode ? 540 : 669,
      resizable: true,
      scrollY: ['.save-scroll', '.sheet-body']
    });
  }

  getData(options) {
    const sheetData = super.getData();
    sheetData.choices = {};
    const size = sheetData.data.details.size?.value ?? 1;
    sheetData.choices.sizes = selectedChoice(size, [
      { value: 0, label: 'Small (S)' },
      { value: 1, label: 'Normal (N)' },
      { value: 2, label: 'Large (L)' },
      { value: 3, label: 'Huge (H)' },
    ]);
    const rf = sheetData.data.details.riskFactor?.value ?? 0;
    sheetData.choices.riskFactors = selectedChoice(rf, [
      { value: 0, label: 'Basic' },
      { value: 1, label: 'Intermediate' },
      { value: 2, label: 'Advanced' },
      { value: 3, label: 'Elite' },
    ]);
    const notch = sheetData.data.details.riskFactor?.notch ?? 1;
    sheetData.choices.notches = selectedChoice(notch, [
      { value: 0, label: '(Low)' },
      { value: 1, label: '(Medium)' },
      { value: 2, label: '(High)' },
      { value: 3, label: '(Unique)' },
    ]);
    sheetData.details = [
      {
        key: 'size.value',
        choices: sheetData.choices.sizes
      },
      {
        key: 'classification.value',
        placeholder: 'Classification',
        hidden: this.actor.limited
      },
      {
        key: 'role.value',
        placeholder: 'Role',
        hidden: this.actor.limited
      },
      {
        key: 'influences.value',
        placeholder: 'Influences',
        hidden: this.actor.limited
      },
      {
        key: 'languages',
        placeholder: '?',
        template: 'partials/detail-languages',
        hidden: this.actor.limited
      }
    ];

    sheetData.itemGroups = assignPacks('creature', {
      attackProfiles: [
        {
          title: "Attack Profiles",
          type: "weapon",
          summaryTemplate: "item-summary/weapon",
          rollType: "weapon-roll",
          rollLabelKey: "data.associatedSkill.value",
          details: [
            {
              title: "Chance",
              size: 50,
              key: "chance"
            },
            {
              title: "Load",
              size: 40,
              key: "data.load.value"
            }
          ],
          items: sheetData.weapons
        }
      ],
      loot: [
        {
          title: "Loot",
          type: "trapping",
          summaryTemplate: "item-summary/trapping",
          details: [
            {
              title: "Qty.",
              size: 40,
              key: "data.quantity.value"
            }
          ],
          items: sheetData.trappings
        }
      ],
      rules: [
        {
          title: "Traits",
          type: "trait",
          summaryTemplate: "item-summary/trait",
          details: [],
          items: sheetData.traits
        },
        {
          title: "Spells",
          type: "spell",
          summaryTemplate: "item-summary/spell",
          rollType: "spell-roll",
          rollLabel: sheetData.data.stats.secondaryAttributes.magick.associatedSkill,
          details: [],
          items: sheetData.spells
        },
        {
          title: "Taints of Chaos",
          type: "taint",
          summaryTemplate: "item-summary/taint",
          details: [],
          items: sheetData.taints
        },
        {
          title: "Conditions",
          type: "condition",
          summaryTemplate: "item-summary/condition",
          details: [],
          items: sheetData.conditions
        },
        {
          title: "Injuries",
          type: "injury",
          summaryTemplate: "item-summary/injury",
          details: [],
          items: sheetData.injuries
        }
      ]
    })
    return sheetData;
  }

  _prepareItems(data) {
    // set up collections for all item types
    const indexedTypes = [
      "trapping", "condition", "injury", "disease", "disorder", "profession",
      "ancestry", "armor", "weapon", "spell", "ritual", "talent", "trait",
      "drawback", "quality", "skill", "uniqueAdvance", "taint"
    ].filter(t => t === 'skill' || !this.constructor.unsupportedItemTypes.has(t));
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
    // add base chance to weapon data
    data.weapons = data.weapons.map(w => {
      const skill = data.skills.find(s => s.name === w.data.associatedSkill.value);
      const baseChance = data.data.stats.primaryAttributes[skill.data.associatedPrimaryAttribute.value.toLowerCase()].value;
      w.chance = baseChance + skill.data.bonus;
      return w;
    });
  }

  activateListeners(html) {
    super.activateListeners(html);
    // register width listener for skills container
    this._registerDimensionChangeListener(
      html.find('.skills-container'),
      this._getDimensionBreakpointsCallback('innerWidth', [{
        at: 260,
        callback: (toggle) => html.find('.skills-list').toggleClass('two-rows', toggle)
      }])
    );
    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;
    // level skills
    html.find('.skills .skill').contextmenu((event) => {
      const skillId = event.currentTarget.dataset.itemId;
      const skillName = this.actor.items.get(skillId).data.name;
      const ranks = this.actor.data.data.skillRanks;
      ranks[skillName] = ((ranks[skillName] ?? 0) + 1) % 4;
      this.actor.update({ 'data.skillRanks': ranks });
    });
    // level bonus advances
    const updateBonusAdvances = (i) => (event) => {
      const pa = event.currentTarget.dataset.primaryAttribute;
      const bonusAdvances = this.actor.data.data.stats.primaryAttributes[pa]?.bonusAdvances + i;
      this.actor.update({ [`data.stats.primaryAttributes.${pa}.bonusAdvances`]: bonusAdvances });
    };
    html.find('.pa-bonus-advance-substract').click(updateBonusAdvances(-1));
    html.find('.pa-bonus-advance-add').click(updateBonusAdvances(1));
    // manual mode
    html.find('.manual-mode-button').click(() => {
      this.actor.update({ 'data.stats.manualMode': !this.actor.data.data.stats.manualMode });
    }).contextmenu(() => {
      if (!this.actor.data.data.stats.manualMode) {
        const sa = this.actor.data.data.stats.secondaryAttributes;
        const x = 'data.stats.secondaryAttributes';
        this.actor.update({
          [`${x}.movement.value`]: sa.movement.value,
          [`${x}.movement.fly`]: sa.movement.fly,
          [`${x}.initiative.value`]: sa.initiative.value,
          [`${x}.parry.value`]: sa.parry.value,
          [`${x}.dodge.value`]: sa.dodge.value,
          [`${x}.damageThreshold.value`]: sa.damageThreshold.value,
          [`${x}.perilThreshold.value`]: sa.perilThreshold.value,
        });
      }
    });
    html.find('.primary-attributes .pa').contextmenu((event) => {
      const key = event.currentTarget.dataset.primaryAttribute;
      const paValue = this.actor.data.data.stats.primaryAttributes[key].value;
      const rf = this.actor.data.data.details.riskFactor.value;
      const paArray = rf < 3 ? [40, 45, 50, 35] : [50, 55];
      function mod(n, m) { // fix js mod bug -> maybe move this to utils
        return ((n % m) + m) % m;
      }
      const i = mod(paArray.indexOf(paValue) + (event.shiftKey ? -1 : 1), paArray.length);
      this.actor.update({ [`data.stats.primaryAttributes.${key}.value`]: paArray[i] });
    });
  }

  _getHeaderButtons() {
    const buttons = super._getHeaderButtons();
    const compactMode = game.settings.get("zweihander", "openInCompactMode");
    const canConfigure = game.user.isGM || !this.actor.limited;
    if (canConfigure) {
      buttons.splice(0, 0, {
        label: ' Compact Mode',
        class: 'hide-background',
        icon: `hide-background-toggle fas fa-toggle-${compactMode ? "on" : "off"}`,
        onclick: (event) => {
          const sheet = $(event.currentTarget).parents('.sheet');
          sheet.toggleClass('zweihander-compact-sheet');
          $(event.currentTarget).find('.hide-background-toggle')
            .toggleClass('fa-toggle-on')
            .toggleClass('fa-toggle-off');
        }
      });
    }
    return buttons;
  }

  async _render(force, options) {
    if (this.actor.limited) {
      options.classes = ['limited', ...this.constructor.defaultOptions.classes, ...(options.classes?.length ? options.classes : [])];
      options.height = 'auto';
      options.width = 350;
      options.resizable = false;
    }
    await super._render(force, options);
  }

}
