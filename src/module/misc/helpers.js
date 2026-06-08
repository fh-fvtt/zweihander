import { ZWEI } from '../system/config';
import { uuidv4, zhExplicitSign, localize, localizePath, primaryAttributeMapping } from '../system/utils';

/**
 * Define a set of handlebar helpers
 * @returns {Promise}
 */
export const registerHandlebarHelpers = async function () {
  const $$ = (name, fn) => Handlebars.registerHelper(name, fn);

  $$('$$', function (path) {
    return 'systems/zweihander/src/templates/' + path + '.hbs';
  });

  $$('zhGetFirstLetter', function (word) {
    if (typeof word !== 'string') return '';
    return word.charAt(0).toUpperCase();
  });

  $$('zhCapitalize', function (word) {
    if (typeof word !== 'string') return '';
    return word.capitalize();
  });

  $$('zhCapitalizeStrict', function (word) {
    if (typeof word !== 'string') return '';
    return word.slice(0, 1).toUpperCase() + word.slice(1).toLowerCase();
  });

  $$('zhLowerCase', function (word) {
    if (typeof word !== 'string') return '';
    return word.toLowerCase();
  });

  $$('zhLowerCaseSpaces', function (word) {
    if (typeof word !== 'string') return '';
    return word.toLowerCase().replace(/\s+/g, '');
  });

  $$('zhLowerCaseBrackets', function (word) {
    if (typeof word !== 'string') return '';
    return word.toLowerCase().replace(/\[|\]/g, '');
  });

  $$('zhUpperCase', function (word) {
    if (typeof word !== 'string') return '';
    return word.toUpperCase();
  });

  $$('zhAlignmentRanks', function (name, alignmentRanks, permanentRanks, options) {
    const alignment = name.split('.')[2];
    const icon = alignment === 'chaos' ? 'ra-cancel' : 'ra-slash-ring';
    const checked = options.hash['checked'] || 0;
    const isChecked = (i) => Number(checked) === i;
    const isPermanentRank = (i) => i <= permanentRanks;
    let uuid = uuidv4();
    let html = `<input 
                  type="radio"
                  name="${name}"
                  id="${uuid}.${name + 0}"
                  value="${0}"
                  ${isChecked(0) ? 'checked' : ''}>`;
    for (let i = 1; i <= alignmentRanks; i++) {
      html += `
        <input 
          type="radio"
          name="${name}"
          id="${uuid}.${name + i}"
          value="${i}"
          ${isChecked(i) ? 'checked' : ''}
          ${isPermanentRank(i) ? 'disabled' : ''}>
        <label
          for="${uuid}.${name + i}"
          class="${isPermanentRank(i) ? `permanent-rank ${alignment}` : 'regular-rank'}">
          ${isPermanentRank(i) ? `<span class='ra ${icon}'></span>` : i}
        </label>
      `;
    }
    return new Handlebars.SafeString(html);
  });

  $$('zhConditionLadder', function (name, choices, options) {
    const checked = options.hash['checked'] ?? 5;
    let html = '';
    let uuid = uuidv4();
    for (let i = choices.length - 1; i >= 0; i--) {
      const isChecked = checked == i;
      html += `
        <div class="radio-and-status flexrow">
          <input type="radio" class="radio-rank"
            id="${uuid}.${i}" name="${name}"
            value="${i}" ${isChecked ? 'checked' : ''}>
          <label for="${uuid}.${i}" class="status">
            <span><span>${choices[i]}</span></span>
          </label>
        </div>`;
    }
    return new Handlebars.SafeString(html);
  });

  $$('zhEffectToHTML', function (effect) {
    let html = '';

    effect.changes.forEach((e) => {
      html +=
        `<label>` +
        _loc('ZWEI.othermessages.modifiedattribute') +
        `:</label> ${e.key}<br /><label>` +
        _loc('ZWEI.othermessages.mode') +
        `:</label> ${e.mode}<br /><label>` +
        _loc('ZWEI.othermessages.value') +
        `:</label> ${e.value}<br />`;
    });

    return new Handlebars.SafeString(html);
  });

  $$('zhItemImageClass', function (img) {
    return img?.endsWith('.svg') ? 'item-image item-image-icon' : 'item-image item-image-picture';
  });

  $$('zhItemImageStyle', function (img) {
    return img?.endsWith('.svg') ? `-webkit-mask-image: url('${img}')` : `background-image: url('${img}')`;
  });

  $$('zhStringifyObject', function (obj) {
    return btoa(JSON.stringify(obj));
  });

  $$('zhSkillBonus', function (bonus) {
    return bonus ? `+${bonus}` : '';
  });

  $$('zhSkillRankAbbreviation', function (rank) {
    return ['-', 'Appr.', 'Jour.', 'Mstr.'][rank];
  });

  $$('zhSpeakerPic', function (message) {
    const actor = ChatMessage.getSpeakerActor(message.speaker);
    if (message.flags?.zweihander?.img) return message.flags.zweihander.img;
    if (actor && actor.img) return actor.img;
    const author = game.users.get(message.author);
    if (author && author.avatar) return author.avatar;
    return '';
  });

  $$('zhSkillTestTooltip', function (data) {
    let tooltip = `
        <table>
          <tr>
            <td class="descriptor">${data.primaryAttribute}:</td>
            <td class="value">${zhExplicitSign(data.basePercentage)}%</td>
          </tr>
          <tr>
            <td class="descriptor">${_loc('ZWEI.chatskill.skillrank')}:</td>
            <td class="value">${zhExplicitSign(data.rankBonus)}%</td>
          </tr>
          <tr>
            <td class="descriptor">${_loc('ZWEI.chatskill.penaltyperil')}:</td>
            <td class="value">${zhExplicitSign(data.perilPenalty)}%</td>
          </tr>
          <tr>
            <td class="descriptor">${_loc('ZWEI.chatskill.specialmod')}:</td>
            <td class="value">${zhExplicitSign(data.specialBaseChanceModifier)}%</td>
          </tr>
          <tr>
            <td class="descriptor">${_loc('ZWEI.chatskill.cappedchance')}:</td>
            <td class="value">${data.baseChance}%</td>
          </tr>
          ${
            data.spellTest
              ? `<tr>
              <td class="descriptor">${_loc('ZWEI.chatskill.rawdifficulty')}:</td>
              <td class="value">${zhExplicitSign(data.difficultyRating.raw)}%</td>
            </tr>
            <tr>
              <td class="descriptor">${_loc('ZWEI.chatskill.channelpower')}:</td>
              <td class="value">${zhExplicitSign(data.difficultyRating.channelPowerBonus)}%</td>
            </tr>`
              : `<tr>
              <td class="descriptor">${_loc('ZWEI.chatskill.difficulty')}:</td>
              <td class="value">${zhExplicitSign(data.difficultyRating.total)}%</td>
            </tr>
            <tr>
              <td class="descriptor">${_loc('ZWEI.chatskill.resultflipped')}:</td>
              <td class="value">${
                data.effectivelyFlipped ? _loc('ZWEI.chatskill.yes') : _loc('ZWEI.chatskill.no')
              } </td>
            </tr>`
          }
      `;

    if (data.weaponTest)
      tooltip += `
          <tr>
            <td class="descriptor separator">${_loc('ZWEI.actor.items.type')}:</td>
            <td class="value separator">${data.weapon.system.weaponType}</td>
          </tr>
          <tr>
            <td class="descriptor">${_loc('ZWEI.actor.items.handling')}:</td>
            <td class="value">${data.weapon.system.handling}</td>
          </tr>
          <tr>
            <td class="descriptor">${_loc('ZWEI.actor.items.distance')}:</td>
            <td class="value">${data.weapon.system.distance.value}</td>
          </tr>
          <tr>
            <td class="descriptor">${_loc('ZWEI.actor.items.load')}:</td>
            <td class="value">${data.weapon.system.ranged.load}</td>
          </tr>`;

    if (data.spellTest) {
      console.log('THIS', this);
      tooltip += `
          <tr>
            <td class="descriptor separator">${_loc('ZWEI.actor.items.tradition')}:</td>
            <td class="value separator">${data.spell.system.tradition}</td>
          </tr>
          <tr>
            <td class="descriptor">${_loc('ZWEI.actor.items.principle')}:</td>
            <td class="value">${data.spell.system.principle}</td>
          </tr>
          <tr>
            <td class="descriptor">${_loc('ZWEI.actor.items.reagents')}:</td>
            <td class="value">${localize(data.spell.system.rules.reagents)}</td>
          </tr>
          <tr>
            <td class="descriptor">${_loc('ZWEI.actor.items.duration')}:</td>
            <td class="value">${data.spell.system.duration.label}</td>
          </tr>
          <tr>
            <td class="descriptor">${_loc('ZWEI.actor.items.distance')}:</td>
            <td class="value">${data.spell.system.distance}</td>
          </tr>`;
    }

    tooltip += `</table>`;

    return tooltip;
  });

  $$('zhModifierTooltip', function (data, baseValue, value) {
    if (!data) return;

    let tooltip = `<table><tr><td class="descriptor title">Base:</td><td class="value">${baseValue}</td></tr>`;

    for (const mod of data) {
      tooltip += `<tr>
      <td class="descriptor">+${mod.source}</td>
      <td class="value">${mod.type}${mod.argument}</td>
      </tr>`;
    }

    tooltip += `<tr><td class="descriptor title">Total:</td><td class="value">${value}</td></tr></table>`;

    return tooltip;
  });

  $$('zhFocusesTooltip', function (focuses) {
    if (!focuses) return;

    let tooltip = `<table>`;

    for (const focus of focuses) {
      tooltip += `<tr>
      <td>${focus}</td>
      </tr>`;
    }

    tooltip += `</table>`;

    return tooltip;
  });

  $$('zhExplicitSign', zhExplicitSign);

  $$('zhLookup', function (obj, key) {
    if (!key) return;
    const keys = key.toString().split('.');
    let val = obj;
    for (let key of keys) {
      val = val?.[key];
    }
    return val;
  });

  $$('zhDisplayLanguages', (languages) => {
    if (!languages.length) return '';
    const displayLanguage = (l) =>
      `${l.name}` + (l.isLiterate ? ` ${_loc('ZWEI.settings.lasettings.literatesymbol')} ` : '');
    return languages.slice(1).reduce((str, l) => `${str}, ${displayLanguage(l)}`, displayLanguage(languages[0]));
  });

  $$('zhAdd', (...x) =>
    x.slice(0, -1).reduce((a, b) => {
      return new Number(a) + new Number(b);
    }, 0)
  );

  $$('zhPrice', (price) => {
    const currencies = game.settings.get('zweihander', 'currencySettings');
    return new Handlebars.SafeString(
      currencies
        .map(
          (c) =>
            `<i class="fas fa-coins currency" style="color: ${c.color}"></i> ${price[c.abbreviation] ?? 0} ${
              c.abbreviation
            }`
        )
        .join(' ')
    );
  });

  $$('zhCalculateAncestralModifierAmount', (ancestralModifiersData, ancestralModifier) => {
    const positiveModifiers = ancestralModifiersData.positive;
    const negativeModifiers = ancestralModifiersData.negative;

    const modifier = '[' + ancestralModifier + ']';

    const positiveCount = positiveModifiers.reduce((acc, val) => (val === modifier ? acc + 1 : acc), 0);
    const negativeCount = negativeModifiers.reduce((acc, val) => (val === modifier ? acc - 1 : acc), 0);

    return positiveCount ? positiveCount : negativeCount;
  });

  $$('zhCalculateBonusAdvanceAmount', (bonusAdvancesData, bonusAdvance) => {
    const advance = '[' + bonusAdvance + ']';

    return bonusAdvancesData.reduce((acc, val) => (val.name === advance ? acc + 1 : acc), 0);
  });

  $$('zhRitualCastingInputs', (ritualData, castingTimeOptions) => {
    const triggerSelected = ritualData.castingTime.setting === 'formula';

    let inputs = `<div class="form-group"><label class="formula-label">${_loc('ZWEI.actor.items.castingtime')}</label>${
      triggerSelected ? `<div class="damage-inputs flexrow"><div class="form-group label-top wide"><label></label>` : ''
    }
            <select name="system.castingTime.setting">${HandlebarsHelpers.selectOptions(castingTimeOptions, {
              hash: {
                valueAttr: 'value',
                labelAttr: 'label',
              },
            })}</select>
          ${
            triggerSelected
              ? `</div><div class="form-group label-top"><label>NUMBER</label><input type="number" name="system.castingTime.number" value="${ritualData.castingTime.number}" /></div><div class="form-group label-top"><label>UNITS</label><input type="text" name="system.castingTime.unit" value="${ritualData.castingTime.unit}" /></div></div>`
              : ''
          }
      </div>
    `;

    return new Handlebars.SafeString(inputs);
  });

  $$('zhRitualDifficultyInputs', (ritualData, ritualDifficultiesSpecific, ritualDifficultiesGeneric, skillList) => {
    const triggerSelected = ritualDifficultiesSpecific.some((d) => d.value === Number(ritualData.difficulty.rating));

    const triggerRoll = false; // @todo: implement

    let inputs = `<div class="form-group"><label class="formula-label">${_loc('ZWEI.actor.items.difficulty')}</label>${
      triggerSelected ? `<div class="damage-inputs flexrow"><div class="form-group label-top"><label></label>` : ''
    }
            <select name="system.difficulty.rating"><optgroup label="${_loc(
              'ZWEI.actor.items.genericratings'
            )}">${HandlebarsHelpers.selectOptions(ritualDifficultiesGeneric, {
      hash: {
        valueAttr: 'value',
        labelAttr: 'label',
      },
    })}</optgroup><optgroup label="${_loc('ZWEI.actor.items.specificratings')}">${HandlebarsHelpers.selectOptions(
      ritualDifficultiesSpecific,
      {
        hash: {
          valueAttr: 'value',
          labelAttr: 'label',
        },
      }
    )}</optgroup></select>
          ${
            triggerSelected
              ? `</div><div class="form-group label-top"><label>${_loc(
                  'ZWEI.actor.items.skilltest'
                )}</label><select name="system.difficulty.associatedSkill">${HandlebarsHelpers.selectOptions(
                  skillList,
                  { hash: { valueAttr: 'value', labelAttr: 'label' } }
                )}</select></div></div>`
              : ''
          }
      </div>
    `;

    return new Handlebars.SafeString(inputs);
  });

  $$('zhPriceInputs', (price) => {
    const currencies = game.settings.get('zweihander', 'currencySettings');
    const inputs = currencies
      .map(
        (c) => `
      <i class="fas fa-coins currency" style="color: ${c.color}"></i>
      <input name="system.price.${c.abbreviation}" type="number" value="${price[c.abbreviation] ?? 0}">
    `
      )
      .join('');
    return new Handlebars.SafeString(
      `<div class="form-group"><label>` + _loc('ZWEI.actor.items.price') + `</label>${inputs}</div>`
    );
  });

  $$('zhProfessionWarn', (item, options) => {
    if (item.type !== 'profession') return options.fn(this);

    let hasDuplicate = false;

    for (let talent of item.system.talents) {
      if (talent.linkedId !== null) continue;
      hasDuplicate = true;
    }

    if (item.system.talents.length !== 3 || hasDuplicate) return options.inverse(this);
    else return options.fn(this);
  });

  $$('zhLocalize', localize);

  $$('zhLocalizePath', localizePath);

  $$('zhGetPerilSystem', function () {
    return game.settings.get('zweihander', 'alternativePerilSystem') ? ZWEI.altPerilOptions : ZWEI.perilOptions;
  });

  $$('zhConditionLadderLoc', function (name, choices, options) {
    const checked = options.hash['checked'] ?? 5;
    let html = '';
    let uuid = uuidv4();
    for (let i = choices.length - 1; i >= 0; i--) {
      const isChecked = checked == i;
      html +=
        `
        <div class="radio-and-status flexrow">
          <input type="radio" class="radio-rank"
            id="${uuid}.${i}" name="${name}"
            value="${i}" data-dtype="Number" ${isChecked ? 'checked' : ''}>
          <label for="${uuid}.${i}" class="status">
            <span><span>` +
        _loc('ZWEI.actor.conditions.' + choices[i]) +
        `</span></span>
          </label>
        </div>`;
    }
    return new Handlebars.SafeString(html);
  });

  $$('zhConcat', (...strs) => strs.filter((s) => typeof s !== 'object').join(''));

  $$('zhSkillRankAbbreviationLoc', function (rank) {
    return [
      '-',
      _loc('ZWEI.actor.items.skillranksabbr.apprentice'),
      _loc('ZWEI.actor.items.skillranksabbr.journeyman'),
      _loc('ZWEI.actor.items.skillranksabbr.master'),
    ][rank];
  });

  $$('zhGetOperator', function (type) {
    return ZWEI.typeOperator[type] ?? '?';
  });

  $$('zhModifiersLookup', function (modifiersLookup, key, options) {
    const keyModifiers = modifiersLookup[key];
    if (!keyModifiers) return;

    const finalKeyModifiers = keyModifiers.map((mod) => ({
      source: mod.name,
      type: ZWEI.typeOperator[mod.type] ?? mod.type,
      argument: mod.value,
    }));

    const dtm = options.hash.dtm ?? 0;
    if (dtm) finalKeyModifiers.push({ source: 'DTM', type: '+', argument: dtm });

    return finalKeyModifiers;
  });

  $$('zhModIndicator', function (mod) {
    return mod === 'dtm' ? 'dtm' : '';
  });

  $$('zhIsValueModified', function (value, baseValue) {
    return value != baseValue;
  });

  $$('zhIsDtmModified', function (value, baseValue, dtm) {
    return value - (dtm || 0) != baseValue;
  });

  $$('zhIsDthModifierPositive', function (value, baseValue, dtm) {
    return baseValue - (value - dtm) < 0;
  });

  $$('zhIsModifierPositive', function (value, baseValue) {
    return baseValue - value < 0;
  });

  $$('zhModifiedEncumbrance', function (encumbrance) {
    const modifier = encumbrance.value - encumbrance.baseValue;

    if (modifier === 0) return '';

    const mode = modifier < 0 ? '-' : '+';

    return new Handlebars.SafeString(
      `<span class="modifier-display">(${encumbrance.baseValue} ${mode} ${Math.abs(modifier)})</span>`
    );
  });

  $$('zhFetchByUuidSync', function (uuid) {
    let item;

    // @todo: remove this try / catch in the future, along with broken FoF items
    try {
      item = fromUuidSync(uuid);
    } catch (e) {
      console.warn('Incorrect UUID value: ', uuid);
      return '';
    }
    return item ? item.name : '';
  });

  $$('zhIsCarried', function (system, options) {
    console.log(system);
    const isCarriedItem = typeof system?.carried !== 'undefined';

    if (isCarriedItem) return system?.carried ? options.inverse(this) : options.fn(this);
    else return options.inverse(this);
  });

  $$('zhIsValueZero', function (hideOnZero, options) {
    return !!hideOnZero ? options.fn(this) : options.inverse(this);
  });

  $$('zhTalentList', function (talents, index) {
    let talentListHtml = [];

    for (let i = 0; i < talents.length; i++) {
      const talentData = talents[i];

      if (talentData.name === '') continue;

      talentListHtml.push(
        `<a data-purchase-type="talents" data-purchase-index="${i}" data-item-id="${
          talentData.linkedId
        }" class="purchase-link fetch-item ${
          talentData.linkedId ? (talentData.purchased ? 'purchased' : 'not-purchased') : 'duplicate'
        }">${talentData.name ?? ''}</a>`
      );
    }

    return new Handlebars.SafeString(talentListHtml.join('<span> , </span>'));
  });

  $$('zhDamageFormula', function (damage) {
    return damage.formula.override
      ? damage.formula.value
      : `${damage.attributeBonus} + ${damage.number}${damage.die}${
          damage.fury.value ? 'x' + damage.fury.explodesOn.join('&') : ''
        }${damage.bonus ? ' + ' + damage.bonus : ''}`;
  });
};
