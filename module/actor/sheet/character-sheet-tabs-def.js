import { assignPacks, localizePath } from "../../utils"

export function attachTabDefinitions(data) {
  data.tabs = assignPacks('character', {
    trappings: {
      headerTemplate: "character/currency",
      footerTemplate: "character/encumbrance-meter",
      itemGroups: [
        {
          title: "Weapons",
          type: "weapon",
          summaryTemplate: "item-summary/weapon",
          rollType: "weapon-roll",
          rollLabelKey: "data.associatedSkill",
          details: [
            {
              title: "Distance",
              size: 100,
              key: "data.distance",
              class: "inject-data"
            },
            {
              title: "Load",
              size: 100,
              key: "data.load"
            },
            {
              title: "Enc.",
              size: 100,
              key: "data.encumbrance",
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
              key: "data.damageThresholdModifier"
            },
            {
              title: "Enc.",
              size: 100,
              key: "data.encumbrance",
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
              key: localizePath("data.details.category"),
            },
            {
              title: "Qty.",
              size: 100,
              key: "data.quantity",
              isNumerable: true
            },
            {
              title: "Enc.",
              size: 100,
              key: "data.encumbrance",
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
              key: "data.principle"
            },
            {
              title: "Distance",
              size: 200,
              key: "data.distance",
              class: "inject-data"
            },
            {
              title: "Duration",
              size: 100,
              key: "data.duration",
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
              title: "Channel Power As",
              size: 140,
              key: "data.channelAs",
            },
            {
              title: "Difficulty",
              size: 200,
              key: "data.difficulty"
            },
            {
              title: "Casting Time",
              size: 100,
              key: "data.castingTime",
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
              key: localizePath("data.details.category")
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
              key: localizePath("data.details.category")
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
              key: "data.duration"
            },
            {
              title: "Resist",
              size: 140,
              key: "data.resist"
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
              title: "Recuperation Time",
              size: 140,
              key: "data.recuperationTime",
              isNumerable: true,
              unit: ' days'
            },
            {
              title: "Severity",
              size: 140,
              value: function () {
               return CONFIG.ZWEI.injurySeverities[this.data.severity].label
              }
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
              key: localizePath("data.details.category")
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
              key: "data.tier"
            },
            {
              title: "Archetype",
              size: 140,
              key: "data.archetype"
            },
            {
              title: "Completed",
              size: 100,
              key: "data.completed",
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
              key: "data.advanceType"
            },
            {
              title: "RP Cost",
              size: 100,
              key: "data.rewardPointCost"
            }
          ],
          items: data.uniqueAdvances
        }
      ]
    }
  });
}