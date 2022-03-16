import ZweihanderBaseActorSheet from "./base-actor-sheet";
import { selectedChoice } from "../../utils";
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
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["zweihander", "sheet", "actor", "creature", "damage-tracker"],
      template: "systems/zweihander/templates/creature/main.hbs",
      width: 620,
      height: 669,
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
        placeholder: 'Classification'
      },
      {
        key: 'role.value',
        placeholder: 'Role'
      },
      {
        key: 'influences.value',
        placeholder: 'Influences'
      }
    ];

    sheetData.itemGroups = {
      attackProfiles: [
        {
          title: "Attack Profiles",
          type: "weapon",
          packs: "zweihander.weapons,zweihander.weapons-alt-damage",
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
          packs: "zweihander.trappings",
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
          packs: "zweihander.traits",
          summaryTemplate: "item-summary/trait",
          details: [],
          items: sheetData.traits
        },
        {
          title: "Spells",
          type: "spell",
          packs: "zweihander.magick",
          summaryTemplate: "item-summary/spell",
          rollType: "spell-roll",
          rollLabel: sheetData.data.stats.secondaryAttributes.magick.associatedSkill,
          details: [],
          items: sheetData.spells
        },
        {
          title: "Taints of Chaos",
          type: "taint",
          packs: "zweihander.taints",
          summaryTemplate: "item-summary/taint",
          details: [],
          items: sheetData.taints
        },
        {
          title: "Conditions",
          type: "condition",
          packs: "zweihander.conditions",
          summaryTemplate: "item-summary/condition",
          details: [],
          items: sheetData.conditions
        },
        {
          title: "Injuries",
          type: "injury",
          packs: "zweihander.injuries",
          summaryTemplate: "item-summary/injury",
          details: [],
          items: sheetData.injuries
        }
      ]
    }
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
    this._registerWidthListener(html, '.skills-container', [{
      width: 260,
      callback: (toggle) => html.find('.skills-list').toggleClass('two-rows', toggle)
    }]);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;
    // auto size the details inputs
    const autoSizeInput = (el) => el.attr('size', Math.max(el.attr('placeholder').length, el.val().length));
    const inputsToAutoSize = html.find('aside.details input.auto-size');
    inputsToAutoSize.each((i, x) => autoSizeInput($(x)));
    inputsToAutoSize.bind('input', (event) => autoSizeInput($(event.currentTarget)));
    html.find('.skills .skill').contextmenu((event) => {
      const skillId = event.currentTarget.dataset.itemId;
      const skillName = this.actor.items.get(skillId).data.name;
      const ranks = this.actor.data.data.skillRanks;
      ranks[skillName] = ((ranks[skillName] ?? 0) + 1) % 4;
      this.actor.update({ 'data.skillRanks': ranks });
    });
    const updateBonusAdvances = (i) => (event) => {
      const pa = event.currentTarget.dataset.primaryAttribute;
      const bonusAdvances = this.actor.data.data.stats.primaryAttributes[pa]?.bonusAdvances + i;
      this.actor.update({ [`data.stats.primaryAttributes.${pa}.bonusAdvances`]: bonusAdvances });
    };
    html.find('.pa-bonus-advance-substract').click(updateBonusAdvances(-1));
    html.find('.pa-bonus-advance-add').click(updateBonusAdvances(1));
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

}
