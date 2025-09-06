const $$ = (path) => `systems/zweihander/src/templates/${path}`;

const templatesToLoad = [
  $$('app/actor-config.hbs'),
  $$('app/currency-settings.hbs'),
  $$('app/fortune-tracker-settings.hbs'),
  $$('app/fortune-tracker.hbs'),
  $$('app/language-config/header.hbs'),
  $$('app/language-config/list.hbs'),
  $$('app/test-config.hbs'),

  $$('character/currency.hbs'),
  $$('character/encumbrance-meter.hbs'),
  $$('character/header.hbs'),
  $$('character/tabs-navigation.hbs'),
  $$('character/magick-skill-selector.hbs'),
  $$('character/tabs/attributes.hbs'),
  $$('character/tabs/background.hbs'),
  $$('character/tabs/generic-item-list.hbs'),

  $$('chat/chat-message.hbs'),
  $$('chat/chat-skill.hbs'),
  $$('chat/chat-spell.hbs'),
  $$('chat/chat-weapon.hbs'),

  $$('combat/combat-tracker.hbs'),

  $$('creature/main.hbs'),
  $$('vehicle/main.hbs'),
  $$('vehicle/vehicle-encumbrance-meter.hbs'),

  $$('item/common/header.hbs'),
  $$('item/ancestry.hbs'),
  $$('item/armor.hbs'),
  $$('item/condition.hbs'),
  $$('item/disease.hbs'),
  $$('item/disorder.hbs'),
  $$('item/drawback.hbs'),
  $$('item/injury.hbs'),
  $$('item/profession.hbs'),
  $$('item/quality.hbs'),
  $$('item/ritual.hbs'),
  $$('item/skill.hbs'),
  $$('item/spell.hbs'),
  $$('item/taint.hbs'),
  $$('item/talent.hbs'),
  $$('item/trait.hbs'),
  $$('item/trapping.hbs'),
  $$('item/uniqueAdvance.hbs'),
  $$('item/weapon.hbs'),

  $$('item-card/item-card-fallback.hbs'),
  $$('item-card/item-card-profession.hbs'),
  $$('item-card/item-card-spell.hbs'),
  $$('item-card/item-card-weapon.hbs'),

  $$('item-summary/armor.hbs'),
  $$('item-summary/condition.hbs'),
  $$('item-summary/disease.hbs'),
  $$('item-summary/disorder.hbs'),
  $$('item-summary/drawback.hbs'),
  $$('item-summary/effect.hbs'),
  $$('item-summary/injury.hbs'),
  $$('item-summary/profession.hbs'),
  $$('item-summary/ritual.hbs'),
  $$('item-summary/spell.hbs'),
  $$('item-summary/taint.hbs'),
  $$('item-summary/talent.hbs'),
  $$('item-summary/trait.hbs'),
  $$('item-summary/trapping.hbs'),
  $$('item-summary/quality.hbs'),
  $$('item-summary/vehicleOccupant.hbs'),
  $$('item-summary/uniqueAdvance.hbs'),
  $$('item-summary/weapon.hbs'),

  $$('partials/detail-item-wrapper.hbs'),
  $$('partials/detail-languages.hbs'),
  $$('partials/detail-risk-factor.hbs'),
  $$('partials/details-list.hbs'),
  $$('partials/details-list-npc.hbs'),
  $$('partials/focuses-list.hbs'),
  $$('partials/items-list.hbs'),
  $$('partials/item-effects-list.hbs'),
  $$('partials/actors-list.hbs'),
  $$('partials/modded-value-pa.hbs'),
  $$('partials/modded-value-bonuses.hbs'),
  $$('partials/modded-value.hbs'),
  $$('partials/skills-list.hbs'),
  $$('partials/item-price-weight.hbs'),
];

export const preloadHandlebarsTemplates = async function () {
  return loadTemplates(templatesToLoad);
};

if (import.meta.hot) {
  import.meta.hot.on('handlebars-update', ({ file, content }) => {
    console.log(`received ${file}!`);
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
