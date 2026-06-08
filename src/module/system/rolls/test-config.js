import ZweihanderTestDialogFactory from '../../apps/dialog/test-dialog-factory';

import { normalizedEquals } from '../utils';

const { mergeObject } = foundry.utils;

export const getItemRollConfiguration = (item) => {
  const actor = item.actor;

  let associatedSkill;

  if (item.type === 'weapon') {
    associatedSkill = item.system.associatedSkill;
  } else if (item.type === 'disease') {
    const resistSkillName = game.settings.get('zweihander', 'defaultDiseaseSkill');
    associatedSkill = resistSkillName.toLowerCase();
  } else {
    associatedSkill = actor.system.stats.secondaryAttributes.magick.associatedSkill;
  }

  const skillItem = actor.items.find((item) => item.type === 'skill' && normalizedEquals(item.name, associatedSkill));

  const additionalConfiguration = {};
  additionalConfiguration[`${item.type}Id`] = item.id;

  return {
    skillItem: skillItem,
    additionalConfiguration: additionalConfiguration,
  };
};

// @todo: move this to dice.js
export async function getTestConfiguration(skillItem, testType = 'skill', testConfiguration = {}) {
  testConfiguration.flip = testConfiguration.flip ?? (skillItem.system.isFlipToFail ? 'flipfail' : 'noflip');
  const result = await ZweihanderTestDialogFactory.create(skillItem, testType, testConfiguration);
  if (result.cancelled) return;

  testConfiguration = mergeObject(testConfiguration, result);
  return testConfiguration;
}
