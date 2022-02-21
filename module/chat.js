import * as ZweihanderDice from "./dice";
import * as ZweihanderUtils from "./utils";

export function addGlobalChatListeners(html) {
  html.on("click", ".zh-expandable", (event) => {
    event.currentTarget.classList.toggle('zh-collapsed');
  });
}

export function addLocalChatListeners(message, html, data) {
  const flags = message?.data?.flags?.zweihander;
  if (flags) {
    enableChatButtons(html, flags, message, data);
  }
}

function enableChatButtons(html, flags, message, data) {
  const skillTestData = flags?.skillTestData;
  if (skillTestData) {
    const { outcome, actorId, skillItemId, testType, testConfiguration } = skillTestData;
    const actor = game.actors.get(actorId);
    // enable re-roll button
    if ((game.user.isGM || actorId === ZweihanderUtils.determineCurrentActorId()) && outcome !== ZweihanderDice.OUTCOME_TYPES.CRITICAL_FAILURE) {
      html.find('.skill-test-reroll').prop("disabled", false);
      $(html).on("click", ".skill-test-reroll", (event) => {
        ZweihanderDice.reRollTest(actorId, skillItemId, testType, testConfiguration, { showDialog: event.shiftKey });
      });
    }
    // enable damage button
    if ((game.user.isGM || actorId === ZweihanderUtils.determineCurrentActorId()) && ZweihanderDice.isSuccess(outcome)) {
      html.find('.skill-test-damage').prop("disabled", false);
      $(html).on("click", ".skill-test-damage", (event) => {
        ZweihanderDice.rollWeaponDamage(actorId, testConfiguration);
      });
    }
    // enable parry button
    if ((game.user.isGM || actorId !== ZweihanderUtils.determineCurrentActorId()) && ZweihanderDice.isSuccess(outcome)) {
      html.find('.skill-test-parry').prop("disabled", false);
      $(html).on("click", ".skill-test-parry", (event) => {
        ZweihanderDice.rollCombatReaction('parry', actorId, testConfiguration);
      });
    }
    // enable dodge button
    if ((game.user.isGM || actorId !== ZweihanderUtils.determineCurrentActorId()) && ZweihanderDice.isSuccess(outcome)) {
      html.find('.skill-test-dodge').prop("disabled", false);
      $(html).on("click", ".skill-test-dodge", (event) => {
        ZweihanderDice.rollCombatReaction('dodge', actorId, testConfiguration);
      });
    }
  }
  const weaponTestData = flags?.weaponTestData;
  if (weaponTestData) {
    const actorId = weaponTestData.actorId;
    if ((game.user.isGM || actorId == ZweihanderUtils.determineCurrentActorId()) && !weaponTestData.exploded) {
      html.find('.damage-roll-explode').prop("disabled", false);
      $(html).on("click", ".damage-roll-explode", (event) => {
        ZweihanderDice.explodeWeaponDamage(message, 'fortune');
      });
    }
    if (game.user.isGM && !weaponTestData.exploded) {
      html.find('.damage-roll-explode-misfortune').prop("disabled", false);
      $(html).on("click", ".damage-roll-explode-misfortune", (event) => {
        ZweihanderDice.explodeWeaponDamage(message, 'misfortune');
      });
    }
  }
}