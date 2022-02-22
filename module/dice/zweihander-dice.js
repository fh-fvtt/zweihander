import ZweihanderActorConfig from "../apps/actor-config";
import * as ZweihanderUtils from "../utils";

export default class ZweihanderDice {

  /**
   * The primary function responsible for generating a ChatMessage for a given Skill Test.
   * 
   * @param {*} skillItem The skill Item associated with the roll.
   * @param {object} actorData The ActorData object of the Actor rolling.
   * @param {object} optionalData An optional data object that could be relevant to the roll. Can contain e.g. weapon qualities or spell effects.
   * @param {("skill" | "weapon" | "spell" | "dodge" | "parry")} rollType The type of roll to be generated.
   */
  static async rollSkillTest(skillItem, actor, rollType, optionalData = {}) {
    const actorData = actor.toObject(false);
    const primaryAttribute = skillItem.data.associatedPrimaryAttribute.value;
    const rollTarget = actorData.data.stats.primaryAttributes[primaryAttribute.toLowerCase()].value;

    const rankBonus = skillItem.data.bonus;

    const configOptions = ZweihanderActorConfig.getConfig(actorData);

    const currentPeril = Number(actorData.data.stats.secondaryAttributes.perilCurrent.value);
    const perilOffset = configOptions.perilOffset * 10 ?? 0;
    const perilPenalty = this._calculatePerilPenalty(currentPeril, rankBonus, perilOffset);

    const baseChanceModifier = this._calculateBaseChanceModifier(rankBonus, perilPenalty);

    const rollConfig = await this._renderConfigurationDialog(rollType, skillItem.name, optionalData);

    const additionalChaosDice = rollConfig.additionalChaosDice ? rollConfig.additionalChaosDice : 0;
    const additionalFuryDice = rollConfig.additionalFuryDice ? rollConfig.additionalFuryDice : 0;

    let difficultyRating = Number(rollConfig.difficultyRating);

    if (rollConfig.channelPowerBonus)
      difficultyRating += Number(rollConfig.channelPowerBonus);

    if (difficultyRating > 30)
      difficultyRating = 30;

    const difficultyRatingLabel = this._getDifficultyRatingLabel(difficultyRating);

    const flip = rollConfig.flip;

    const totalChance = this._calculateTotalChance(rollTarget, baseChanceModifier, difficultyRating);

    let roll = new Roll(CONFIG.ZWEI.testRollFormula, actorData.data);
    let rollResult = await roll.evaluate({ "async": true });
    let rollResultTotal = rollResult._total;

    const deconstructedRollData = this._getDeconstructedRollData(rollResultTotal);

    let testResult = this._getTestResult(rollResultTotal, totalChance, deconstructedRollData.match);  // c_fail = 0, fail = 1, success = 2, c_success = 3

    let [finalRoll, showFlip, finalTestResult] = this._handleFlippedResult(rollResultTotal, totalChance, testResult, deconstructedRollData, flip);

    let damageData;
    let chaosData;
    let itemId = skillItem._id;

    if (rollType === "weapon") {
      optionalData.formula = optionalData.formula.replace("[#]", additionalFuryDice);
      optionalData.formula = ZweihanderUtils.abbreviations2DataPath(optionalData.formula);
      itemId = optionalData.weaponId;
      let damageRoll = await this._rollFuryDice(optionalData, actorData);
      // step 1: add all fury die to an exploding-aware string
      // step 2: add static modifiers
      //   solution:
      //      1. count dice in formula
      //      we could assume its always 1 but lets be cautious.
      //      maybe some extension will require us to roll d10 +d6 for damage, who knows..
      //      2. remove dice terms from total result string
      //      3. prepend our custom exploding-aware string
      let indexedDiceTerms = damageRoll.terms
        .filter(x => x?.number >= 0)
        .map((x, i) => ({ value: x, index: i }))
        .filter(x => x.value?.faces);
      let terms = damageRoll.result.split(" + ");
      let explodedTerms = [];
      for (let i = 0; i < terms.length; i++) {
        for (let indexedDiceTerm of indexedDiceTerms) {
          if (indexedDiceTerm.index == i) {
            indexedDiceTerm.value.results
            .map(v => v.result + (v?.exploded ? "*" : ""))
            .forEach(t => explodedTerms.push(t));
          } else {
            explodedTerms.push(terms[i]);
          }
        }
      }
      let furyDiceString;
      if (explodedTerms.length === 0) {
        furyDiceString = "0";
      } else {
        furyDiceString = explodedTerms.reduce((a, b) => a + " + " + b);
      }
      damageData = {
        "damage": damageRoll.total,
        "damageFormula": damageRoll.formula,
        "furyDiceString": furyDiceString,
        "additionalRoll": damageRoll
      }
    } else if (rollType === "spell") {
      itemId = optionalData.spellId;
      if (Number(rollConfig.channelPowerBonus)) {
        const numberOfDice = rollConfig.channelPowerBonus / 10;
        let chaosRoll = await this._rollChaosDice(actorData, numberOfDice + Number(additionalChaosDice));

        chaosData = {
          "chaosFormula": chaosRoll._formula,
          "chaosDice": chaosRoll.dice,
          "channelPowerBonus": rollConfig.channelPowerBonus,
          "additionalRoll": chaosRoll
        }
      }
    }

    rollResult.render().then(() => {
      let templateData = {
        "skill": skillItem.name,
        "primaryAttribute": primaryAttribute,
        "attributeChance": rollTarget,
        "rankBonus": rankBonus,
        "baseChance": rollTarget + baseChanceModifier,
        "totalChance": totalChance,
        "difficultyRating": {
          "value": difficultyRating,
          "label": difficultyRatingLabel
        },
        "perilPenalty": perilPenalty,
        "roll": (finalRoll).toLocaleString(undefined, { "minimumIntegerDigits": 2 }),
        "image": actorData.img,
        "showFlip": showFlip,
        "flip": flip,
        "testResult": finalTestResult,
        "itemId": itemId
      };

      if (!ZweihanderUtils.isObjectEmpty(damageData))
        foundry.utils.mergeObject(templateData, damageData);
      else if (!ZweihanderUtils.isObjectEmpty(chaosData))
        foundry.utils.mergeObject(templateData, chaosData);

      if (!ZweihanderUtils.isObjectEmpty(optionalData))
        foundry.utils.mergeObject(templateData, optionalData);
      const template = this._getTemplate(rollType);

      // prepare roll data for dice so nice
      rollResult.dice[0].options.rollOrder = 1;
      const rolls = [rollResult];
      if (templateData.additionalRoll && finalTestResult >= 2) {
        templateData.additionalRoll.dice[0].options.rollOrder = 2;
        rolls.push(templateData.additionalRoll);
      }
      const pool = PoolTerm.fromRolls(rolls);
      roll = Roll.fromTerms([pool]);

      this._renderChatCard(template, templateData, roll, actor);
    });
  }

  /**
   * Function responsible for rendering a ChatMessage.
   * 
   * @param {*} template The Handlebars template to be used for this ChatMessage.
   * @param {*} templateData The data object to be used by the template.
   */
  static async _renderChatCard(template, templateData, roll, actor) {
    const speaker = ChatMessage.getSpeaker({ actor: actor });
    renderTemplate(template, templateData).then(html => {
      let chatData = {
        "roll": roll,
        "type": CONST.CHAT_MESSAGE_TYPES.ROLL,
        "user": game.user.id,
        "speaker": speaker,
        "content": html
      };
      ChatMessage.create(chatData);
    });
  }

  /**
   * Calculate the penalty to be applied to a roll's base chance due to peril. If a character has no ranks in a skill, the penalty returned is 0.
   * 
   * @param {number} currentPeril The current peril value of the Actor.
   * @param {number} rankBonus The bonus provided by purchased skill ranks.
   * @returns 
   */
  static _calculatePerilPenalty(currentPeril, rankBonus, offset) {
    let penalty = 0;

    if (currentPeril === 3 && rankBonus >= 10) {
      penalty = 10;
    } else if (currentPeril === 2 && rankBonus >= 10 && rankBonus < 20) {
      penalty = 10;
    } else if (currentPeril === 2 && rankBonus >= 20) {
      penalty = 20;
    } else if (currentPeril === 1 && rankBonus >= 10 && rankBonus < 20) {
      penalty = 10;
    } else if (currentPeril === 1 && rankBonus >= 20 && rankBonus < 30) {
      penalty = 20;
    } else if (currentPeril === 1 && rankBonus >= 30) {
      penalty = 30;
    }

    console.log("pen ", penalty)

    return penalty > 0 ? penalty - offset : penalty;
  }

  /**
   * Calculate the final modifier to be applied to a roll's base chance. Returned value cannot be higher than 30, or lower than -30.
   * 
   * @param {number} rankBonus The bonus provided by purchased skill ranks.
   * @param {number} perilPenalty The penalty to be applied due to peril.
   * @returns 
   */
  static _calculateBaseChanceModifier(rankBonus, perilPenalty) {  // TODO: add Talents, Traits and Active Effects
    let baseChanceModifier = rankBonus - perilPenalty;

    if (baseChanceModifier > 30)
      baseChanceModifier = 30;
    else if (baseChanceModifier < -30)
      baseChanceModifier = -30;

    return baseChanceModifier;
  }

  /**
   * Calculate the total chance for the roll to succeed based off of the initial roll target, base chance modifiers and the difficulty rating.
   * 
   * @param {number} rollTarget The initial target for the roll, without any modifiers.
   * @param {number} baseChanceModifier The final modifier to be applied to the target.
   * @param {number} difficultyRating The difficulty rating to be applied to the roll.
   * @returns 
   */
  static _calculateTotalChance(rollTarget, baseChanceModifier, difficultyRating) {
    let totalChance = rollTarget + baseChanceModifier + difficultyRating;

    return (totalChance >= 100 ? 99 : (totalChance < 1 ? 1 : totalChance)).toLocaleString(undefined, { "minimumIntegerDigits": 2 });
  }

  /**
   * Function responsible for rolling Fury Dice, according to a given damage formula.
   * 
   * @param {object} actorData The ActorData object of the Actor rolling.
   * @param {object} damageData An object with relevant weapon data, such as the damage formula.
   * @returns 
   */
  static async _rollFuryDice(damageData, actorData) {
    let roll = new Roll(damageData.formula, actorData.data);
    let rollResult = await roll.evaluate({ "async": true });
    return rollResult;
  }

  /**
   * Function responsible for rolling a variable number of Chaos Dice.
   * 
   * @param {number} actorData The ActorData object of the Actor rolling.
   * @param {number} numberOfDice The initial number of Chaos Dice to be rolled.
   * @returns 
   */
  static async _rollChaosDice(actorData, numberOfDice) {
    let finalFormula = numberOfDice + "d6";

    let roll = new Roll(finalFormula, actorData.data);
    let rollResult = await roll.evaluate({ "async": true });

    return rollResult;
  }

  /**
   * Function responsible for rendering a Dialog object, through which a user can configure a skill test.
   * 
   * @param {string} rollType The type of roll. Different types result in different Dialogs being rendered.
   * @param {string} label The name of the skill that is displayed on the rendered window header.
   * @param {object} optionalData An optional data object to be used by the Dialog template.
   * @returns An object containing a roll's configuration options, based on the type of roll.
   */
  static async _renderConfigurationDialog(rollType, label, optionalData = {}) {
    switch (rollType) {
      case "dodge":
      case "parry":
      case "skill":
        return await new Promise((resolve) => {
          renderTemplate(CONFIG.ZWEI.templates.skillConfigurationDialog, optionalData).then(c => {
            this._createDialog(label, c, (html) => {
              // let input = html.find('[name="exampleInput"]').val();
              let difficultyRating = html.find('[name="difficultyRatingSelect"]').val();
              let flip = html.find('[name="flipSelect"]').val();

              // resolve({ input, difficultyRating, flip });
              resolve({ difficultyRating, flip });
            }).render(true);
          });
        });
      case "spell":
        return await new Promise((resolve) => {
          renderTemplate(CONFIG.ZWEI.templates.spellConfigurationDialog, optionalData).then(c => {
            this._createDialog(label, c, (html) => {
              let additionalChaosDice = html.find('[name="extraChaos"]').val();
              let difficultyRating = html.find('[name="difficultyRatingSelect"]').val();
              let channelPowerBonus = html.find('[name="channelSelect"]').val();
              let flip = html.find('[name="flipSelect"]').val();

              resolve({ additionalChaosDice, difficultyRating, channelPowerBonus, flip });
            }).render(true);
          });
        });
      case "weapon":
        return await new Promise((resolve) => {
          renderTemplate(CONFIG.ZWEI.templates.weaponConfigurationDialog, optionalData).then(c => {
            this._createDialog(label, c, (html) => {
              let additionalFuryDice = html.find('[name="extraFury"]').val();
              let difficultyRating = html.find('[name="difficultyRatingSelect"]').val();
              let channelPowerBonus = html.find('[name="channelSelect"]').val();
              let flip = html.find('[name="flipSelect"]').val();

              resolve({ additionalFuryDice, difficultyRating, channelPowerBonus, flip });
            }).render(true);
          });
        });
      default:
        break;
    }
  }

  /**
   * Build a Dialog object in accordance to the label and content provided. 
   * 
   * @param {string} label A string to be displayed on the window header.
   * @param {string} content The HTML content to be rendered inside the Dialog window.
   * @param {function} callbackOnYes The callback function to be executed if the 'Yes' option is selected.
   * @returns A Dialog object.
   */
  static _createDialog(label, content, callbackOnYes) {
    return new Dialog({
      "title": `${label}: Test Configuration`,
      "content": content,
      "buttons": {
        "no": {
          "icon": '<i class="fas fa-times"></i>',
          "label": 'Cancel'
        },
        "yes": {
          "icon": '<i class="fas fa-check"></i>',
          "label": 'Roll',
          "callback": callbackOnYes
        },
      },
      "default": 'yes'
    });
  }

  /**
   * Get a label that describes the difficulty rating.
   * 
   * @param {number} difficultyRating The numeric difficulty rating.
   * @returns A verbose string representation of the difficulty rating.
   */
  static _getDifficultyRatingLabel(difficultyRating) {
    switch (difficultyRating) {
      case -30:
        return "Arduous -30%"
      case -20:
        return "Hard -20%"
      case -10:
        return "Challenging -10%"
      case 0:
        return "Standard +/-0%"
      case 10:
        return "Routine +10%"
      case 20:
        return "Easy +20%"
      case 30:
        return "Trivial +30%"
      default:
        return "ERROR"
    }
  }

  /**
   * Get the result of a skill test based on the roll result and the chance of success.
   * 
   * @param {number} rollResultTotal The final roll result.
   * @param {number} totalChance The total chance of success.
   * @param {boolean} match A flag used to tell whether the roll result's units and tens digits match. Used to determine critical success or failure.
   * @returns A number representing the result of the roll. 0 is a critical failure, 1 is a failure, 2 is a success and 3 is a critical success.
   */
  static _getTestResult(rollResultTotal, totalChance, match) {
    if (rollResultTotal === 100)
      return 0;
    else if (rollResultTotal === 1)
      return 3;
    else if (rollResultTotal <= totalChance && match)
      return 3;
    else if (rollResultTotal <= totalChance && !match)
      return 2;
    else if (rollResultTotal > totalChance && match)
      return 0;
    else if (rollResultTotal > totalChance && !match)
      return 1;
  }

  /**
   * Get a data object that contains the final roll result's units and tens digits, as well as a flag that tells whether these match.
   * 
   * @param {number} rollResultTotal The final roll result. 
   * @returns A data object.
   */
  static _getDeconstructedRollData(rollResultTotal) {
    const stringifiedRollValue = rollResultTotal.toLocaleString(undefined, { "minimumIntegerDigits": 2 });
    const units = Number(stringifiedRollValue.charAt(stringifiedRollValue.length - 1));
    const tens = Number(stringifiedRollValue.charAt(0));

    const match = units === tens;

    return {
      "stringifiedRollValue": stringifiedRollValue,
      "units": units,
      "tens": tens,
      "match": match
    };
  }

  /**
   * Get the appropriate template for the provided type of roll.
   * 
   * @param {string} rollType The type of roll.
   * @returns The path to the appropriate Handlebars template.
   */
  static _getTemplate(rollType) {
    switch (rollType) {
      case "skill":
        return CONFIG.ZWEI.templates.skill;
      case "spell":
        return CONFIG.ZWEI.templates.spell;
      case "dodge":
        return CONFIG.ZWEI.templates.dodge;
      case "parry":
        return CONFIG.ZWEI.templates.parry;
      case "weapon":
        return CONFIG.ZWEI.templates.weapon;
      default:
        break;
    }
  }

  /**
   * The function responsible for processing a roll result flip. 
   * 
   * @param {number} rollResultTotal The final roll result.
   * @param {number} totalChance The total chance of success.
   * @param {number} testResult A number, from 0 to 3, which respresents the result of a given skill test.
   * @param {object} deconstructedRollData A data object which contains the units and tens digits of the final roll result, as well as a flag telling whether these match.
   * @param {("no-flip" | "succeed" | "fail")} flip A flag which tells the function how the final roll result needs to be flipped.
   * @returns An array containing the final roll result after flip processing, a boolean indicating whether the result was flipped, and the final test result after flip processing, in that order.
   */
  static _handleFlippedResult(rollResultTotal, totalChance, testResult, deconstructedRollData, flip) {
    let finalRoll = deconstructedRollData.stringifiedRollValue;
    let showFlip = false;
    let finalTestResult = testResult;

    if (!deconstructedRollData.match && rollResultTotal !== 100 && rollResultTotal !== 1) {
      const flippedRoll = (deconstructedRollData.units * 10) + deconstructedRollData.tens;

      switch (flip) {
        case "fail":

          // If the roll is a success, check to see if the flipped roll is also a success:
          //   • If yes, get the lowest of the two rolls (lower is worse for degrees of success)
          //   • Otherwise, keep the flipped roll
          //
          // If the roll is a failure, keep the original roll (failures don't matter for degrees of success)

          finalRoll = (testResult >= 2) ?
            ((flippedRoll <= totalChance) ?
              Math.min(flippedRoll, rollResultTotal) :
              flippedRoll) :
            rollResultTotal;

          if (finalRoll !== rollResultTotal)
            showFlip = true;

          if (finalRoll > totalChance && rollResultTotal <= totalChance)  // If roll was Success, but flipped to a Failure
            finalTestResult = 1;
          break;
        case "succeed":

          // If the roll is a failure, check to see if the flipped roll is also a failure:
          //   • If yes, keep the original roll (failures don't matter for degrees of success)
          //   • If no, keep the flipped roll
          //  
          // Otherwise, if the roll is a success, check to see if the flipped roll is also a success:
          //   • If yes, get the highest of the two rolls (higher is better for degrees of success)
          //   • If no, keep the original roll

          if (rollResultTotal === 10) { // A roll of 10 always flips to a 01, a critical success. This is an exception to flip to succeed rules, where higher is usually better.
            finalRoll = 1;
          } else {
            finalRoll = (testResult < 2) ?
              ((flippedRoll > totalChance) ?
                rollResultTotal :
                flippedRoll) :
              ((flippedRoll <= totalChance) ?
                Math.max(flippedRoll, rollResultTotal) :
                rollResultTotal);
          }

          if (finalRoll !== rollResultTotal)
            showFlip = true;

          if (finalRoll <= totalChance && rollResultTotal > totalChance)  // If roll was a Failure, but flipped to a Success
            finalTestResult = 2;
          break;
        default:
          break;
      }
    }

    return [finalRoll, showFlip, finalTestResult];
  }
}