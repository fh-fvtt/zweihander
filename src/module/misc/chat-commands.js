/*
  Chat Commander integration.
 */

import * as ZweihanderUtils from "../utils";
import { getTestConfiguration } from "../apps/test-config";
import { rollTest } from "../dice";
import { displayHelpMessage } from "./help";

async function invokeSkillTest(chatlog, parameters, chatdata) {
  const actors = game.user.isGM
    ? game.canvas.tokens.controlled.map((t) => t.actor)
    : [game.actors.get(ZweihanderUtils.determineCurrentActorId(true))];
  let testConfiguration;
  if (actors.length === 0) {
    ui.notifications.warn(
      game.i18n.localize("ZWEI.othermessages.selecttoken")
    );
  }
  for (let actor of actors) {
    const skillItem = actor?.items?.find?.(
      (i) => i.type === 'skill' && ZweihanderUtils.normalizedEquals(i.name, parameters)
    );
    if (skillItem) {
      if (!testConfiguration) {
        testConfiguration = await getTestConfiguration(skillItem);
      }
      await rollTest(skillItem, 'skill', testConfiguration);
    } else if (actor) {
      ui.notifications.warn(
        game.i18n.format("ZWEI.othermessages.noskill", { message: parameters })
      );
      break;
    }
  }
}

async function postNextSession(chatlog, messageText, chatdata) {
  const nextSession = new Date(messageText);
  const response = await foundry.utils.fetchJsonWithTimeout(foundry.utils.getRoute('setup'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: game.world.id,
      nextSession: nextSession.toISOString(),
      action: 'editWorld',
    }),
  });
  game.world.updateSource(response);
  return ({
    flavor: game.i18n.localize("ZWEI.othermessages.settingdate"),
    content: game.i18n.format("ZWEI.othermessages.nextsession", { next: nextSession.toLocaleDateString() }),
  });
}

export function registerChatCommands(chatCommands) {
  const CHAT_COMMANDS = [
    {
      name: '/test',
      callback: invokeSkillTest,
      icon: '<i class="fas fa-comment-dots"></i>',
      description: 'Do a Skill Test',
    },
    {
      name: '/nextSession',
      callback: postNextSession,
      icon: '<i class="fas fa-calendar"></i>',
      requiredRole: "GAMEMASTER",
      description: game.i18n.localize("ZWEI.othermessages.setdate"),
    },
    {
      name: '/help',
      callback: displayHelpMessage,
      icon: '<i class="fas fa-question"></i>',
      description: game.i18n.localize("ZWEI.othermessages.showdocs"),
    }
  ];

  CHAT_COMMANDS.forEach(command =>
    chatCommands.register({ ...command, module: 'zweihander' })
  );
};