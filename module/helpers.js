import { uuidv4, zhExplicitSign, localize, localizePath } from './utils';

/**
 * Define a set of handlebar helpers
 * @returns {Promise}
 */
export const registerHandlebarHelpers = async function () {

  const $$ = (name, fn) => Handlebars.registerHelper(name, fn);

  $$('$$', function (path) {
    return 'systems/zweihander/templates/' + path + '.hbs'
  })

  $$('zhGetFirstLetter', function (word) {
    if (typeof word !== 'string') return '';
    return word.charAt(0).toUpperCase();
  });

  $$('zhCapitalize', function (word) {
    if (typeof word !== 'string') return '';
    return word.capitalize();
  });

  $$('zhAlignmentRanks', function (name, alignmentRanks, permanentRanks, options) {
    const alignment = name.split('.')[2];
    const icon = alignment === "chaos" ? "ra-cancel" : "ra-horseshoe";
    const checked = options.hash['checked'] || null;
    let html = "";
    let uuid = uuidv4();
    for (let i = 1; i <= alignmentRanks; i++) {
      const isChecked = Number(checked) === i;
      const isPermanentRank = i <= permanentRanks;
      html += `
        <input 
          type="radio"
          name="${name}"
          id="${uuid}.${name + i}"
          value="${i}"
          ${isChecked ? "checked" : ""}
          ${isPermanentRank ? "disabled" : ""}>
        <label
          for="${uuid}.${name + i}"
          class="${isPermanentRank ? `permanent-rank ${alignment}` : "regular-rank"}">
          ${isPermanentRank ? `<span class='ra ${icon}'></span>` : i}
        </label>
      `;
    }
    return new Handlebars.SafeString(html);
  });

  $$('zhConditionLadder', function (name, choices, options) {
    const checked = options.hash['checked'] ?? 5;
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
            <span><span>${choices[i]}</span></span>
          </label>
        </div>`;
    }
    return new Handlebars.SafeString(html);
  });


  $$('zhProcessRuleText', function (text) {
    text = TextEditor.enrichHTML(text);
    if (window.MEME?.markdownIt?.render) {
      text = window.MEME?.markdownIt?.render(text)
    }
    return text;
  })

  $$('zhItemImageClass', function (img) {
    return img.endsWith(".svg") ? "item-image item-image-icon" : "item-image item-image-picture";
  })

  $$('zhItemImageStyle', function (img) {
    return img.endsWith(".svg") ? `-webkit-mask-image: url('${img}')` : `background-image: url('${img}')`;
  })

  $$('arrayInputGroup', function (label, target, array, max = Number.MAX_SAFE_INTEGER, pillDisplayProperty) {
    return `<div class="form-group">
    <label>${label}</label>
    <div class="array-input flexrow" data-array-input-target="${target}" data-array-input-max="${max}">
      <input name="proxy.${target}" type="text" placeholder="Enter values here">
      <button class="array-input-plus" type="button" tabindex="-1"><i class="fas fa-plus"></i></button>
      <div class="array-input-pills">
        ${array.map((v, i) => `
          <span class="array-input-pill" data-array-input-index="${i}">${v[pillDisplayProperty] ?? v}</span>
        `)}
      </div>
    </div>
  </div>`
  })

  $$('zhSkillBonus', function (bonus) {
    return bonus ? `+${bonus}` : '';
  })

  $$('zhSkillRankAbbreviation', function (rank) {
    return ['-', 'Appr.', 'Jour.', 'Mstr.'][rank];
  })

  $$('zhSpeakerPic', function (message) {
    const actor = ChatMessage.getSpeakerActor(message.speaker);
    if (message.flags?.zweihander?.img) return message.flags.zweihander.img;
    if (actor && actor.img) return actor.img;
    const author = game.users.get(message.user);
    if (author && author.avatar) return author.avatar;
    return "";
  })

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
    return languages.slice(1).reduce((str, l) =>
      `${str}, ${displayLanguage(l)}`,
      displayLanguage(languages[0])
    );
  });

  $$('zhAdd', (...x) => x.slice(0, -1).reduce((a, b) => {
    return new Number(a) + new Number(b)
  }, 0));

  $$('zhPrice', (price) => {
    const currencies = game.settings.get('zweihander', 'currencySettings');
    return new Handlebars.SafeString(currencies.map(c => `<i class="fas fa-coins currency" style="color: ${c.color}"></i> ${price[c.abbreviation] ?? 0} ${c.abbreviation}`).join(' '));
  });

  $$('zhPriceInputs', (price) => {
    const currencies = game.settings.get('zweihander', 'currencySettings');
    const inputs = currencies.map(c => `
      <i class="fas fa-coins currency" style="color: ${c.color}"></i>
      <input name="data.price.${c.abbreviation}" type="number" value="${price[c.abbreviation] ?? 0}">
    `).join('');
    return new Handlebars.SafeString(`<div class="form-group"><label>Price</label>${inputs}</div>`);
  });

  $$('zhLocalize', localize);

  $$('zhLocalizePath', localizePath);

}