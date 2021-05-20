import UtilityHelpers from "./utility-helpers.js";

/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class ZweihanderActor extends Actor {

  /** @override */
  getRollData() {
    const data = this.toObject(false).data;
    return data;
  }

  prepareBaseData() {
    super.prepareBaseData();

    // console.log("Preparing BASE data...")

    const actorData = this.data;
    const data = actorData.data;
    const flags = actorData.flags;

    if (actorData.type === "character") {
      this._prepareCharacterBaseData(actorData);
    } else if (actorData.type === "npc") {
      this._prepareNpcBaseData(actorData);
    }
  }

  prepareEmbeddedEntities() {
    super.prepareEmbeddedEntities();

    // console.log("Preparing EMBEDDED ENTITIES...")
    
    const actorData = this.data;
  
    if (actorData.type === "character") {
      this._prepareCharacterItems(actorData);
    } else if (actorData.type === "npc") {
      this._prepareNpcItems(actorData);
    }
  }

  prepareDerivedData() {
    super.prepareDerivedData();

    // console.log("Preparing DERIVED data...")

    const actorData = this.data;

    if (actorData.type === "character") {
      this._prepareCharacterDerivedData(actorData);
    } else if (actorData.type === "npc") {
      this._prepareNpcDerivedData(actorData);
    }
  }

  _prepareCharacterBaseData(actorData) {
    const data = actorData.data;
  
  }

  _prepareCharacterDerivedData(actorData) {
    const data = actorData.data;

    // Auto-calculate Reward Points
    if (game.settings.get("zweihander", "trackRewardPoints")) {
      data.rewardPoints.spent = actorData.professions
        .map(profession => { 
          let tierMultiplier;

          switch (profession.data.tier.value) {
            case "Basic":
              tierMultiplier = 100;
              break;
            case "Intermediate":
              tierMultiplier = 200;
              break;
            case "Advanced":
              tierMultiplier = 300;
              break;
            default:
              tierMultiplier = 0;
              break;
          } 

          return tierMultiplier * profession.data.tier.advancesPurchased;
        })
        .concat(actorData.uniqueAdvances.map(advance => advance.data.rewardPointCost.value))
        .reduce((acc, value) => acc + value, 0);

      data.rewardPoints.current = data.rewardPoints.total - data.rewardPoints.spent;
    }
    
    // Calculate primary attribute bonuses (first digit)
    for (let attribute of Object.values(data.stats.primaryAttributes)) {
      const attributeString = ('' + attribute.value);
      attribute.bonus = attributeString.length == 1 ? 0 : Number(attributeString[0]);
    }

    // Add Ancestral Modifiers to the primary pttribute bonuses
    const ancestry = actorData.ancestry[0];

    if (ancestry) {
      for (let positiveModifier of ancestry.data.ancestralModifiers.positive.value.split(", ")) {
        if (!positiveModifier)
          break;

        const modifier = positiveModifier.replace(/[\[\]]/g, "")[0].toLowerCase();

        switch (modifier) {
          case "c":
            data.stats.primaryAttributes.combat.bonus += 1;
            break;
          case "b":
            data.stats.primaryAttributes.brawn.bonus += 1;
            break;
          case "a":
            data.stats.primaryAttributes.agility.bonus += 1;
            break;
          case "i":
            data.stats.primaryAttributes.intelligence.bonus += 1;
            break;
          case "p":
            data.stats.primaryAttributes.perception.bonus += 1;
            break;
          case "w":
            data.stats.primaryAttributes.willpower.bonus += 1;
            break;
          case "f":
            data.stats.primaryAttributes.fellowship.bonus += 1;
            break;
          default:
            console.log("No attribute found for value ", positiveModifier + ".");
            break;
        }
      }

      for (let negativeModifier of ancestry.data.ancestralModifiers.negative.value.split(", ")) {
        if (!negativeModifier)
          break;

        const modifier = negativeModifier.replace(/[\[\]]/g, "")[0].toLowerCase();

        switch (modifier) {
          case "c":
            data.stats.primaryAttributes.combat.bonus -= 1;
            break;
          case "b":
            data.stats.primaryAttributes.brawn.bonus -= 1;
            break;
          case "a":
            data.stats.primaryAttributes.agility.bonus -= 1;
            break;
          case "i":
            data.stats.primaryAttributes.intelligence.bonus -= 1;
            break;
          case "p":
            data.stats.primaryAttributes.perception.bonus -= 1;
            break;
          case "w":
            data.stats.primaryAttributes.willpower.bonus -= 1;
            break;
          case "f":
            data.stats.primaryAttributes.fellowship.bonus -= 1;
            break;
          default:
            console.log("No attribute found for value ", negativeModifier + ".");
            break;
        }
      }
    }

    for (let profession of actorData.professions) {
      const advanceData = profession.data.bonusAdvances.arrayOfValues;

      if (advanceData.length > 0) {
        for (let advance of advanceData) {
          const cleanAdvance = advance.name.replace(/[\[\]]/g, "")[0].toLowerCase();
  
          if (advance.purchased) {
            switch (cleanAdvance) {
              case "c":
                data.stats.primaryAttributes.combat.bonus += 1;
                break;
              case "b":
                data.stats.primaryAttributes.brawn.bonus += 1;
                break;
              case "a":
                data.stats.primaryAttributes.agility.bonus += 1;
                break;
              case "i":
                data.stats.primaryAttributes.intelligence.bonus += 1;
                break;
              case "p":
                data.stats.primaryAttributes.perception.bonus += 1;
                break;
              case "w":
                data.stats.primaryAttributes.willpower.bonus += 1;
                break;
              case "f":
                data.stats.primaryAttributes.fellowship.bonus += 1;
                break;
              default:
                console.log("No attribute found for value ", advance + ".");
                break;
            }
          }
        }
      }
    }

    // Assign Peril Threshold values
    var initialPeril = data.stats.primaryAttributes.willpower.bonus, perilModifier = 3;

    const perilArray = Object.keys(data.stats.secondaryAttributes.perilThreshold);

    for (let i = 0; i < perilArray.length; i++) {
      data.stats.secondaryAttributes.perilThreshold[perilArray[i]] = initialPeril += perilModifier;

      if (i % 2)
        perilModifier += 3;
    }


    // Assign Damage Threshold values
    var initialDamage = data.stats.primaryAttributes.brawn.bonus, damageModifier = 6;

    const damageArray = Object.keys(data.stats.secondaryAttributes.damageThreshold);

    data.stats.secondaryAttributes.damageThreshold[damageArray[0]] = initialDamage;

    for (let i = 1; i < damageArray.length; i++)
      data.stats.secondaryAttributes.damageThreshold[damageArray[i]] = initialDamage += damageModifier;


    // Assign initial encumbrance values
    data.stats.secondaryAttributes.encumbrance.value = data.stats.primaryAttributes.brawn.bonus + 3;

    // Assign a value to Parry equal to the value of its underlying skill 
    const parrySkill = data.stats.secondaryAttributes.parry.associatedSkill;
    const parrySkillItem = actorData.skills.find(skill => skill.name === parrySkill);

    if (parrySkillItem !== undefined) {
      const parryAttribute = parrySkillItem.data.associatedPrimaryAttribute.value.toLowerCase();
      const parryValue = data.stats.primaryAttributes[parryAttribute].value + parrySkillItem.data.ranks.bonus;  // TODO IGNORE SKILL RANKS

      data.stats.secondaryAttributes.parry.value = parryValue;
    }

    // Assign a value to Dodge equal to the value of its underlying skill 
    const dodgeSkill = data.stats.secondaryAttributes.dodge.associatedSkill;
    const dodgeSkillItem = actorData.skills.find(skill => skill.name === dodgeSkill);

    if (dodgeSkillItem !== undefined) {
      const dodgeAttribute = dodgeSkillItem.data.associatedPrimaryAttribute.value.toLowerCase();
      const dodgeValue = data.stats.primaryAttributes[dodgeAttribute].value + dodgeSkillItem.data.ranks.bonus;  // TODO IGNORE SKILL RANKS
  
      data.stats.secondaryAttributes.dodge.value = dodgeValue;
    }


    // Assign Damage Threshold Modifier from equipped armor piece
    for (let armor of actorData.armor) {
      if (armor.data.equipped) {
        const dtm = armor.data.damageThresholdModifier.value;
        const enc = armor.data.encumbrance.value;

        for (let i = 0; i < damageArray.length; i++)
          data.stats.secondaryAttributes.damageThreshold[damageArray[i]] += dtm;

        data.stats.secondaryAttributes.encumbrance.current += enc;
        break; // can only have 1 piece of armor equipped
      }
    }


    // Assign equipped Trappings (Misc.) encumbrance
    let totalSmallTrappings = 0;

    for (let trapping of actorData.trappings) {
      if (trapping.data.carried) {
        data.stats.secondaryAttributes.encumbrance.current += (trapping.data.quantity.value * trapping.data.encumbrance.value);

        // Only execute if the option is ticked and the specific item does not already have an encumbrance value assigned
        if (game.settings.get("zweihander", "encumbranceNineForOne") && !trapping.data.encumbrance.value) {
          totalSmallTrappings += trapping.data.quantity.value;
        }
      }
    }

    if (game.settings.get("zweihander", "encumbranceNineForOne"))
      data.stats.secondaryAttributes.encumbrance.current += Math.floor(totalSmallTrappings / 9);


    // Assign coin encumbrance (1000 of *any* type equal 1 point of encumbrance)
    let coinEncumbrance = 0;

    for (let coinType of Object.keys(data.coinage))
      coinEncumbrance += data.coinage[coinType];

    data.stats.secondaryAttributes.encumbrance.current += Math.floor(coinEncumbrance / 1000);


    // Assign equipped Weapons encumbrance
    for (let weapon of actorData.weapons)
      if (weapon.data.equipped)
        data.stats.secondaryAttributes.encumbrance.current += weapon.data.encumbrance.value;


    // Calculate overage values
    const overage = data.stats.secondaryAttributes.encumbrance.current - data.stats.secondaryAttributes.encumbrance.value;
    const correctOverage = data.stats.secondaryAttributes.encumbrance.overage = (overage > 0) ? overage : 0;
    data.stats.secondaryAttributes.initiative.overage = data.stats.secondaryAttributes.movement.overage = correctOverage;


    // Assign Initiative values
    const initiativeValue = data.stats.secondaryAttributes.initiative.value = data.stats.primaryAttributes.perception.bonus + 3;
    data.stats.secondaryAttributes.initiative.current = initiativeValue - correctOverage;


    // Assign Movement values
    const movementValue = data.stats.secondaryAttributes.movement.value = data.stats.primaryAttributes.agility.bonus + 3;
    data.stats.secondaryAttributes.movement.current = movementValue - correctOverage;
  }

  _prepareCharacterItems(actorData) {

    const weapons = [];
    const armor = [];
    const ancestry = [];
    const spells = [];
    const rituals = [];
    const professions = [];
    const skills = [];
    const talents = [];
    const drawbacks = [];
    const traits = [];
    const trappings = [];
    const uniqueAdvances = [];
    const injuries = [];
    const diseases = [];
    const disorders = [];
    const conditions = [];

    for (let item of actorData.items.values()) {
      if (item.type === "weapon")
        weapons.push(item.data);
      else if (item.type === "ancestry")
        ancestry.push(item.data);
      else if (item.type === "armor")
        armor.push(item.data);
      else if (item.type === "spell")
        spells.push(item.data);
      else if (item.type === "ritual")
        rituals.push(item.data);
      else if (item.type === "profession")
        professions.push(item.data);
      else if (item.type === "skill")  // TODO: Don't allow duplicate Skills -- !skills.some(skill => skill.name === item.name)
        skills.push(item.data);
      else if (item.type === "talent")
        talents.push(item.data);
      else if (item.type === "drawback")
        drawbacks.push(item.data);
      else if (item.type === "trait")
        traits.push(item.data);
      else if (item.type === "trapping")
        trappings.push(item.data);
      else if (item.type === "uniqueAdvance")
        uniqueAdvances.push(item.data);
      else if (item.type === "injury")
        injuries.push(item.data);
      else if (item.type === "disease")
        diseases.push(item.data);
      else if (item.type === "disorder")
        disorders.push(item.data);
      else if (item.type === "condition")
        conditions.push(item.data);
    }

    actorData.weapons = weapons;
    actorData.ancestry = ancestry;
    actorData.armor = armor;
    actorData.spells = spells;
    actorData.rituals = rituals;
    actorData.professions = professions;

    actorData.skills = skills.sort((skillA, skillB) => {
      const nameA = skillA.name;
      const nameB = skillB.name;

      if (nameA < nameB) {
        return -1;
      }

      if (nameA > nameB) {
        return 1;
      }

      return 0;
    });

    actorData.talents = talents;
    actorData.drawbacks = drawbacks;
    actorData.traits = traits;
    actorData.trappings = trappings;
    actorData.uniqueAdvances = uniqueAdvances;
    actorData.injuries = injuries;
    actorData.diseases = diseases;
    actorData.disorders = disorders;
    actorData.conditions = conditions;

    let skillCounter = new Map();

    for (let profession of actorData.professions) {
      const skillsArray = profession.data.skillRanks.value.split(", ");

      for (let skill of skillsArray) {
        if (skillCounter.has(skill)) {
          skillCounter.set(skill, skillCounter.get(skill) + 1);
        } else {
          skillCounter.set(skill, 1);
        }
      }
    }

    for (let profession of actorData.professions) {
      const skillsArray = profession.data.skillRanks.value.split(", ");
      let _temp = [];

      for (let skill of skillsArray) {
        if (skill === "")  // An empty input field results in an empty String on split
          break;

        const skillItem = actorData.items.find(item => item.name === skill);
        const ranks = skillItem === undefined ? {} : skillItem.data.data.ranks;

        let toSubtract = 0;

        if (Object.keys(ranks).length) {
          const keysToCheck = ["apprentice", "journeyman", "master"];

          for (let key of keysToCheck) {
            toSubtract += (ranks[key].purchased ? 1 : 0);
          }
        }

        const obj = {
          "name": skill,
          "ranks": ranks,
          "timesAvailable": skillCounter.get(skill) - toSubtract
        };

        _temp.push(obj);
      }

      profession.data.skillRanks.arrayOfValues = _temp;

      const advancesArray = profession.data.bonusAdvances.value.split(','); 

      _temp = [];
      let idxCounter = 0;

      for (let advance of advancesArray) {
        if (advance === "")  // An empty input field results in an empty String on split
          break;
        
        let purchased = false;

        const oldAdvancesArray = profession.data.bonusAdvances.arrayOfValues;

        if ((oldAdvancesArray.length > 0) && (advance.trim() === oldAdvancesArray[idxCounter].name))
          purchased = oldAdvancesArray[idxCounter].purchased;

        const obj = {
          "name": advance.trim(),
          "purchased": purchased,
          "index": idxCounter++
        };

        _temp.push(obj);
      }

      profession.data.bonusAdvances.arrayOfValues = _temp;

      const talentsArray = profession.data.talents.value.split(',');

      _temp = [];

      for (let talent of talentsArray) {
        if (talent === "")  // An empty input field results in an empty String on split
          break;

        const talentItem = actorData.talents.find(item => item.name === talent.trim());
        const purchased = talentItem === undefined ? false : talentItem.data.purchased;

        const obj = {
          "name": talent.trim(),
          "purchased": purchased
        };

        _temp.push(obj);
      }

      profession.data.talents.arrayOfValues = _temp;
    }

    // TODO fetch armor and weapon qualities so player can right-click search them

    for (let armor of actorData.armor)
      armor.data.qualities.arrayOfValues = armor.data.qualities.value.split(", ");
    
    for (let weapon of actorData.weapons)
      weapon.data.qualities.arrayOfValues = weapon.data.qualities.value.split(", ");
  }

  _prepareNpcBaseData(actorData) {

  }

  _prepareNpcDerivedData(actorData) {
    const data = actorData.data;
    
    // Assign Peril Threshold values
    var initialPeril = data.stats.primaryAttributes.willpower.bonus, perilModifier = 3;

    const perilArray = Object.keys(data.stats.secondaryAttributes.perilThreshold);

    for (let i = 0; i < perilArray.length; i++) {
      data.stats.secondaryAttributes.perilThreshold[perilArray[i]] = initialPeril += perilModifier;

      if (i % 2)
        perilModifier += 3;
    }


    // Assign Damage Threshold values
    var initialDamage = data.stats.primaryAttributes.brawn.bonus, damageModifier = 6;

    const damageArray = Object.keys(data.stats.secondaryAttributes.damageThreshold);

    data.stats.secondaryAttributes.damageThreshold[damageArray[0]] = initialDamage;

    for (let i = 1; i < damageArray.length; i++)
      data.stats.secondaryAttributes.damageThreshold[damageArray[i]] = initialDamage += damageModifier;
  }

  _prepareNpcItems(actorData) {
    const weapons = [];
    const ancestry = [];
    const spells = [];
    const rituals = [];
    const skills = [];
    const talents = [];
    const traits = [];
    const trappings = [];
    const injuries = [];
    const conditions = [];

    for (let item of actorData.items.values()) {
      if (item.type === "weapon")
        weapons.push(item.data);
      else if (item.type === "ancestry")
        ancestry.push(item.data);
      else if (item.type === "spell")
        spells.push(item.data);
      else if (item.type === "ritual")
        rituals.push(item.data);
      else if (item.type === "skill")  // TODO: Don't allow duplicate Skills -- !skills.some(skill => skill.name === item.name)
        skills.push(item.data);
      else if (item.type === "talent")
        talents.push(item.data);
      else if (item.type === "trait")
        traits.push(item.data);
      else if (item.type === "trapping")
        trappings.push(item.data);
      else if (item.type === "injury")
        injuries.push(item.data);
      else if (item.type === "condition")
        conditions.push(item.data);
    }

    actorData.weapons = weapons;
    actorData.ancestry = ancestry;
    actorData.spells = spells;
    actorData.rituals = rituals;

    actorData.skills = skills.sort((skillA, skillB) => {
      const nameA = skillA.name;
      const nameB = skillB.name;

      if (nameA < nameB) {
        return -1;
      }

      if (nameA > nameB) {
        return 1;
      }

      return 0;
    });

    actorData.talents = talents;
    actorData.traits = traits;
    actorData.trappings = trappings;
    actorData.injuries = injuries;
    actorData.conditions = conditions;

  }

  /** @override*/
  async _preCreate(data, options, user) {
    await super._preCreate(data, options, user);

    const actorData = this.data;

    if (data.type === "character") {
      let skillPack = game.packs.get("zweihander.skills");

      let toAdd = await skillPack.getDocuments().then(result => {
        return result.map(item => item.toObject());
      });
  
      // Prevent duplicating skills (e.g. when duplicating an Actor)
      let toAddDifference = UtilityHelpers.getSymmetricDifference(toAdd, actorData.skills);
  
      if (toAddDifference.length)
        actorData.update({ "items": toAddDifference });
    }
  }
}
