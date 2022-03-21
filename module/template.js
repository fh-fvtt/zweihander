/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @returns {Promise}
 */

export const preloadHandlebarsTemplates = async function () {
  const $$ = (path) => 'systems/zweihander/templates/' + path + '.hbs'
  return loadTemplates([
    $$('pc/tab-main'),
    $$('pc/header'),
    $$('npc/tab-main'),
    $$('npc/header'),
    $$('item/ancestry'),
    $$('item/armor'),
    $$('item/condition'),
    $$('item/disease'),
    $$('item/disorder'),
    $$('item/drawback'),
    $$('item/injury'),
    $$('item/profession'),
    $$('item/ritual'),
    $$('item/skill'),
    $$('item/spell'),
    $$('item/talent'),
    $$('item/taint'),
    $$('item/trait'),
    $$('item/trapping'),
    $$('item/quality'),
    $$('item/uniqueAdvance'),
    $$('item/weapon'),
    $$('item-card/item-card-spell'),
    $$('item-card/item-card-weapon'),
    $$('item-card/item-card-profession'),
    $$('item-summary/trapping'),
    $$('item-summary/weapon'),
    $$('item-summary/armor'),
    $$('item-summary/spell'),
    $$('item-summary/ritual'),
    $$('item-summary/condition'),
    $$('item-summary/disorder'),
    $$('item-summary/disease'),
    $$('item-summary/injury'),
    $$('item-summary/taint'),
    $$('item-summary/profession'),
    $$('item-summary/trait'),
    $$('item-summary/talent'),
    $$('item-summary/drawback'),
    $$('item-summary/uniqueAdvance'),
    $$('partials/items-list'),
    $$('partials/skills-list'),
    $$('pc/coinage'),
    $$('pc/encumbrance-meter'),
    $$('pc/magick-skill-selector'),
    $$('partials/modded-value')
  ]);
};
