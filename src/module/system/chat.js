import * as ZweihanderDice from './rolls/dice';
import * as ZweihanderUtils from './utils';

export function addGlobalChatListeners(html) {
  // ...
}

export function addLocalChatListeners(message, html, data) {
  html.querySelectorAll('.title-and-toggle').forEach((el) => {
    el.addEventListener('click', (event) => {
      el.querySelector('.details-toggle').classList.toggle('expanded');

      html.querySelector('.zh-expandable').classList.toggle('zh-collapsed');
    });
  });

  html.querySelectorAll('.ping-token').forEach((el) => {
    el.addEventListener('click', async (event) => {
      const tokenUuid = el.dataset.tokenUuid;
      const actor = fromUuidSync(tokenUuid);
      const [token] = actor?.isToken ? [actor.token?.object] : actor.getActiveTokens(true);

      if (!canvas.ready || !token) return;

      await canvas.ping(token.center);
    });
  });

  const flags = message?.flags?.zweihander;
  if (flags) {
    enableChatButtons(html, flags, message, data);
  }
}

function enableChatButtons(html, flags, message, data) {
  const currentActorUuids = ZweihanderUtils.determineCurrentActorUuids();
  const isGM = game.user.isGM;

  const skillTestData = flags?.skillTestData;
  if (skillTestData) {
    const { outcome, actorUuid, skillItemId, testType, testConfiguration } = skillTestData;

    // enable re-roll button
    if ((isGM || currentActorUuids.has(actorUuid)) && outcome !== ZweihanderDice.OUTCOME_TYPES.CRITICAL_FAILURE) {
      html.querySelectorAll('.skill-test-reroll').forEach((el) => (el.disabled = false));
      html.addEventListener('click', (event) => {
        const target = event.target.closest('.skill-test-reroll');
        if (!target) return;

        ZweihanderDice.reRollTest(actorUuid, skillItemId, testType, testConfiguration, { showDialog: event.shiftKey });
      });
    }

    // enable damage button
    if ((isGM || currentActorUuids.has(actorUuid)) && ZweihanderDice.isSuccess(outcome)) {
      html.querySelectorAll('.skill-test-damage').forEach((el) => (el.disabled = false));
      html.addEventListener('click', (event) => {
        const target = event.target.closest('.skill-test-damage');
        if (!target) return;

        ZweihanderDice.rollWeaponDamage(actorUuid, testConfiguration);
      });
    }

    // enable parry button
    if ((isGM || !currentActorUuids.has(actorUuid)) && ZweihanderDice.isSuccess(outcome)) {
      html.querySelectorAll('.skill-test-parry').forEach((el) => (el.disabled = false));
      html.addEventListener('click', (event) => {
        const target = event.target.closest('.skill-test-parry');
        if (!target) return;

        ZweihanderDice.rollCombatReaction('parry', actorUuid, testConfiguration);
      });
    }

    // enable dodge button
    if ((isGM || !currentActorUuids.has(actorUuid)) && ZweihanderDice.isSuccess(outcome)) {
      html.querySelectorAll('.skill-test-dodge').forEach((el) => (el.disabled = false));
      html.addEventListener('click', (event) => {
        const target = event.target.closest('.skill-test-dodge');
        if (!target) return;

        ZweihanderDice.rollCombatReaction('dodge', actorUuid, testConfiguration);
      });
    }

    // enable peril damage button
    if ((isGM || currentActorUuids.has(actorUuid)) && !ZweihanderDice.isSuccess(outcome)) {
      html.querySelectorAll('.skill-test-madness').forEach((el) => (el.disabled = false));
      html.addEventListener('click', (event) => {
        const target = event.target.closest('.skill-test-madness');
        if (!target) return;

        ZweihanderDice.rollPerilDamage(actorUuid, testConfiguration);
      });
    }
  }

  const weaponTestData = flags?.weaponTestData;
  if (weaponTestData) {
    const { actorUuid, damageApplied, targets, exploded } = weaponTestData;

    html.querySelectorAll('.ping-token').forEach((el) => {
      const tokenUuid = el.dataset.tokenUuid;

      if (targets.some((t) => t.uuid === tokenUuid && t.damaged)) {
        el.classList.add('damaged');
      }
    });

    const hasUndamagedTargets = targets.some((t) => currentActorUuids.has(t.uuid) && !t.damaged);
    const hasAnyUndamagedTargets = targets.some((t) => !t.damaged);

    const showExplodingButtons = !exploded || game.settings.get('zweihander', 'unlimitedFortuneExplodes');

    if (hasAnyUndamagedTargets && (isGM || hasUndamagedTargets) && !damageApplied) {
      html.querySelectorAll('.damage-roll-apply').forEach((el) => (el.disabled = false));
      html.addEventListener('click', async (event) => {
        const target = event.target.closest('.damage-roll-apply');
        if (!target) return;

        await ZweihanderDice.applyDamage(message, targets);
      });
    }
    if ((isGM || currentActorUuids.has(actorUuid)) && showExplodingButtons) {
      html.querySelectorAll('.damage-roll-explode').forEach((el) => (el.disabled = false));
      html.addEventListener('click', (event) => {
        const target = event.target.closest('.damage-roll-explode');
        if (!target) return;

        const mode = event.shiftKey || !game.user.isGM ? 'fortune' : 'misfortune';
        ZweihanderDice.explodeWeaponDamage(message, mode);
      });
    }
  }

  const madnessTestData = flags?.madnessTestData;
  if (madnessTestData) {
    const { target } = madnessTestData;

    if ((isGM || currentActorUuids.has(actorUuid)) && !target.damaged) {
      html.querySelectorAll('.peril-roll-apply').forEach((el) => (el.disabled = false));
      html.addEventListener('click', (event) => {
        const targetEl = event.target.closest('.peril-roll-apply');
        if (!targetEl) return;

        ZweihanderDice.applyPeril(message, target);
      });
    }
  }

  const spellTestData = flags?.skillTestData?.testType === 'spell' && flags?.skillTestData;
  if (spellTestData) {
    const actorUuid = spellTestData.actorUuid;

    html.querySelectorAll('.inline-roll').forEach(async (el) => {
      const actor = fromUuidSync(actorUuid);

      const formula = el.textContent.trim().split('+');
      const diceRoll = formula[0];
      const dataPath = formula[1];

      if (dataPath && dataPath.includes('@')) {
        const newFormula = diceRoll + '+' + (await ZweihanderUtils.parseDataPaths(dataPath, actor));
        el.dataset.formula = newFormula;
        el.innerHTML = '<i class="fas fa-dice-d20"></i> ' + newFormula;
      }
    });
  }
}
