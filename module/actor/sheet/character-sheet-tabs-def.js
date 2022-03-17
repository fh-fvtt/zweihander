export function attachTabDefinitions(data) {
  data.tabs = {
    trappings: {
      headerTemplate: "pc/coinage",
      footerTemplate: "pc/encumbrance-meter",
      itemGroups: [
        {
          title: "Weapons",
          type: "weapon",
          packs: "zweihander.weapons,zweihander.weapons-alt-damage",
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
              key: "data.encumbrance.value"
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
          packs: "zweihander.armor",
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
              key: "data.encumbrance.value"
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
          packs: "zweihander.trappings",
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
              key: "data.quantity.value"
            },
            {
              title: "Enc.",
              size: 100,
              key: "data.encumbrance.value"
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
      footerTemplate: "pc/magick-skill-selector",
      itemGroups: [
        {
          title: "Spells",
          type: "spell",
          packs: "zweihander.magick",
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
          packs: "zweihander.rituals",
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
          packs: "zweihander.conditions",
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
          packs: "zweihander.disorders",
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
          packs: "zweihander.diseases",
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
          packs: "zweihander.injuries",
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
          packs: "zweihander.taints",
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
          items: data.conditions
        }
      ]
    },
    tiers: {
      itemGroups: [
        {
          title: "Professions",
          type: "profession",
          packs: "zweihander.professions",
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
          packs: "zweihander.traits,zweihander.ancestral-traits",
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
          packs: "zweihander.drawbacks",
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
          packs: "zweihander.talents",
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
          type: "uniqueadvance",
          packs: "zweihander.uniqueadvances",
          summaryTemplate: "item-summary/uniqueAdvance",
          details: [
            {
              title: "Category",
              size: 140,
              key: "data.category.value"
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
  };
}