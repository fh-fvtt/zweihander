import { sendAnalytics } from './analytics';
import * as ZweihanderDice from './dice';
import * as ZweihanderUtils from './utils';

export function addGlobalChatListeners(html) {
  html.on('click', '.zh-expandable', (event) => {
    event.currentTarget.classList.toggle('zh-collapsed');
  });
}

export function addLocalChatListeners(message, html, data) {
  const flags = message?.flags?.zweihander;
  if (flags) {
    enableChatButtons(html, flags, message, data);
  }
}

function enableChatButtons(html, flags, message, data) {
  if (flags?.analytics && game.settings.get('zweihander', 'systemId') === '') {
    html.find('.analytics-agree').prop('disabled', false);
    html.find('.analytics-decline').prop('disabled', false);
    $(html).on('click', '.analytics-agree', (event) => {
      game.settings.set('zweihander', 'systemId', ZweihanderUtils.uuidv4());
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ alias: 'F&H Development' }),
        flags: {
          zweihander: {
            img: 'systems/zweihander/assets/icons/informer.svg',
            analytics: {},
          },
        },
        whisper: [game.user.id],
        content: game.i18n.localize('ZWEI.othermessages.thankyou'),
      });
      sendAnalytics();
    });
    $(html).on('click', '.analytics-decline', (event) => {
      game.settings.set('zweihander', 'systemId', 'no-analytics');
      message.update({ 'flags.zweihander.analytics.answered': true });
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ alias: 'F&H Development' }),
        flags: {
          zweihander: {
            img: 'systems/zweihander/assets/icons/informer.svg',
            analytics: {},
          },
        },
        whisper: [game.user.id],
        content: game.i18n.localize('ZWEI.othermessages.wontask'),
      });
    });
  }
  const skillTestData = flags?.skillTestData;
  if (skillTestData) {
    const { outcome, actorId, skillItemId, testType, testConfiguration } = skillTestData;
    const actor = game.actors.get(actorId);
    // enable re-roll button
    if (
      (game.user.isGM || actorId === ZweihanderUtils.determineCurrentActorId()) &&
      outcome !== ZweihanderDice.OUTCOME_TYPES.CRITICAL_FAILURE
    ) {
      html.find('.skill-test-reroll').prop('disabled', false);
      $(html).on('click', '.skill-test-reroll', (event) => {
        ZweihanderDice.reRollTest(actorId, skillItemId, testType, testConfiguration, { showDialog: event.shiftKey });
      });
    }
    // enable damage button
    if (
      (game.user.isGM || actorId === ZweihanderUtils.determineCurrentActorId()) &&
      ZweihanderDice.isSuccess(outcome)
    ) {
      html.find('.skill-test-damage').prop('disabled', false);
      $(html).on('click', '.skill-test-damage', (event) => {
        ZweihanderDice.rollWeaponDamage(actorId, testConfiguration);
      });
    }
    // enable parry button
    if (
      (game.user.isGM || actorId !== ZweihanderUtils.determineCurrentActorId()) &&
      ZweihanderDice.isSuccess(outcome)
    ) {
      html.find('.skill-test-parry').prop('disabled', false);
      $(html).on('click', '.skill-test-parry', (event) => {
        ZweihanderDice.rollCombatReaction('parry', actorId, testConfiguration);
      });
    }
    // enable dodge button
    if (
      (game.user.isGM || actorId !== ZweihanderUtils.determineCurrentActorId()) &&
      ZweihanderDice.isSuccess(outcome)
    ) {
      html.find('.skill-test-dodge').prop('disabled', false);
      $(html).on('click', '.skill-test-dodge', (event) => {
        ZweihanderDice.rollCombatReaction('dodge', actorId, testConfiguration);
      });
    }
  }
  const weaponTestData = flags?.weaponTestData;
  if (weaponTestData) {
    const actorId = weaponTestData.actorId;
    const showExplodingButtons =
      !weaponTestData.exploded || game.settings.get('zweihander', 'unlimitedFortuneExplodes');
    if ((game.user.isGM || actorId == ZweihanderUtils.determineCurrentActorId()) && showExplodingButtons) {
      html.find('.damage-roll-explode').prop('disabled', false);
      $(html).on('click', '.damage-roll-explode', (event) => {
        ZweihanderDice.explodeWeaponDamage(message, 'usefortune');
      });
    }
    if (game.user.isGM && showExplodingButtons) {
      html.find('.damage-roll-explode-misfortune').prop('disabled', false);
      $(html).on('click', '.damage-roll-explode-misfortune', (event) => {
        ZweihanderDice.explodeWeaponDamage(message, 'usemisfortune');
      });
    }
  }

  const spellTestData = flags?.skillTestData?.testType === 'spell' && flags?.skillTestData;
  if (spellTestData) {
    const actorId = spellTestData.actorId;
    const actor = game.actors.get(actorId);

    html.find('.inline-roll').each(async function () {
      const formula = $(this).text().trim().split('+');
      const diceRoll = formula[0];
      const dataPath = formula[1];

      if (dataPath && dataPath.includes('@')) {
        const newFormula = diceRoll + '+' + (await ZweihanderUtils.parseDataPaths(dataPath, actor));
        this.dataset.formula = newFormula;
        $(this).html('<i class="fas fa-dice-d20"></i> ' + newFormula);
      }
    });
  }
}
