/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @returns {Promise}
 */

export const preloadHandlebarsTemplates = async function () {
  const $$ = (path) => 'systems/zweihander/templates/' + path + '.hbs'
  return loadTemplates([
    $$('pc/tab-afflictions'),
    $$('pc/tab-background'),
    $$('pc/tab-magick'),
    $$('pc/tab-main'),
    $$('pc/tab-tiers'),
    $$('pc/tab-trappings'),
    $$('pc/header'),
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
    $$('item/trait'),
    $$('item/trapping'),
    $$('item/quality'),
    $$('item/uniqueAdvance'),
    $$('item/weapon'),
    $$('item-card/item-card-spell')
  ]);
};
