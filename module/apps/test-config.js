import { ZWEI } from '../config';
import { getDifficultyRatingLabel, selectedChoice } from '../utils';

export async function getTestConfiguration(skillItem, testType = 'skill', testConfiguration = {}) {
  testConfiguration.flip = testConfiguration.flip ?? (skillItem.data.data.isFlipToFail ? 'fail' : 'no-flip');
  const configurationFromDialog = await renderConfigurationDialog(testType, skillItem.name, testConfiguration);
  testConfiguration = mergeObject(testConfiguration, configurationFromDialog);
  return testConfiguration;
}

async function renderConfigurationDialog(testType, label, testConfiguration = {}) {
  const templateData = {
    weaponRoll: testType === 'weapon',
    spellRoll: testType === 'spell',
    additionalFuryDice: testConfiguration.additionalFuryDice,
    additionalChaosDice: testConfiguration.additionalChaosDice
  };
  const toPercentileLabel = (i) => i === 0 ? '+-0%' : (i > 0 ? `+${i}%` : `${i}%`);
  templateData.fortuneOptions = [
    { value: 'none', label: "Don't Use" },
    { value: 'fortune', label: "Use Fortune" },
    { value: 'misfortune', label: "Use Misfortune" }
  ].map(option => ({ selected: (testConfiguration.useFortune ?? 'none') === option.value ? 'selected' : '', ...option }));;
  templateData.baseChanceModifiers = [...Array(41).keys()].map(i => {
    const value = i * 5 - 100;
    const selected = (testConfiguration.baseChanceModifier ?? 0) === value ? 'selected' : ''
    return { value, label: toPercentileLabel(value), selected }
  });
  templateData.difficultyRatings = [...Array(7).keys()].map(i => {
    const value = i * 10 - 30;
    const selected = (testConfiguration.difficultyRating ?? 0) === value ? 'selected' : ''
    return { value, label: getDifficultyRatingLabel(value), selected }
  });
  templateData.flipOptions = [
    { value: 'fail', label: "Flip to Fail" },
    { value: 'no-flip', label: "Don't Flip" },
    { value: 'succeed', label: "Flip to Succeed" }
  ].map(option => ({ selected: (testConfiguration.flip ?? 'no-flip') === option.value ? 'selected' : '', ...option }));
  templateData.skillModes = selectedChoice(
    testConfiguration.testMode ?? 'standard',
    Object.entries(ZWEI.testModes).map(([value, { label, help }]) => ({ value, label: `${label} ${help ? `(${help})` : ''}` }))
  );
  templateData.channelPowerBonuses = [
    { value: 0, label: "Don't Channel" },
    { value: 10, label: "One Step (1d6 Chaos Dice)" },
    { value: 20, label: "Two Steps (2d6 Chaos Dice)" },
    { value: 30, label: "Three Steps (3d6 Chaos Dice)" },
  ].map(option => ({ selected: (testConfiguration.channelPowerBonus ?? '0') === option.value ? 'selected' : '', ...option }));
  return createConfigurationDialog(label, '/systems/zweihander/templates/app/test-config.hbs', templateData, (resolve) => (html) => {
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
      testMode
    });
  });
}

function createConfigurationDialog(label, template, templateData, callback) {
  return new Promise((resolve) => {
    renderTemplate(template, templateData).then(content => {
      const dialog = new Dialog({
        title: `${label}: Test Configuration`,
        content,
        buttons: {
          no: {
            icon: '',
            label: 'Cancel'
          },
          yes: {
            icon: '',
            label: 'Roll',
            callback: callback(resolve)
          }
        }
      });
      dialog.render(true);
    })
  });
}
