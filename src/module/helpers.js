import { ZWEI } from './config';
import { uuidv4, zhExplicitSign, localize, localizePath } from './utils';

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
    const icon = alignment === 'chaos' ? 'ra-cancel' : 'ra-horseshoe';
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
        <div class="radio-and-status">
          <input type="radio" class="radio-rank"
            id="${uuid}.${i}" name="${name}"
            value="${i}" data-dtype="Number" ${isChecked ? 'checked' : ''}>
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
        game.i18n.localize('ZWEI.othermessages.modifiedattribute') +
        `:</label> ${e.key}<br /><label>` +
        game.i18n.localize('ZWEI.othermessages.mode') +
        `:</label> ${e.mode}<br /><label>` +
        game.i18n.localize('ZWEI.othermessages.value') +
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
    const author = game.users.get(message.user);
    if (author && author.avatar) return author.avatar;
    return '';
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
    const displayLanguage = (l) => `${l.name}` + (l.isLiterate ? ` ${game.i18n.localize('ZWEI.settings.lasettings.literatesymbol')} ` : '');
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

    let inputs = `<div class="form-group"><label class="formula-label">${game.i18n.localize(
      'ZWEI.actor.items.castingtime'
    )}</label>${
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

    let inputs = `<div class="form-group"><label class="formula-label">${game.i18n.localize(
      'ZWEI.actor.items.difficulty'
    )}</label>${
      triggerSelected ? `<div class="damage-inputs flexrow"><div class="form-group label-top"><label></label>` : ''
    }
            <select name="system.difficulty.rating"><optgroup label="${game.i18n.localize('ZWEI.actor.items.genericratings')}">${HandlebarsHelpers.selectOptions(
              ritualDifficultiesGeneric,
              {
                hash: {
                  valueAttr: 'value',
                  labelAttr: 'label',
                },
              }
            )}</optgroup><optgroup label="${game.i18n.localize('ZWEI.actor.items.specificratings')}">${HandlebarsHelpers.selectOptions(
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
              ? `</div><div class="form-group label-top"><label>${game.i18n.localize('ZWEI.actor.items.skilltest')}</label><select name="system.difficulty.associatedSkill">${HandlebarsHelpers.selectOptions(
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
      `<div class="form-group"><label>` + game.i18n.localize('ZWEI.actor.items.price') + `</label>${inputs}</div>`
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
        <div class="radio-and-status">
          <input type="radio" class="radio-rank"
            id="${uuid}.${i}" name="${name}"
            value="${i}" data-dtype="Number" ${isChecked ? 'checked' : ''}>
          <label for="${uuid}.${i}" class="status">
            <span><span>` +
        game.i18n.localize('ZWEI.actor.conditions.' + choices[i]) +
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
      game.i18n.localize('ZWEI.actor.items.skillranksabbr.apprentice'),
      game.i18n.localize('ZWEI.actor.items.skillranksabbr.journeyman'),
      game.i18n.localize('ZWEI.actor.items.skillranksabbr.master'),
    ][rank];
  });

  $$('zhLocalizeConditional', function (keypath, keyvalue) {
    if (typeof keyvalue !== 'string') return '';
    const keyvalueLS = keyvalue.toLowerCase().replace(/\s+/g, '');
    const keyvaluesList = [
      'alchemy',
      'athletics',
      'awareness',
      'bargain',
      'charm',
      'coordination',
      'counterfeit',
      'disguise',
      'drive',
      'eavesdrop',
      'education',
      'folklore',
      'gamble',
      'guile',
      'handleanimal',
      'heal',
      'incantation',
      'interrogation',
      'intimidate',
      'leadership',
      'martialmelee',
      'martialranged',
      'navigation',
      'pilot',
      'resolve',
      'ride',
      'rumor',
      'scrutinize',
      'simplemelee',
      'simpleranged',
      'skulduggery',
      'stealth',
      'survival',
      'toughness',
      'tradecraft',
      'warfare',
      'gc',
      'goldcoins',
      'ss',
      'silvershilling',
      'bp',
      'brasspennies',
      'nc',
      'newcurrency',
    ];
    if (keyvaluesList.includes(keyvalueLS)) {
      return game.i18n.localize(keypath + keyvalueLS);
    } else {
      return keyvalue;
    }
  });

  $$('zhModIndicator', function (mod) {
    return mod === 'dtm' ? 'dtm' : '';
  });

  $$('zhIsValueModified', function (value, baseValue, options) {
    return value != baseValue ? options.fn(this) : options.inverse(this);
  });

  $$('zhIsDtmModified', function (value, baseValue, dtm, options) {
    return value - (dtm || 0) != baseValue ? options.fn(this) : options.inverse(this);
  });

  $$('zhIsModifierPositive', function (value, baseValue, options) {
    return baseValue - value < 0 ? options.fn(this) : options.inverse(this);
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
    const item = fromUuidSync(uuid);
    return item ? item.name : '';
  });

  $$('zhIsCarried', function (system, options) {
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
      : `${damage.attributeBonus} + 1${damage.die}${damage.fury.value ? 'x' + damage.fury.explodesOn.join('&') : ''}${
          damage.bonus ? ' + ' + damage.bonus : ''
        }`;
  });

  $$('stringcompare', function (variableOne, comparator, variableTwo) {
    if (eval('"' + variableOne + '"' + comparator + '"' + variableTwo + '"')) {
      return true;
    } else {
      return false;
    }
  });

  $$('betweenparentheses', function (txt) {
    const parentheses = txt.match(/\(([^)]+)\)/);
    return parentheses ? parentheses[1] : '';
  });

  $$('beforeparentheses', function (txt) {
    const firstpar = txt.indexOf('(');
    return firstpar >= 0 ? txt.substring(0, firstpar).trim() : txt;
  });
};
