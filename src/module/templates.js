const $$templatesToLoad = [];
const $$ = (path) => {
  $$templatesToLoad.push('systems/zweihander/templates/' + path.split('/templates/')[1]);
};

import appActorConfig from '../templates/app/actor-config.hbs';
$$(appActorConfig);
import appCurrencySettings from '../templates/app/currency-settings.hbs';
$$(appCurrencySettings);
import appFortuneTrackerSettings from '../templates/app/fortune-tracker-settings.hbs';
$$(appFortuneTrackerSettings);
import appFortuneTracker from '../templates/app/fortune-tracker.hbs';
$$(appFortuneTracker);
import appLanguageConfig from '../templates/app/language-config.hbs';
$$(appLanguageConfig);
import appTestConfig from '../templates/app/test-config.hbs';
$$(appTestConfig);

import characterCurrency from '../templates/character/currency.hbs';
$$(characterCurrency);
import characterEncumbranceMeter from '../templates/character/encumbrance-meter.hbs';
$$(characterEncumbranceMeter);
import characterHeader from '../templates/character/header.hbs';
$$(characterHeader);
import characterMagickSkillSelector from '../templates/character/magick-skill-selector.hbs';
$$(characterMagickSkillSelector);
import characterMain from '../templates/character/main.hbs';
$$(characterMain);
import characterTabMain from '../templates/character/tab-main.hbs';
$$(characterTabMain);

import chatMessage from '../templates/chat/chat-message.hbs';
$$(chatMessage);
import chatSkill from '../templates/chat/chat-skill.hbs';
$$(chatSkill);
import chatSpell from '../templates/chat/chat-spell.hbs';
$$(chatSpell);
import chatWeapon from '../templates/chat/chat-weapon.hbs';
$$(chatWeapon);

import combatTracker from '../templates/combat/combat-tracker.hbs';
$$(combatTracker);

import creatureMain from '../templates/creature/main.hbs';
$$(creatureMain);

import itemAncestry from '../templates/item/ancestry.hbs';
$$(itemAncestry);
import itemArmor from '../templates/item/armor.hbs';
$$(itemArmor);
import itemCondition from '../templates/item/condition.hbs';
$$(itemCondition);
import itemDisease from '../templates/item/disease.hbs';
$$(itemDisease);
import itemDisorder from '../templates/item/disorder.hbs';
$$(itemDisorder);
import itemDrawback from '../templates/item/drawback.hbs';
$$(itemDrawback);
import itemInjury from '../templates/item/injury.hbs';
$$(itemInjury);
import itemMain from '../templates/item/main.hbs';
$$(itemMain);
import itemProfession from '../templates/item/profession.hbs';
$$(itemProfession);
import itemQuality from '../templates/item/quality.hbs';
$$(itemQuality);
import itemRitual from '../templates/item/ritual.hbs';
$$(itemRitual);
import itemSkill from '../templates/item/skill.hbs';
$$(itemSkill);
import itemSpell from '../templates/item/spell.hbs';
$$(itemSpell);
import itemTaint from '../templates/item/taint.hbs';
$$(itemTaint);
import itemTalent from '../templates/item/talent.hbs';
$$(itemTalent);
import itemTrait from '../templates/item/trait.hbs';
$$(itemTrait);
import itemTrapping from '../templates/item/trapping.hbs';
$$(itemTrapping);
import itemUniqueAdvance from '../templates/item/uniqueAdvance.hbs';
$$(itemUniqueAdvance);
import itemWeapon from '../templates/item/weapon.hbs';
$$(itemWeapon);

import itemCardFallback from '../templates/item-card/item-card-fallback.hbs';
$$(itemCardFallback);
import itemCardProfession from '../templates/item-card/item-card-profession.hbs';
$$(itemCardProfession);
import itemCardSpell from '../templates/item-card/item-card-spell.hbs';
$$(itemCardSpell);
import itemCardWeapon from '../templates/item-card/item-card-weapon.hbs';
$$(itemCardWeapon);

import itemSummaryArmor from '../templates/item-summary/armor.hbs';
$$(itemSummaryArmor);
import itemSummaryCondition from '../templates/item-summary/condition.hbs';
$$(itemSummaryCondition);
import itemSummaryDisease from '../templates/item-summary/disease.hbs';
$$(itemSummaryDisease);
import itemSummaryDisorder from '../templates/item-summary/disorder.hbs';
$$(itemSummaryDisorder);
import itemSummaryDrawback from '../templates/item-summary/drawback.hbs';
$$(itemSummaryDrawback);
import itemSummaryEffect from '../templates/item-summary/effect.hbs';
$$(itemSummaryEffect);
import itemSummaryInjury from '../templates/item-summary/injury.hbs';
$$(itemSummaryInjury);
import itemSummaryProfession from '../templates/item-summary/profession.hbs';
$$(itemSummaryProfession);
import itemSummaryRitual from '../templates/item-summary/ritual.hbs';
$$(itemSummaryRitual);
import itemSummarySpell from '../templates/item-summary/spell.hbs';
$$(itemSummarySpell);
import itemSummaryTaint from '../templates/item-summary/taint.hbs';
$$(itemSummaryTaint);
import itemSummaryTalent from '../templates/item-summary/talent.hbs';
$$(itemSummaryTalent);
import itemSummaryTrait from '../templates/item-summary/trait.hbs';
$$(itemSummaryTrait);
import itemSummaryTrapping from '../templates/item-summary/trapping.hbs';
$$(itemSummaryTrapping);
import itemSummaryUniqueAdvance from '../templates/item-summary/uniqueAdvance.hbs';
$$(itemSummaryUniqueAdvance);
import itemSummaryWeapon from '../templates/item-summary/weapon.hbs';
$$(itemSummaryWeapon);

import partialsDetailItemWrapper from '../templates/partials/detail-item-wrapper.hbs';
$$(partialsDetailItemWrapper);
import partialsDetailLanguages from '../templates/partials/detail-languages.hbs';
$$(partialsDetailLanguages);
import partialsDetailRiskFactor from '../templates/partials/detail-risk-factor.hbs';
$$(partialsDetailRiskFactor);
import partialsDetailsList from '../templates/partials/details-list.hbs';
$$(partialsDetailsList);
import partialsFocusesList from '../templates/partials/focuses-list.hbs';
$$(partialsFocusesList);
import partialsItemsList from '../templates/partials/items-list.hbs';
$$(partialsItemsList);
import partialsModdedValue from '../templates/partials/modded-value.hbs';
$$(partialsModdedValue);
import partialsSkillsList from '../templates/partials/skills-list.hbs';
$$(partialsSkillsList);

export const preloadHandlebarsTemplates = async function () {
  return loadTemplates($$templatesToLoad);
};

if (import.meta.hot) {
  import.meta.hot.on('handlebars-update', ({ file, content }) => {
    const compiled = Handlebars.compile(content);
    Handlebars.registerPartial(file, compiled);
    _templateCache[file] = compiled;
    for (let t of Object.values(ui.sidebar.tabs)) {
      t.render();
    }
    for (let w of Object.values(ui.windows)) {
      w.render();
    }
  });
}
