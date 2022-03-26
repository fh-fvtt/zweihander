import { assignPacks } from "../../utils"

export function attachTabDefinitions(data) {
  data.tabs = assignPacks('character', {
    trappings: {
      headerTemplate: "character/coinage",
      footerTemplate: "character/encumbrance-meter",
      itemGroups: [
        {
          title: "Weapons",
          type: "weapon",
          summaryTemplate: "item-summary/weapon",
          rollType: "weapon-roll",
          rollLabelKey: "data.associatedSkill.value",
          details: [
            {
              title: "Distance",
              size: 100,
              key: "data.distance.value",
              class: "inject-data"
            },
            {
              title: "Load",
              size: 100,
              key: "data.load.value"
            },
            {
              title: "Enc.",
              size: 100,
              key: "data.encumbrance.value",
              isNumerable: true
            },
            {
              title: "Equipped",
              size: 100,
              key: "data.equipped",
              isCheckbox: true
            }
          ],
          items: data.weapons
        },
        {
          title: "Armor",
          type: "armor",
          summaryTemplate: "item-summary/armor",
          details: [
            {
              title: "DTM",
              size: 100,
              key: "data.damageThresholdModifier.value"
            },
            {
              title: "Enc.",
              size: 100,
              key: "data.encumbrance.value",
              isNumerable: true
            },
            {
              title: "Equipped",
              size: 100,
              key: "data.equipped",
              isCheckbox: true
            }
          ],
          items: data.armor
        },
        {
          title: "Trappings",
          type: "trapping",
          summaryTemplate: "item-summary/trapping",
          details: [
            {
              title: "Category",
              size: 140,
              key: "data.category.value"
            },
            {
              title: "Qty.",
              size: 100,
              key: "data.quantity.value",
              isNumerable: true
            },
            {
              title: "Enc.",
              size: 100,
              key: "data.encumbrance.value",
              isNumerable: true
            },
            {
              title: "Carried",
              size: 100,
              key: "data.carried",
              isCheckbox: true
            }
          ],
          items: data.trappings
        }
      ]
    },
    magick: {
      footerTemplate: "character/magick-skill-selector",
      itemGroups: [
        {
          title: "Spells",
          type: "spell",
          summaryTemplate: "item-summary/spell",
          rollType: "spell-roll",
          rollLabel: data.data.stats.secondaryAttributes.magick.associatedSkill,
          details: [
            {
              title: "Principle",
              size: 140,
              key: "data.principle.value"
            },
            {
              title: "Distance",
              size: 200,
              key: "data.distance.value",
              class: "inject-data"
            },
            {
              title: "Duration",
              size: 100,
              key: "data.duration.value",
              class: "inject-data"
            }
          ],
          items: data.spells
        },
        {
          title: "Rituals",
          type: "ritual",
          summaryTemplate: "item-summary/ritual",
          details: [
            {
              title: "Difficulty",
              size: 140,
              key: "data.difficulty.value"
            },
            {
              title: "Channel Power As",
              size: 200,
              key: "data.channelAs.value",
            },
            {
              title: "Casting Time",
              size: 100,
              key: "data.castingTime.value",
              class: "inject-data"
            }
          ],
          items: data.rituals
        }
      ]
    },
    afflictions: {
      itemGroups: [
        {
          title: "Conditions",
          type: "condition",
          summaryTemplate: "item-summary/condition",
          details: [
            {
              title: "Category",
              size: 140,
              key: "data.category.value"
            },
            {
              title: "Currently in Effect",
              size: 150,
              key: "data.active",
              isCheckbox: true
            }
          ],
          items: data.conditions
        },
        {
          title: "Disorders",
          type: "disorder",
          summaryTemplate: "item-summary/disorder",
          details: [
            {
              title: "Category",
              size: 140,
              key: "data.category.value"
            },
            {
              title: "Currently in Effect",
              size: 150,
              key: "data.active",
              isCheckbox: true
            }
          ],
          items: data.disorders
        },
        {
          title: "Diseases",
          type: "disease",
          summaryTemplate: "item-summary/disease",
          details: [
            {
              title: "Duration",
              size: 140,
              key: "data.duration.value"
            },
            {
              title: "Resist",
              size: 140,
              key: "data.resist.value"
            },
            {
              title: "Currently in Effect",
              size: 150,
              key: "data.active",
              isCheckbox: true
            }
          ],
          items: data.diseases
        },
        {
          title: "Injuries",
          type: "injury",
          summaryTemplate: "item-summary/injury",
          details: [
            {
              title: "Severity",
              size: 140,
              key: "data.severity.value"
            },
            {
              title: "Currently in Effect",
              size: 150,
              key: "data.active",
              isCheckbox: true
            }
          ],
          items: data.injuries
        },
        {
          title: "Taints of Chaos",
          type: "taint",
          summaryTemplate: "item-summary/taint",
          details: [
            {
              title: "Category",
              size: 140,
              key: "data.category.value"
            },
            {
              title: "Currently in Effect",
              size: 150,
              key: "data.active",
              isCheckbox: true
            }
          ],
          items: data.taints
        }
      ]
    },
    tiers: {
      itemGroups: [
        {
          title: "Professions",
          type: "profession",
          summaryTemplate: "item-summary/profession",
          details: [
            {
              title: "Tier",
              size: 120,
              key: "data.tier.value"
            },
            {
              title: "Archetype",
              size: 140,
              key: "data.archetype.value"
            },
            {
              title: "Completed",
              size: 100,
              key: "data.tier.completed",
              isCheckbox: true
            }
          ],
          items: data.professions
        },
        {
          title: "Traits",
          type: "trait",
          summaryTemplate: "item-summary/trait",
          details: [
            {
              title: "Source",
              size: 240,
              key: "source"
            }
          ],
          items: data.traits
        },
        {
          title: "Drawbacks",
          type: "drawback",
          summaryTemplate: "item-summary/drawback",
          details: [
            {
              title: "Source",
              size: 240,
              key: "source"
            }
          ],
          items: data.drawbacks
        },
        {
          title: "Talents",
          type: "talent",
          summaryTemplate: "item-summary/talent",
          details: [
            {
              title: "Source",
              size: 240,
              key: "source"
            }
          ],
          items: data.talents
        },
        {
          title: "Unique Advances",
          type: "uniqueAdvance",
          summaryTemplate: "item-summary/uniqueAdvance",
          details: [
            {
              title: "Type",
              size: 140,
              key: "data.advanceType.value"
            },
            {
              title: "RP Cost",
              size: 100,
              key: "data.rewardPointCost.value"
            }
          ],
          items: data.uniqueAdvances
        }
      ]
    }
  });
}