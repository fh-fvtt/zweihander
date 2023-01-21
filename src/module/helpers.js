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

  $$('zhLowerCase', function (word) {
    if (typeof word !== 'string') return '';
    return word.toLowerCase();
  });

  $$('zhLowerCaseSpaces', function (word) {
    if (typeof word !== 'string') return '';
    return word.toLowerCase().replace(/\s+/g, '');
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

  $$('zhProcessRuleText', function (text) {
    text = TextEditor.enrichHTML(text, {});
    if (window.MEME?.markdownIt?.render) {
      text = window.MEME?.markdownIt?.render(text);
    }
    return text;
  });

  $$('zhEffectToHTML', function (effect) {
    let html = '';

    effect.changes.forEach((e) => {
      html += `<label>` + game.i18n.localize("ZWEI.othermessages.modifiedattribute") + `:</label> ${e.key}<br /><label>` + game.i18n.localize("ZWEI.othermessages.mode") + `:</label> ${e.mode}<br /><label>` + game.i18n.localize("ZWEI.othermessages.value") + `:</label> ${e.value}<br />`;
    });

    return new Handlebars.SafeString(html);
  });

  $$('zhItemImageClass', function (img) {
    return img?.endsWith('.svg') ? 'item-image item-image-icon' : 'item-image item-image-picture';
  });

  $$('zhItemImageStyle', function (img) {
    return img?.endsWith('.svg') ? `-webkit-mask-image: url('${img}')` : `background-image: url('${img}')`;
  });

  $$('arrayInputGroup', function (label, target, array, max = Number.MAX_SAFE_INTEGER, pillDisplayProperty) {
    return `<div class="form-group">
    <label>${label}</label>
    <div class="array-input flexrow" data-array-input-target="${target}" data-array-input-max="${max}">
      <input name="proxy.${target}" type="text" placeholder="Enter values here">
      <button class="array-input-plus" type="button" tabindex="-1"><i class="fas fa-plus"></i></button>
      <div class="array-input-pills">
        ${array.map(
          (v, i) => `
          <span class="array-input-pill" data-array-input-index="${i}">${v[pillDisplayProperty] ?? v}</span>
        `
        )}
      </div>
    </div>
  </div>`;
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
    const keys = key.toString().split('.');
    let val = obj;
    for (let key of keys) {
      val = val?.[key];
    }
    return val;
  });

  $$('zhDisplayLanguages', (languages) => {
    if (!languages.length) return '';
    const displayLanguage = (l) => `${l.name}${l.isLiterate ? ' (Literate)' : ''}`;
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
              game.i18n.localize("ZWEI.coinage." + c.abbreviation)
            }`
        )
        .join(' ')
    );
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
    return new Handlebars.SafeString(`<div class="form-group"><label>` + game.i18n.localize('ZWEI.actor.items.price') + `</label>${inputs}</div>`);
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
	
  $$("zhConditionLadderLoc", function(name, choices, options) {
    const checked = options.hash["checked"] ?? 5;
    let html = "";
    let uuid = uuidv4();
    for (let i = choices.length - 1; i >= 0; i--) {
      const isChecked = checked == i;
      html += `
        <div class="radio-and-status">
          <input type="radio" class="radio-rank"
            id="${uuid}.${i}" name="${name}"
            value="${i}" data-dtype="Number" ${isChecked ? "checked" : ""}>
          <label for="${uuid}.${i}" class="status">
            <span><span>` + game.i18n.localize('ZWEI.actor.conditions.' + choices[i]) + `</span></span>
          </label>
        </div>`;
    }
    return new Handlebars.SafeString(html);
  });
	
  $$("zhConcat", (...strs) =>
    strs.filter((s) => typeof s !== "object").join("")
  );
	
	$$("zhSkillRankAbbreviationLoc", function(rank) {
    return ["-", game.i18n.localize('ZWEI.actor.skills.rankabbreviation.apprentice'), 
		game.i18n.localize('ZWEI.actor.skills.rankabbreviation.journeyman'), 
		game.i18n.localize('ZWEI.actor.skills.rankabbreviation.master')][rank];
  });

  $$("zhLocalizeConditional", function (keypath, keyvalue) {
    if (typeof keyvalue !== "string") return "";
    const keyvalueLS = keyvalue.toLowerCase().replace(/\s+/g, "");
    const keyvaluesList = ["alchemy", "athletics", "awareness", "bargain", "charm", "coordination", "counterfeit", "disguise", "drive", "eavesdrop", "education", "folklore", "gamble", "guile", "handleanimal", "heal", "incantation", "interrogation", "intimidate", "leadership", "martialmelee", "martialranged", "navigation", "pilot", "resolve", "ride", "rumor", "scrutinize", "simplemelee", "simpleranged", "skulduggery", "stealth", "survival", "toughness", "tradecraft", "warfare","gc","goldcoins","ss","silvershilling","bp","brasspennies","nc","newcurrency"];
    if (keyvaluesList.includes(keyvalueLS)) {
      return game.i18n.localize(keypath + keyvalueLS)
    } else {
      return keyvalue;
    }
  });

};
