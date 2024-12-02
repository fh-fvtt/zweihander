import * as ZweihanderUtils from '../../utils';
/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export default class ZweihanderItemSheet extends ItemSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ['zweihander', 'sheet', 'item'],
      template: 'systems/zweihander/src/templates/item/main.hbs',
      width: 470,
      height: 550,
      resizable: true,
      tabs: [
        {
          navSelector: '.sheet-navigation',
          contentSelector: '.sheet-body',
          initial: 'details',
        },
      ],
      dragDrop: [{ dragSelector: '.item-sheet-draggable', dropSelector: null }],
      scrollY: ['.sheet-body'],
    });
  }

  _canDragStart(selector) {
    return true;
  }

  _canDragDrop(selector) {
    return this.isEditable;
  }

  _onDragDrop(event) {}

  _onDragStart(event) {
    const actor = this.item.actor;
    const dragData = {
      type: 'Item',
      data: this.item,
      actorId: actor?.id ?? null,
      sceneId: actor?.isToken ? canvas.scene?.id : null,
      tokenId: actor?.isToken ? actor.token.id : null,
    };
    // Set data transfer
    event.dataTransfer.setData('text/plain', JSON.stringify(dragData));
  }

  /** @override */
  async getData() {
    const sheetData = super.getData().data;
    sheetData.owner = this.item.isOwner;
    sheetData.editable = this.isEditable;
    sheetData.rollData = this.item.getRollData.bind(this.item);
    sheetData.settings = ZweihanderUtils.getSheetSettings();
    sheetData.actor = this.item.actor;
    sheetData.choices = {};

    sheetData.html = {
      rules: await ZweihanderUtils.processRules(sheetData.system)
    };

    if (sheetData.type === 'skill') {
      sheetData.choices.associatedPrimaryAttribute = CONFIG.ZWEI.primaryAttributes.map((option) => ({
        selected: (sheetData.system.associatedPrimaryAttribute.toLowerCase() ?? 'combat') === option ? 'selected' : '',
        value: option,
        label: option.capitalize(),
      }));
    }
    if (sheetData.type === 'profession') {
      sheetData.choices.archetypes = ZweihanderUtils.selectedChoice(
        sheetData.system.archetype ?? CONFIG.ZWEI.archetypes[0],
        CONFIG.ZWEI.archetypes.map((option) => ({
          value: option,
          label: option,
        }))
      );
    }
    if (sheetData.type === 'injury') {
      sheetData.choices.severities = ZweihanderUtils.selectedChoice(
        sheetData.system.severity ?? 0,
        CONFIG.ZWEI.injurySeverities
      );
    }
    if (sheetData.type === 'weapon') {
      const skillPack = game.packs.get(game.settings.get('zweihander', 'skillPack'));
      sheetData.skills = (await skillPack.getDocuments()).map((x) => x.name).sort((a, b) => a.localeCompare(b));
    }
    return sheetData;
  }

  _onEditImage(event) {
    const fp = new FilePicker({
      type: 'image',
      current: this.object.img,
      callback: async (path) => {
        await this._onSubmit(event, { preventClose: true });
        await this.item.update({ img: path });
      },
      top: this.position.top + 40,
      left: this.position.left + 10,
    });
    return fp.browse();
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find('.open-editor').click(async (event) => {
      event.preventDefault();
      const toggler = $(event.currentTarget);
      const group = toggler.parents('.form-group');
      const editor = group.find('.editor');
      const preview = group.find('.zh-editor-preview');
      $(preview).toggleClass('open');
      $(editor).toggleClass('open');
    });

    html.find('.profile').click(async (event) => {
      this._onEditImage(event);
    });

    html.find('.array-input input').keypress(async (event) => (event.which === 13 ? this.acceptArrayInput(event) : 0));
    html.find('.array-input input').focusout(async (event) => this.acceptArrayInput(event));
    html.find('.array-input-plus').click(async (event) => this.acceptArrayInput(event));
    html.find('.array-input-pill').click(async (event) => this.removeArrayInput(event));
  }

  async _updateObject(event, formData) {
    //@todo move to ZweihanderAncestry#update
    if (this.item.type === 'ancestry') {
      const trait = formData['system.ancestralTrait.name'];
      const item = await ZweihanderUtils.findItemWorldWide('trait', trait);
      if (item) {
        formData['system.ancestralTrait.name'] = item.name;
      }
      if (!item && trait.trim() !== '') {
        ui?.notifications.warn(
          game.i18n.format("ZWEI.othermessages.noancestral", { trait: trait }),
          { permanent: true }
        );
        //TODO move to actor#prepareDerivedData
        if (this.item.isOwned) {
          ui?.notifications.error(
            game.i18n.format("ZWEI.othermessages.validwhat", { what: 'ancestral trait' }), 
            {
            permanent: true,
          });
        }
      }
    } else if (this.item.type === 'profession') {
      const profTrait = formData['system.professionalTrait.name'];
      let item;
      item = await ZweihanderUtils.findItemWorldWide('trait', profTrait);
      if (item) {
        formData['system.professionalTrait.name'] = item.name;
      }
      if (!item && profTrait.trim() !== '') {
        ui?.notifications.warn(
          game.i18n.format("ZWEI.othermessages.notrait", { trait: profTrait }),
          { permanent: true }
        );
        //TODO move to actor#prepareDerivedData
        if (this.item.isOwned) {
          ui?.notifications.error(
            game.i18n.format("ZWEI.othermessages.validwhat", { what: 'professional trait' }), 
            {
            permanent: true,
          });
        }
      }
      const specTrait = formData['system.specialTrait.name'];
      item = await ZweihanderUtils.findItemWorldWide('trait', specTrait);
      if (item) {
        formData['system.specialTrait.name'] = item.name;
      }
      if (!item && specTrait.trim() !== '') {
        ui?.notifications.warn(
          game.i18n.format("ZWEI.othermessages.nospecial", { trait: specTrait }),
          { permanent: true }
        );
        //TODO move to actor#prepareDerivedData
        if (this.item.isOwned) {
          ui?.notifications.error(
            game.i18n.format("ZWEI.othermessages.validwhat", { what: 'special trait' }), 
            {
            permanent: true,
          });
        }
      }
      const drawback = formData['system.drawback.name'];
      item = await ZweihanderUtils.findItemWorldWide('drawback', drawback);
      if (item) {
        formData['system.drawback.name'] = item.name;
      }
      if (!item && drawback.trim() !== '') {
        ui?.notifications.warn(
          game.i18n.format("ZWEI.othermessages.nodrawback", { drawback: drawback }),
          { permanent: true }
        );
        //TODO move to actor#prepareDerivedData
        if (this.item.isOwned) {
          ui?.notifications.error(
            game.i18n.format("ZWEI.othermessages.validwhat", { what: 'drawback' }), 
            {
            permanent: true,
          });
        }
      }
    }
    super._updateObject(event, formData);
  }

  async acceptArrayInput(event, prevent = true) {
    if (prevent) event.preventDefault();
    const html = event.currentTarget;
    const arrayInput = $(html).parent('.array-input');
    const target = arrayInput.data('arrayInputTarget');
    const input = arrayInput.find('input').val();
    let array = getProperty(this.item.toObject(false), target);
    const max = arrayInput.data('arrayInputMax') ?? Number.MAX_SAFE_INTEGER;
    if (!input?.trim()) return;
    const inputs = input
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v !== '');
    if (array.length + inputs.length > max) {
      const caption = arrayInput.parents('.form-group').find('label').text();
      ui?.notifications.warn(`You can't add more than ${max} entries in "${caption}"!`);
      const toAdd = max - array.length;
      inputs.splice(toAdd, inputs.length - toAdd);
      if (inputs.length === 0) return;
    }
    switch (target) {
      case 'system.ancestralModifiers.negative':
      case 'system.ancestralModifiers.positive':
        array = array.concat(await this.addInputToArray(inputs, async (x) => this.validateBonusAbbr(x), false));
        break;
      case 'system.bonusAdvances':
        array = array.concat(
          await this.addInputToArray(
            inputs,
            async (x) => {
              const vx = await this.validateBonusAbbr(x);
              return vx ? { name: vx } : vx;
            },
            false
          )
        );
        break;
      case 'system.talents':
        array = array.concat(await this.addInputToArray(inputs, async (x) => await this.validateTalent(x)));
        break;
      case 'system.skillRanks':
        array = array.concat(await this.addInputToArray(inputs, async (x) => await this.validateSkillRank(x)));
        break;
    }
    await this.item.update({ [target]: array }).then(() => this.render(false));
  }

  async addInputToArray(inputs, validationFn, unique = true) {
    if (unique) {
      inputs = [...new Set(inputs)];
    }
    const array = [];
    for (let input of inputs) {
      const validatedInput = await validationFn(input);
      if (validatedInput) {
        array.push(validatedInput);
      }
    }
    return array;
  }

  async removeArrayInput(event) {
    event.preventDefault();
    const html = event.currentTarget;
    const arrayInput = $(html).parents('.array-input');
    const target = arrayInput.data('arrayInputTarget');
    const array = getProperty(this.item.toObject(false), target);
    const i = $(html).data('arrayInputIndex');
    array.splice(i, 1);
    this.item.update({ [target]: array }).then(() => this.render(false));
  }

  async validateBonusAbbr(bonusAbbr) {
    //TODO: move to const?
    const validValues = ['[CB]', '[BB]', '[AB]', '[PB]', '[IB]', '[WB]', '[FB]'];
    const sanitized = `[${bonusAbbr
      .trim()
      .replaceAll(/[^a-zA-Z]/g, '')
      .toUpperCase()}]`;
    if (validValues.includes(sanitized)) {
      return sanitized;
    } else {
      ui?.notifications.warn(
        game.i18n.format("ZWEI.othermessages.novalidbonus", { sanitized: sanitized, valid: validValues })
        );
    }
  }

  async validateTalent(talent) {
    const item = this.item;
    if (item.system?.talents?.some((t) => ZweihanderUtils.normalizedEquals(t.name, talent))) {
      ui?.notifications.warn(
        game.i18n.format("ZWEI.othermessages.talentbelongs", { talent: talent, name: item.name, type: item.type })
      );
      return;
    }
    const foundItem = await ZweihanderUtils.findItemWorldWide('talent', talent);
    if (foundItem) {
      return { name: foundItem.name };
    } else {
      ui?.notifications.warn(
        game.i18n.format("ZWEI.othermessages.notalent", { talent: talent }), 
        {
        permanent: true,
      });
      //TODO move to actor#prepareDerivedData
      if (this.item.isOwned) {
        ui?.notifications.error(
          game.i18n.format("ZWEI.othermessages.validwhat", { what: 'talent' }), 
          {
          permanent: true,
        });
      }
      return { name: talent };
    }
  }

  async validateSkillRank(skillRank) {
    const item = this.item;
    if (item.system?.skillRanks?.some((sr) => ZweihanderUtils.normalizedEquals(sr.name, skillRank))) {
      ui?.notifications.warn(
        game.i18n.format("ZWEI.othermessages.rankbelongs", { rank: skillRank, name: item.name, type: item.type })
      );
      return;
    }
    const foundItem = await ZweihanderUtils.findItemWorldWide('skill', skillRank);
    if (foundItem) {
      return { name: foundItem.name };
    } else {
      ui?.notifications.warn(
        game.i18n.format("ZWEI.othermessages.norank", { rank: skillRank }),
        { permanent: true }
      );
      //TODO move to actor#prepareDerivedData
      if (this.item.isOwned) {
        ui?.notifications.error(
          game.i18n.format("ZWEI.othermessages.validwhat", { what: 'skill' }), 
          {
          permanent: true,
        });
      }
      return { name: skillRank };
    }
  }
}
