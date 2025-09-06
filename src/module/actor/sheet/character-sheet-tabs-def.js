import { localizePath } from '../../utils';

export function getItemGroups(groupsData) {
  return {
    weapons: {
      title: 'weapons',
      type: 'weapon',
      summaryTemplate: 'item-summary/weapon',
      rollType: 'weapon-roll',
      rollLabelKey: 'system.associatedSkill',
      details: [
        {
          title: 'distance',
          size: 100,
          key: 'system.distance.value',
          class: 'inject-data',
        },
        {
          title: 'load',
          size: 80,
          key: 'system.ranged.load',
        },
        {
          title: 'enc',
          size: 80,
          key: 'system.encumbrance',
          isNumerable: true,
        },
        {
          title: 'equipped',
          size: 80,
          key: 'system.equipped',
          isCheckbox: true,
        },
        {
          title: 'carried',
          size: 80,
          key: 'system.carried',
          isCheckbox: true,
        },
      ],
      items: groupsData.weapons,
    },
    armor: {
      title: 'armor',
      type: 'armor',
      summaryTemplate: 'item-summary/armor',
      details: [
        {
          title: 'dtm',
          size: 80,
          key: 'system.damageThresholdModifier',
        },
        {
          title: 'enc',
          size: 80,
          key: 'system.encumbrance',
          isNumerable: true,
        },
        {
          title: 'equipped',
          size: 80,
          key: 'system.equipped',
          isCheckbox: true,
        },
        {
          title: 'carried',
          size: 80,
          key: 'system.carried',
          isCheckbox: true,
        },
      ],
      items: groupsData.armor,
    },
    trappings: {
      title: 'trappings',
      type: 'trapping',
      summaryTemplate: 'item-summary/trapping',
      details: [
        {
          title: 'category',
          size: 160,
          key: localizePath('system.details.category'),
          filterable: true,
        },
        {
          title: 'qty',
          size: 80,
          key: 'system.quantity',
          isNumerable: true,
        },
        {
          title: 'enc',
          size: 80,
          key: 'system.encumbrance',
          isNumerable: true,
        },
        {
          title: 'carried',
          size: 160,
          key: 'system.carried',
          isCheckbox: true,
        },
      ],
      items: groupsData.trappings,
    },
    spells: {
      title: 'spells',
      type: 'spell',
      summaryTemplate: 'item-summary/spell',
      rollType: 'spell-roll',
      rollLabel: groupsData.system.stats.secondaryAttributes.magick.associatedSkill,
      details: [
        {
          title: 'principle',
          size: 140,
          key: 'system.principle',
        },
        {
          title: 'distance',
          size: 200,
          key: 'system.distance',
          class: 'inject-data',
        },
        {
          title: 'duration',
          size: 100,
          key: 'system.duration.label',
          class: 'inject-data',
        },
      ],
      items: groupsData.spells,
    },
    rituals: {
      title: 'rituals',
      type: 'ritual',
      summaryTemplate: 'item-summary/ritual',
      details: [
        {
          title: 'channelpoweras',
          size: 140,
          key: 'system.channelAs',
        },
        {
          title: 'difficulty',
          size: 200,
          key: 'system.difficulty.value',
        },
        {
          title: 'castingtime',
          size: 100,
          key: 'system.castingTime.value',
          class: 'inject-data',
        },
      ],
      items: groupsData.rituals,
    },
    conditions: {
      title: 'otherconditions',
      type: 'condition',
      summaryTemplate: 'item-summary/condition',
      details: [
        {
          title: 'category',
          size: 140,
          key: localizePath('system.details.category'),
        },
        {
          title: 'ineffect',
          size: 140,
          key: 'system.active',
          isCheckbox: true,
        },
      ],
      items: groupsData.conditions,
    },
    effectsTemporary: {
      title: 'temporaryeffects',
      type: 'effect',
      isEffect: true,
      summaryTemplate: 'item-summary/effect',
      details: [
        {
          title: 'source',
          size: 210,
          key: 'system.details.source',
        },
        {
          title: 'ineffect',
          size: 140,
          key: 'system.isActive',
          isCheckbox: true,
        },
      ],
      items: groupsData.effectsTemporary,
    },
    effectsPassive: {
      title: 'passiveeffects',
      type: 'effect',
      isEffect: true,
      summaryTemplate: 'item-summary/effect',
      details: [
        {
          title: 'source',
          size: 210,
          key: 'system.details.source',
        },
        {
          title: 'ineffect',
          size: 140,
          key: 'system.isActive',
          isCheckbox: true,
        },
      ],
      items: groupsData.effectsPassive,
    },
    effectsInactive: {
      title: 'inactiveeffects',
      type: 'effect',
      isEffect: true,
      summaryTemplate: 'item-summary/effect',
      details: [
        {
          title: 'source',
          size: 210,
          key: 'system.details.source',
        },
        {
          title: 'ineffect',
          size: 140,
          key: 'system.isActive',
          isCheckbox: true,
        },
      ],
      items: groupsData.effectsInactive,
    },
    disorders: {
      title: 'disorders',
      type: 'disorder',
      summaryTemplate: 'item-summary/disorder',
      details: [
        {
          title: 'category',
          size: 140,
          key: localizePath('system.details.category'),
        },
        {
          title: 'ineffect',
          size: 140,
          key: 'system.active',
          isCheckbox: true,
        },
      ],
      items: groupsData.disorders,
    },
    diseases: {
      title: 'diseases',
      type: 'disease',
      summaryTemplate: 'item-summary/disease',
      details: [
        {
          title: 'duration',
          size: 140,
          key: 'system.duration.value',
          isNumerable: true,
          unit: ' ' + game.i18n.localize('ZWEI.actor.items.durationdays'),
          conditionalKey: 'system.duration.lastsUntilCured',
          conditionalKeyLabel: game.i18n.localize('ZWEI.actor.items.untilcured'),
        },
        {
          title: 'resist',
          size: 140,
          key: 'system.resist',
          class: 'inject-data-disease',
        },
        {
          title: 'ineffect',
          size: 140,
          key: 'system.active',
          isCheckbox: true,
        },
      ],
      items: groupsData.diseases,
    },
    injuries: {
      title: 'injuries',
      type: 'injury',
      summaryTemplate: 'item-summary/injury',
      details: [
        {
          title: 'recuperationtime',
          size: 140,
          key: 'system.recuperationTime',
          isNumerable: true,
          unit: ' ' + game.i18n.localize('ZWEI.actor.items.durationdays'),
        },
        {
          title: 'severity',
          size: 140,
          value: function () {
            return game.i18n.localize(
              'ZWEI.actor.items.injuryseverity.' +
                CONFIG.ZWEI.injurySeverities[this.system.severity].label.toLowerCase()
            );
          },
        },
        {
          title: 'ineffect',
          size: 140,
          key: 'system.active',
          isCheckbox: true,
        },
      ],
      items: groupsData.injuries,
    },
    taints: {
      title: 'taintschaos',
      type: 'taint',
      summaryTemplate: 'item-summary/taint',
      details: [
        {
          title: 'category',
          size: 140,
          key: localizePath('system.details.category'),
        },
        {
          title: 'ineffect',
          size: 150,
          key: 'system.active',
          isCheckbox: true,
        },
      ],
      items: groupsData.taints,
    },
    professions: {
      title: 'professions',
      type: 'profession',
      summaryTemplate: 'item-summary/profession',
      details: [
        {
          title: 'tier',
          size: 120,
          key: 'system.tier',
        },
        {
          title: 'archetype',
          size: 140,
          key: 'system.archetype',
        },
        {
          title: 'completed',
          size: 100,
          key: 'system.completed',
          isCheckbox: true,
          classes: 'profession-checkbox',
        },
      ],
      items: groupsData.professions,
    },
    traits: {
      title: 'traits',
      type: 'trait',
      summaryTemplate: 'item-summary/trait',
      details: [
        {
          title: 'source',
          size: 240,
          key: 'source',
        },
      ],
      items: groupsData.traits,
    },
    drawbacks: {
      title: 'drawbacks',
      type: 'drawback',
      summaryTemplate: 'item-summary/drawback',
      details: [
        {
          title: 'source',
          size: 240,
          key: 'source',
        },
      ],
      items: groupsData.drawbacks,
    },
    talents: {
      title: 'talents',
      type: 'talent',
      summaryTemplate: 'item-summary/talent',
      details: [
        {
          title: 'source',
          size: 240,
          key: 'source',
        },
      ],
      items: groupsData.talents,
    },
    uniqueAdvances: {
      title: 'uniqueadvances',
      type: 'uniqueAdvance',
      summaryTemplate: 'item-summary/uniqueAdvance',
      details: [
        {
          title: 'type',
          size: 140,
          key: 'system.advanceType',
        },
        {
          title: 'rpcost',
          size: 100,
          key: 'system.rewardPointCost',
        },
      ],
      items: groupsData.uniqueAdvances,
    },
  };
}

export function attachTabDefinitions(context) {
  const $$ = (x) => context.itemGroups[x];
  const tabDefinitions = {
    trappings: {
      headerTemplate: 'character/currency',
      footerTemplate: 'character/encumbrance-meter',
      itemGroups: ['weapons', 'armor', 'trappings'].map($$),
    },
    afflictions: {
      itemGroups: [
        'effectsTemporary',
        'effectsPassive',
        'effectsInactive',
        'disorders',
        'diseases',
        'injuries',
        'conditions',
      ].map($$),
    },
    tiers: {
      itemGroups: ['professions', 'traits', 'drawbacks', 'talents', 'uniqueAdvances'].map($$),
    },
  };

  // Magick tab is not always present
  if (context.tabs.magick) {
    tabDefinitions.magick = {
      footerTemplate: 'character/magick-skill-selector',
      itemGroups: ['spells', 'rituals'].map($$),
    };
  }

  foundry.utils.mergeObject(context.tabs, tabDefinitions, { overwrite: false });
}
