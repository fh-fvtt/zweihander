import { ZWEI } from '../config';
import { getDifficultyRatingLabel, selectedChoice, normalizedEquals } from '../utils';

export const getItemRollConfiguration = (item) => {
  const actor = item.actor;

  const associatedSkill =
    item.type === 'weapon'
      ? item.system.associatedSkill
      : actor.system.stats.secondaryAttributes.magick.associatedSkill;
  const skillItem = actor.items.find((item) => item.type === 'skill' && normalizedEquals(item.name, associatedSkill));

  const additionalConfiguration = {};
  additionalConfiguration[`${item.type}Id`] = item.id;

  return {
    skillItem: skillItem,
    additionalConfiguration: additionalConfiguration,
  };
};

export async function getTestConfiguration(skillItem, testType = 'skill', testConfiguration = {}) {
  testConfiguration.flip = testConfiguration.flip ?? (skillItem.system.isFlipToFail ? 'flipfail' : 'noflip');
  const configurationFromDialog = await renderConfigurationDialog(testType, skillItem.name, testConfiguration);
  testConfiguration = mergeObject(testConfiguration, configurationFromDialog);
  return testConfiguration;
}

async function renderConfigurationDialog(testType, label, testConfiguration = {}) {
  const templateData = {
    weaponRoll: testType === 'weapon',
    spellRoll: testType === 'spell',
    additionalFuryDice: testConfiguration.additionalFuryDice,
    additionalChaosDice: testConfiguration.additionalChaosDice,
  };
  const toPercentileLabel = (i) => (i === 0 ? '+-0%' : i > 0 ? `+${i}%` : `${i}%`);
  templateData.fortuneOptions = [
    { value: 'dontuse', label: game.i18n.localize('ZWEI.rolls.dontuse') },
    { value: 'fortune', label: game.i18n.localize('ZWEI.rolls.fortune') },
    { value: 'misfortune', label: game.i18n.localize('ZWEI.rolls.misfortune') },
  ].map((option) => ({
    selected: (testConfiguration.useFortune ?? 'dontuse') === option.value ? 'selected' : '',
    ...option,
  }));
  templateData.baseChanceModifiers = [...Array(41).keys()].map((i) => {
    const value = i * 5 - 100;
    const selected = (testConfiguration.baseChanceModifier ?? 0) === value ? 'selected' : '';
    return { value, label: toPercentileLabel(value), selected };
  });
  templateData.difficultyRatings = [...Array(7).keys()].map((i) => {
    const value = i * 10 - 30;
    const selected = (testConfiguration.difficultyRating ?? 0) === value ? 'selected' : '';
    return { value, label: getDifficultyRatingLabel(value), selected };
  });
  templateData.flipOptions = [
    { value: 'noflip', label: game.i18n.localize('ZWEI.rolls.noflip') },
    { value: 'flipfail', label: game.i18n.localize('ZWEI.rolls.flipfail') },
    { value: 'flipsucceed', label: game.i18n.localize('ZWEI.rolls.flipsucceed') },
  ].map((option) => ({
    selected: (testConfiguration.flip ?? 'noflip') === option.value ? 'selected' : '',
    ...option,
  }));
  templateData.skillModes = selectedChoice(
    testConfiguration.testMode ?? 'standard',
    Object.entries(ZWEI.testModes).map(([value, { label, help }]) => ({
      value,
      label: `${label} ${help ? `(${help})` : ''}`,
    }))
  );
  templateData.channelPowerBonuses = [
    { value: 0, label: 'channel0' },
    { value: 10, label: 'channel1' },
    { value: 20, label: 'channel2' },
    { value: 30, label: 'channel3' },
  ].map((option) => ({
    selected: (testConfiguration.channelPowerBonus ?? '0') === option.value ? 'selected' : '',
    ...option,
  }));
  return createConfigurationDialog(
    label,
    'systems/zweihander/src/templates/app/test-config.hbs',
    templateData,
    (resolve) => (html) => {
      let additionalFuryDice = Number(html.find('[name="extraFury"]').val()) || 0;
      let additionalChaosDice = Number(html.find('[name="extraChaos"]').val()) || 0;
      let difficultyRating = Number(html.find('[name="difficultyRatingSelect"]').val());
      let channelPowerBonus = Number(html.find('[name="channelSelect"]').val());
      let flip = html.find('[name="flipSelect"]').val();
      let baseChanceModifier = Number(html.find('[name="baseChanceModifier"]').val());
      let testMode = html.find('[name="skillMode"]').val();
      let useFortune = html.find('[name="useFortune"]').val();
      resolve({
        useFortune,
        additionalFuryDice,
        additionalChaosDice,
        difficultyRating,
        channelPowerBonus,
        flip,
        baseChanceModifier,
        testMode,
      });
    }
  );
}

function createConfigurationDialog(label, template, templateData, callback) {
  return new Promise((resolve) => {
    renderTemplate(template, templateData).then((content) => {
      const dialog = new Dialog({
        title: `${label}: ` + game.i18n.localize('ZWEI.rolls.testconfig'),
        content,
        buttons: {
          no: {
            icon: '',
            label: game.i18n.localize('ZWEI.rolls.cancel'),
          },
          yes: {
            icon: '',
            label: game.i18n.localize('ZWEI.rolls.roll'),
            callback: callback(resolve),
          },
        },
      });
      dialog.render(true);
    });
  });
}
