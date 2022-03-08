import * as ZweihanderUtils from "../../utils";
/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export default class ZweihanderItemSheet extends ItemSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["zweihander", "sheet", "item"],
      template: 'systems/zweihander/templates/item/main.hbs',
      width: 400,
      height: 550,
      resizable: true,
      tabs: [{ navSelector: ".sheet-navigation", contentSelector: ".sheet-body", initial: "details" }],
      dragDrop: [{ dragSelector: ".item-sheet-draggable", dropSelector: null }],
      scrollY: ['.sheet-body']
    });
  }

  _canDragStart(selector) {
    return true;
  }

  _canDragDrop(selector) {
    return this.isEditable;
  }

  _onDragDrop(event) {
    
  }

  _onDragStart(event) {
    const actor = this.item.actor;
    const dragData = {
      type: "Item",
      data: this.item.data,
      actorId: actor?.id ?? null,
      ceneId: actor?.isToken ? canvas.scene?.id : null,
      tokenId: actor?.isToken ? actor.token.id : null
    }
    // Set data transfer
    event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
  }

  /** @override */
  async getData() {
    const data = super.getData().data;
    data.owner = this.item.isOwner;
    data.editable = this.isEditable;
    data.rollData = this.item.getRollData.bind(this.item);
    data.choices = {};
    if (data.type === 'skill') {
    data.choices.associatedPrimaryAttribute = CONFIG.ZWEI.primaryAttributes
      .map(option => ({ 
        selected: (data.data.associatedPrimaryAttribute.value ?? 'Combat') === option ? 'selected' : '',
        value: option,
        label: option.capitalize()
      }));
    }
    if (this.item.type === "weapon") {
      data.skills = (await ZweihanderUtils.findItemsByType("skill", {takeOne: true})).map(x => x.name).sort((a, b) => a.localeCompare(b));
    }
    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);
    let data = this.object.data;
    let fp = new FilePicker({
      type: "image",
      current: data.img,
      displayMode: "thumbs",
      callback: path => {
        data.document.update({ img: path });
        this.render(true)
      }
    });

    html.find('.open-editor').click(async event => {
      event.preventDefault();
      const toggler = $(event.currentTarget);
      const group = toggler.parents(".form-group");
      const editor = group.find(".editor");
      const preview = group.find(".zh-editor-preview");
      $(preview).toggleClass("open");
      $(editor).toggleClass("open");
    })

    html.find('.profile').click(async event => {
      fp.render(true);
    });

    html.find('.array-input input').keypress(async (event) => event.which === 13 ? this.acceptArrayInput(event) : 0);
    html.find('.array-input input').focusout(async (event) => this.acceptArrayInput(event));
    html.find('.array-input-plus').click(async (event) => this.acceptArrayInput(event));
    html.find('.array-input-pill').click(async (event) => this.removeArrayInput(event));
  }

  async _updateObject(event, formData) {
    //@todo move to ZweihanderAncestry#update
    if (this.item.type === 'ancestry') {
      const trait = formData['data.ancestralTrait.value'];
      const item = await ZweihanderUtils.findItemWorldWide('trait', trait);
      if (item) {
        formData['data.ancestralTrait.value'] = item.name;
      }
      if (!item && trait.trim() !== '') {
        ui?.notifications.warn(`Couldn't find an ancestral trait with a name like ${trait} anywhere in the world or in compendia!`, { permanent: true });
        //TODO move to actor#prepareDerivedData
        if (this.item.isOwned) {
          ui?.notifications.error(`Please choose a valid, existing ancestral trait!`, { permanent: true });
        }
      }
    } else if (this.item.type === 'profession') {
      const profTrait = formData['data.professionalTrait.value'];
      let item;
      item = await ZweihanderUtils.findItemWorldWide('trait', profTrait);
      if (item) {
        formData['data.professionalTrait.value'] = item.name;
      }
      if (!item && profTrait.trim() !== '') {
        ui?.notifications.warn(`Couldn't find a professional trait with a name like ${profTrait} anywhere in the world or in compendia!`, { permanent: true });
        //TODO move to actor#prepareDerivedData
        if (this.item.isOwned) {
          ui?.notifications.error(`Please choose a valid, existing professional trait!`, { permanent: true });
        }
      }
      const specTrait = formData['data.specialTrait.value'];
      item = await ZweihanderUtils.findItemWorldWide('trait', specTrait);
      if (item) {
        formData['data.specialTrait.value'] = item.name;
      }
      if (!item && specTrait.trim() !== '') {
        ui?.notifications.warn(`Couldn't find a special trait with a name like ${specTrait} anywhere in the world or in compendia!`, { permanent: true });
        //TODO move to actor#prepareDerivedData
        if (this.item.isOwned) {
          ui?.notifications.error(`Please choose a valid, existing special trait!`, { permanent: true });
        }
      }
      const drawback = formData['data.drawback.value'];
      item = await ZweihanderUtils.findItemWorldWide('drawback', drawback);
      if (item) {
        formData['data.drawback.value'] = item.name;
      }
      if (!item && drawback.trim() !== '') {
        ui?.notifications.warn(`Couldn't find a drawback with a name like ${drawback} anywhere in the world or in compendia!`, { permanent: true });
        //TODO move to actor#prepareDerivedData
        if (this.item.isOwned) {
          ui?.notifications.error(`Please choose a valid, existing drawback!`, { permanent: true });
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
    const inputs = input.split(',').map(v => v.trim()).filter(v => v !== '');
    if (array.length + inputs.length > max) {
      const caption = arrayInput.parents('.form-group').find('label').text();
      ui?.notifications.warn(`You can't add more than ${max} entries in "${caption}"!`);
      const toAdd = max - array.length;
      inputs.splice(toAdd, inputs.length - toAdd);
      if (inputs.length === 0) return;
    }
    switch (target) {
      case 'data.ancestralModifiers.negative':
      case 'data.ancestralModifiers.positive':
        array = array.concat(await this.addInputToArray(inputs, async x => this.validateBonusAbbr(x), false));
        break;
      case 'data.bonusAdvances':
        array = array.concat(
          await this.addInputToArray(inputs, async x => {
            const vx = await this.validateBonusAbbr(x); return vx ? {value: vx} : vx
          }, false)
        );
        break;
      case 'data.talents':
        array = array.concat(await this.addInputToArray(inputs, async x => await this.validateTalent(x)));
        break;
      case 'data.skillRanks':
        array = array.concat(await this.addInputToArray(inputs, async x => await this.validateSkillRank(x)));
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
    const sanitized = `[${bonusAbbr.trim().replaceAll(/[^a-zA-Z]/g, '').toUpperCase()}]`;
    if (validValues.includes(sanitized)) {
      return sanitized;
    } else {
      ui?.notifications.warn(`"${sanitized}" is not a valid Bonus Abbreviation! Valid values: ${validValues}`)
    }
  }

  async validateTalent(talent) {
    const item = this.item;
    if (item.data.data?.talents?.some(t => ZweihanderUtils.normalizedEquals(t.value,talent))) {
      ui?.notifications.warn(`A Talent named "${talent}" already belongs to item "${item.name}" of type "${item.type}". Skill Ranks must be unique!`);
      return;
    }
    const foundItem = await ZweihanderUtils.findItemWorldWide('talent', talent);
    if (foundItem) {
      return {value: foundItem.name};
    } else {
      ui?.notifications.warn(`Couldn't find Talent with a name like ${talent} anywhere in the world or in compendia!`, { permanent: true });
      //TODO move to actor#prepareDerivedData
      if (this.item.isOwned) {
        ui?.notifications.error(`Please choose a valid, existing talent!`, { permanent: true });
      }
      return {value: talent};
    }
  }

  async validateSkillRank(skillRank) {
    const item = this.item;
    if (item.data.data?.skillRanks?.some(sr => ZweihanderUtils.normalizedEquals(sr.value,skillRank))) {
      ui?.notifications.warn(`A Skill Rank in "${skillRank}" already belongs to item "${item.name}" of type "${item.type}". Skill Ranks must be unique!`);
      return;
    }
    const foundItem = await ZweihanderUtils.findItemWorldWide('skill', skillRank);
    if (foundItem) {
      return {value: foundItem.name};
    } else {
      ui?.notifications.warn(`Couldn't find Skill Rank with a name like ${skillRank} anywhere in the world or in compendia!`, { permanent: true });
      //TODO move to actor#prepareDerivedData
      if (this.item.isOwned) {
        ui?.notifications.error(`Please choose a valid, existing skill!`, { permanent: true });
      }
      return {value: skillRank};
    }
  }

}
