import { getEffectsGroups } from './item-sheet-tabs-def';
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
      width: 600,
      height: 'auto',
      resizable: false,
      tabs: [
        {
          navSelector: '.sheet-navigation',
          contentSelector: '.sheet-body',
          initial: 'details',
        },
      ],
      dragDrop: [{ dragSelector: null, dropSelector: null }],
      scrollY: ['.sheet-body'],
    });
  }

  static _customElements = super._customElements.concat(['zweihander-tags', 'zweihander-multi-select']);

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

  async _onDrop(event) {
    const data = TextEditor.getDragEventData(event);

    const droppedItemUuid = data.uuid;
    const droppedItem = await fromUuid(droppedItemUuid);

    const item = this.item;

    // @todo: validate allowed Items based on this Item's type, e.g. Ancestry accepts Traits only
    switch (item.type) {
      case 'ancestry':
        if (droppedItem.type !== 'trait') {
          ui.notifications.error(`Item of type '${droppedItem.type}' cannot be added to an Ancestry Item.`);
          break;
        }

        await item.update({
          //'system.ancestralTrait.name': droppedItem.name,
          ['system.ancestralTrait.uuid']: droppedItem.uuid,
        });

        break;

      case 'profession':
        if (!['talent', 'trait', 'drawback'].includes(droppedItem.type)) {
          ui.notifications.error(`Item of type '${droppedItem.type}' cannot be added to a Profession Item.`);
          break;
        }

        if (droppedItem.type === 'trait') {
          const category = droppedItem.system.category;

          if (!['professional', 'special'].includes(category)) {
            ui.notifications.error(`${category.capitalize()} Traits cannot be added to a Profession Item.`);
            break;
          }

          await item.update({
            [`system.${category}Trait.uuid`]: droppedItem.uuid,
          });

          break;
        } else if (droppedItem.type === 'drawback') {
          await item.update({
            ['system.drawback.uuid']: droppedItem.uuid,
          });
        } else if (droppedItem.type === 'talent') {
          const talentList = Array.from({ length: 3 }, Object).map((o, i) => {
            o.uuid = '';
            return item.system.talents[i] ?? o;
          });

          if (talentList.filter((t) => t.uuid !== '').length >= 3) {
            ui.notifications.error(
              'A Profession can have a maximum of 3 Talents. Please delete one of the existing Talents before attempting to add a new one.'
            );
            break;
          }

          for (let i = 0; i < talentList.length; i++) {
            let talent = talentList[i];

            if (talent && talent?.uuid !== '') continue;

            talentList.splice(i, 1, { uuid: droppedItem.uuid });
            break;
          }

          await item.update({ ['system.talents']: talentList });
        }

        break;
      default:
        break;
    }
  }

  /** @override */
  async getData() {
    const sheetData = super.getData().data;

    const itemData = this.item.toObject(false);

    sheetData.owner = this.item.isOwner;
    sheetData.editable = this.isEditable;
    sheetData.rollData = this.item.getRollData.bind(this.item);
    sheetData.settings = ZweihanderUtils.getSheetSettings();
    sheetData.actor = this.item.actor;
    sheetData.choices = {};

    sheetData.effects = itemData.effects;

    const effectGroups = this._getEffectGroups(sheetData);
    sheetData.effectGroups = effectGroups;

    sheetData.html = {
      rules: await ZweihanderUtils.processRules(sheetData.system),
    };

    if (sheetData.type === 'skill') {
      sheetData.choices.associatedPrimaryAttribute = CONFIG.ZWEI.primaryAttributes.map((option) => ({
        selected: (sheetData.system.associatedPrimaryAttribute.toLowerCase() ?? 'combat') === option ? 'selected' : '',
        value: option,
        label: option.capitalize(),
      }));
    }

    if (sheetData.type === 'profession') {
      const skillPack = game.packs.get(game.settings.get('zweihander', 'skillPack'));
      sheetData.skills = (await skillPack.getIndex())
        .map((x) => ({
          key: x.name.toLowerCase(),
          label: x.name,
        }))
        .sort((a, b) => a.key.localeCompare(b.key));

      sheetData.skillsMultiSelect = sheetData.skills.map((skill) => ({
        ...skill,
        selected: this._getSelected(sheetData.system.skillRanks, skill),
      }));

      sheetData.choices.archetypes = ZweihanderUtils.selectedChoice(
        sheetData.system.archetype ?? CONFIG.ZWEI.archetypes[0],
        CONFIG.ZWEI.archetypes.map((option) => ({
          value: option,
          label: option,
        }))
      );

      const linkedItemDataList = [
        {
          property: 'professionalTrait',
          label: 'Professional Trait',
          type: 'trait',
          pack: 'zweihander.zh-traits', // @todo: add support for FoF
        },
        {
          property: 'specialTrait',
          label: 'Special Trait',
          type: 'trait',
          pack: 'zweihander.zh-traits',
        },
        {
          property: 'drawback',
          label: 'Drawback',
          type: 'drawback',
          pack: 'zweihander.zh-drawbacks',
        },
      ];

      this._prepareLinkedItemWrapperData(linkedItemDataList, sheetData);

      const talentList = Array.from({ length: 3 }, Object).map((o, i) => sheetData.system.talents[i] ?? o);

      this._prepareLinkedItemsWrapperData(talentList, sheetData, 'talent');
    }

    if (sheetData.type === 'injury') {
      sheetData.choices.severities = ZweihanderUtils.selectedChoice(
        sheetData.system.severity ?? 0,
        CONFIG.ZWEI.injurySeverities
      );
    }

    if (sheetData.type === 'weapon') {
      const skillPack = game.packs.get(game.settings.get('zweihander', 'skillPack'));
      sheetData.skills = (await skillPack.getIndex()).map((x) => x.name).sort((a, b) => a.localeCompare(b));
    }

    if (sheetData.type === 'ancestry') {
      const linkedItemDataList = [
        {
          property: 'ancestralTrait',
          label: 'Ancestral Trait',
          type: 'trait',
          pack: 'zweihander.zh-ancestral-traits', // @todo: add support for FoF
        },
      ];

      this._prepareLinkedItemWrapperData(linkedItemDataList, sheetData);
    }

    // console.log(sheetData);

    return sheetData;
  }

  _getSelected(skillRankData, skill) {
    return skillRankData.some((sr) => sr.name.trim().toLowerCase() === skill.key.trim().toLowerCase())
      ? 'selected'
      : '';
  }

  _prepareLinkedItemWrapperData(linkedItemDataList, sheetData) {
    for (let linkedItemData of linkedItemDataList) {
      const linkedItemUuid = sheetData.system[linkedItemData.property].uuid;
      const linkedItem = linkedItemUuid !== '' ? fromUuidSync(linkedItemUuid) : '';

      sheetData[`${linkedItemData.property}WrapperData`] = this._getWrapperData({
        name: linkedItem?.name,
        _id: linkedItem?._id,
        uuid: linkedItem?.uuid,
        ...linkedItemData,
      });
    }
  }

  // @todo: refactor to accept Qualities
  _prepareLinkedItemsWrapperData(linkedItemsDataList, sheetData, type) {
    sheetData[`${type}WrapperDataList`] = [];

    for (let linkedItemData of linkedItemsDataList) {
      const idx = linkedItemsDataList.indexOf(linkedItemData);
      const linkedItem = linkedItemData.uuid !== '' ? fromUuidSync(linkedItemData.uuid) : '';

      const toFetch = {
        _id: linkedItem?._id,
        label: type.capitalize(),
        type: type,
        pack: 'zweihander.zh-talents',
        property: `${type}.${idx}`,
        ...linkedItemData,
      };

      sheetData[`${type}WrapperDataList`].push(this._getWrapperData(toFetch));
    }
  }

  _getWrapperData(details) {
    return {
      value: details.name ?? '',
      id: details._id ?? '',
      placeholder: details.label,
      placeholderInput: '',
      type: details.type,
      packs: details.pack,
      isInItem: true,
      isParentCharacter: this.item.parent?.type ?? '' === 'character',
      uuid: details.uuid ?? '',
      uuidProperty: `system.${details.property}.uuid`,
    };
  }

  _getEffectGroups(data) {
    return getEffectsGroups(data);
  }

  _processItemGroups(itemGroups) {
    const sort = (itemGroup, criteria) =>
      itemGroup.items.sort((a, b) => {
        for (let sc of criteria) {
          let aV, bV;
          if (sc.detail === -1) {
            aV = a.name;
            bV = b.name;
          } else if (itemGroup.details[sc.detail].key) {
            aV = getProperty(a, itemGroup.details[sc.detail].key);
            bV = getProperty(b, itemGroup.details[sc.detail].key);
          } else {
            aV = itemGroup.details[sc.detail].value.call(a);
            bV = itemGroup.details[sc.detail].value.call(b);
          }
          if (aV < bV) {
            return sc.sort;
          } else if (aV > bV) {
            return -sc.sort;
          }
        }
        return 0;
      });
    const filter = (itemGroup, criteria) =>
      (itemGroup.items = itemGroup.items.filter((i) => {
        let filtered = true;
        for (let fc of criteria) {
          let v;
          if (fc.detail === -1) {
            v = i.name;
          } else if (itemGroup.details[fc.detail].key) {
            v = getProperty(i, itemGroup.details[fc.detail].key);
          } else {
            v = itemGroup.details[fc.detail].value.call(i);
          }
          // only strings supported for now
          if (typeof v === 'string') {
            filtered = filtered && v.trim().toLowerCase().indexOf(fc.value.trim().toLowerCase()) >= 0;
          }
        }
        return filtered;
      }));
    for (let [k, v] of Object.entries(this.sortCriteria)) {
      sort(
        itemGroups[k],
        v.filter((c) => !!c.sort)
      );
      for (let [i, sc] of v.entries()) {
        if (sc.detail === -1) {
          itemGroups[k].sortName = sc.sort;
          itemGroups[k].sortNameOrder = i + 1;
        } else {
          itemGroups[k].details[sc.detail].sort = sc.sort;
          itemGroups[k].details[sc.detail].sortOrder = i + 1;
        }
      }
    }
    for (let [k, v] of Object.entries(this.filterCriteria)) {
      filter(
        itemGroups[k],
        v.filter((c) => !!c.value)
      );
      for (let fc of v) {
        if (fc.detail === -1) {
          itemGroups[k].filterName = fc.value;
          itemGroups[k].filterNameActive = !!fc.active;
        } else {
          itemGroups[k].details[fc.detail].filter = fc.value;
          itemGroups[k].details[fc.detail].filterActive = !!fc.active;
        }
      }
    }
    Object.entries(itemGroups).forEach(([k, v]) => (v.id = k));
    return itemGroups;
  }

  async _prepareItems(sheetData) {
    sheetData.effects = this.prepareActiveEffectGroups();

    return sheetData;
  }

  prepareActiveEffectGroups() {
    const groups = {
      effects: this.item.effects,
    };

    for (const g of Object.values(groups)) {
      g.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    }

    return groups;
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

    // Add new Active Effect (from within the sheet)
    html.find('.add-new').click(async (ev) => {
      let type = ev.currentTarget.dataset.itemType;

      let createdItemArray = [];

      if (type === 'effect') {
        createdItemArray = await this.item.createEmbeddedDocuments('ActiveEffect', [
          {
            label: this.item.name,
            icon: this.item.img,
            origin: 'Actor.' + this.item.parent.id + '.Item.' + this.item.id,
            // @todo: refactor after transition to DataMode

            system: {
              details: {
                source: this.item.name + ' (' + this.item.type.capitalize() + ')',
                category: '',
                isActive: false,
              },
            },
          },
        ]);
      } else {
        const packIds = ev.currentTarget.dataset.openPacks?.split?.(',')?.filter?.((x) => x);
        if (!packIds) {
          ui.notifications.notify(game.i18n.localize('ZWEI.othermessages.errortype'));
          return;
        }
        const packs = packIds.map((x) => game.packs.get(x.trim()));
        if (packs.every((x) => x?.apps?.[0]?.rendered)) {
          packs.forEach((x) => x.apps[0].close());
        }
        packs.forEach((x, i) =>
          x.render(true, {
            top: this.item.sheet.position.top,
            left: this.item.sheet.position.left + (i % 2 == 0 ? -350 : this.item.sheet.position.width),
          })
        );
      }

      if (createdItemArray.length) createdItemArray[0].sheet.render(true);
    });

    const onDeleteCallback = (itemType, uuidProperty) =>
      ['talent', 'quality'].includes(itemType)
        ? onDeleteArrayItemCallback(uuidProperty)
        : onDeleteItemCallback(uuidProperty);

    const onDeleteItemCallback = (uuidProperty) => async () => {
      await this.item.update({ [`${uuidProperty}`]: '' });
      this.render(false);
    };

    const onDeleteArrayItemCallback = (uuidProperty) => async () => {
      const [type, idx] = uuidProperty.split('.').slice(1, -1);
      const property = type === 'talent' ? 'system.talents' : 'system.qualities';
      const updatedArray = [...getProperty(this.item, property)];

      updatedArray.splice(idx, 1, { uuid: '' });

      await this.item.update({ [property]: updatedArray });
      this.render(false);
    };

    html.find('.item-delete').click(async (ev) => {
      const itemTarget = $(ev.currentTarget).parents('.item');
      const itemType = itemTarget.data('itemType');
      const uuidProperty = itemTarget.data('property');
      const itemName = itemTarget.children('.auto-size').val();

      const type = game.i18n.localize(CONFIG.Item.typeLabels[itemType]);
      await Dialog.confirm({
        title: game.i18n.format('ZWEI.othermessages.deleteembedded', { type: type, name: itemName }),
        content: game.i18n.format('ZWEI.othermessages.suretype', { type: type }),
        yes: onDeleteCallback(itemType, uuidProperty),
        no: () => {},
        defaultYes: true,
      });
    });

    html.find('.item-edit').click((ev) => {
      const i = $(ev.currentTarget).parents('.item');
      const item = this.item.parent.items.get(i.data('itemId'));
      item.sheet.render(true);
    });

    html.find('.item-view').click(async (ev) => {
      const i = $(ev.currentTarget).parents('.item');
      const item = await fromUuid(i.data('itemUuid'));
      item.sheet.render(true);
    });

    html.find('.randomize-trait').click(this._randomizeAncestralTrait.bind(this));

    // Edit Active Effect
    html.find('.effect-edit').click((ev) => {
      const i = $(ev.currentTarget).parents('.effect-item');
      const item = this.item.effects.get(i.data('itemId'));
      item.sheet.render(true);
    });

    // Delete Active Effect
    html.find('.effect-delete').click(async (ev) => {
      const i = $(ev.currentTarget).parents('.effect-item');
      const effect = this.item.effects.get(i.data('itemId'));
      const type = game.i18n.localize(CONFIG.ActiveEffect.typeLabels['base']);
      await Dialog.confirm({
        title: game.i18n.format('ZWEI.othermessages.deletetype', { type: type, label: effect.label }),
        content: game.i18n.format('ZWEI.othermessages.suretype', { type: type }),
        yes: async () => {
          await effect.delete();
          i.slideUp(200, () => this.render(false));
        },
        no: () => {},
        defaultYes: true,
      });
    });

    html.find('.requirements-control').click(this._onRequirementsControl.bind(this));
  }

  async _randomizeAncestralTrait() {
    const item = this.item;

    if (item.type !== 'ancestry') return;

    const worldTable = game.tables.find((table) => table.name.includes(item.name));
    const isWorldTableUndefined = typeof worldTable === 'undefined';

    // If Roll Table doesn't exist in World, use Compendium as fallback. Only works for default Ancestries.
    let compendiumTable;

    if (isWorldTableUndefined) {
      const characterCreationPack = game.packs.get('zweihander.zh-charactercreation-tables');
      const characterCreationPackIndex = await characterCreationPack.getIndex();
      const compendiumTableEntry = characterCreationPackIndex.find((table) => {
        return ZweihanderUtils.normalizedIncludes(table.name, item.name);
      });

      compendiumTable = await characterCreationPack.getDocument(compendiumTableEntry?._id);
    }

    const isCompendiumTableUndefined = typeof compendiumTable === 'undefined';

    if (isWorldTableUndefined && isCompendiumTableUndefined) {
      ui.notifications.error(`No Roll Table found in World or Compendium for following Ancestry: ${item.name}`);
      return;
    }

    const ancestralTraitsTable = isWorldTableUndefined ? compendiumTable : worldTable;
    const diceRoll = await ancestralTraitsTable.roll();
    const ancestralTraitsTableResult = await ancestralTraitsTable.draw({ roll: diceRoll });

    const ancestralTrait = ancestralTraitsTableResult.results[0];
    const documentCollection = ancestralTrait.documentCollection;
    const documentId = ancestralTrait.documentId;
    const pack = ancestralTrait.type === 'pack';

    let ancestralTraitUuid = '';
    ancestralTraitUuid += pack ? 'Compendium.' : '';
    ancestralTraitUuid += `${documentCollection}.`;
    ancestralTraitUuid += pack ? `Item.${documentId}` : documentId;

    await item.update({ ['system.ancestralTrait.uuid']: ancestralTraitUuid });
  }

  _onRequirementsControl(event) {
    event.preventDefault();
    const button = event.currentTarget;
    switch (button.dataset.action) {
      case 'add':
        return this._addRequirementsChange();
      case 'delete':
        button.closest('.requirements-change').remove();
        return this.submit({ preventClose: true }).then(() => this.render());
    }
  }

  async _addRequirementsChange() {
    const idx = this.document.system.expert.requirements.skillRanks.length;
    return this.submit({
      preventClose: true,
      updateData: {
        [`system.expert.requirements.skillRanks.${idx}`]: { key: '', value: '' },
      },
    });
  }

  _getSubmitData(updateData = {}) {
    let data;

    if (this.item.type === 'profession') {
      const fd = new FormDataExtended(this.form, { editors: this.editors });
      data = foundry.utils.expandObject(fd.object);

      if (updateData) foundry.utils.mergeObject(data, updateData);

      typeof data.system['expert'] === 'undefined' ? (data.system.expert = {}) : data.system.expert;
      typeof data.system.expert['requirements'] === 'undefined'
        ? (data.system.expert.requirements = {})
        : data.system.expert.requirements;
      typeof data.system.expert.requirements.skillRanks === 'undefined'
        ? (data.system.expert.requirements.skillRanks = [])
        : data.system.expert.requirements.skillRanks;

      data.system.expert.requirements.skillRanks = Array.from(
        Object.values(data.system.expert.requirements.skillRanks || {})
      );
    } else {
      data = super._getSubmitData(updateData);
    }

    return data;
  }

  async _updateObject(event, formData) {
    //@todo PROBABLY CAN BE REMOVED; test
    if (this.item.type === 'ancestry') {
      const traitUuid = formData['system.ancestralTrait.uuid'];
      const item = await fromUuid(traitUuid);
      if (item) {
        formData['system.ancestralTrait.name'] = item.name;
      }
      if (!item && traitUuid !== undefined) {
        ui?.notifications.warn(game.i18n.format('ZWEI.othermessages.noancestral', { trait: traitUuid }), {
          permanent: true,
        });
        //TODO move to actor#prepareDerivedData
        if (this.item.isOwned) {
          ui?.notifications.error(game.i18n.format('ZWEI.othermessages.validwhat', { what: 'ancestral trait' }), {
            permanent: true,
          });
        }
      }
    } else if (this.item.type === 'profession') {
      /*
      const profTrait = formData['system.professionalTrait.name'];
      let item;
      // @todo tansition to uuid
      // item = await ZweihanderUtils.findItemWorldWide('trait', profTrait);
      if (item) {
        formData['system.professionalTrait.name'] = item.name;
      }
      if (!item && profTrait.trim() !== '') {
        ui?.notifications.warn(game.i18n.format('ZWEI.othermessages.notrait', { trait: profTrait }), {
          permanent: true,
        });
        //TODO move to actor#prepareDerivedData
        if (this.item.isOwned) {
          ui?.notifications.error(game.i18n.format('ZWEI.othermessages.validwhat', { what: 'professional trait' }), {
            permanent: true,
          });
        }
      }
      const specTrait = formData['system.specialTrait.name'];
      // @todo tansition to uuid
      // item = await ZweihanderUtils.findItemWorldWide('trait', specTrait);
      if (item) {
        formData['system.specialTrait.name'] = item.name;
      }
      if (!item && specTrait.trim() !== '') {
        ui?.notifications.warn(game.i18n.format('ZWEI.othermessages.nospecial', { trait: specTrait }), {
          permanent: true,
        });
        //TODO move to actor#prepareDerivedData
        if (this.item.isOwned) {
          ui?.notifications.error(game.i18n.format('ZWEI.othermessages.validwhat', { what: 'special trait' }), {
            permanent: true,
          });
        }
      }
      const drawback = formData['system.drawback.name'];
      // @todo tansition to uuid
      // item = await ZweihanderUtils.findItemWorldWide('drawback', drawback);
      if (item) {
        formData['system.drawback.name'] = item.name;
      }
      if (!item && drawback.trim() !== '') {
        ui?.notifications.warn(game.i18n.format('ZWEI.othermessages.nodrawback', { drawback: drawback }), {
          permanent: true,
        });
        //TODO move to actor#prepareDerivedData
        if (this.item.isOwned) {
          ui?.notifications.error(game.i18n.format('ZWEI.othermessages.validwhat', { what: 'drawback' }), {
            permanent: true,
          });
        }
      }
        */
    }
    super._updateObject(event, formData);
  }

  /*

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

  */

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
        game.i18n.format('ZWEI.othermessages.novalidbonus', { sanitized: sanitized, valid: validValues })
      );
    }
  }

  async validateTalent(talent) {
    const item = this.item;
    if (item.system?.talents?.some((t) => ZweihanderUtils.normalizedEquals(t.name, talent))) {
      ui?.notifications.warn(
        game.i18n.format('ZWEI.othermessages.talentbelongs', { talent: talent, name: item.name, type: item.type })
      );
      return;
    }
    const foundItem = await ZweihanderUtils.findItemWorldWide('talent', talent);
    if (foundItem) {
      return { name: foundItem.name };
    } else {
      ui?.notifications.warn(game.i18n.format('ZWEI.othermessages.notalent', { talent: talent }), {
        permanent: true,
      });
      //TODO move to actor#prepareDerivedData
      if (this.item.isOwned) {
        ui?.notifications.error(game.i18n.format('ZWEI.othermessages.validwhat', { what: 'talent' }), {
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
        game.i18n.format('ZWEI.othermessages.rankbelongs', { rank: skillRank, name: item.name, type: item.type })
      );
      return;
    }
    const foundItem = await ZweihanderUtils.findItemWorldWide('skill', skillRank);
    if (foundItem) {
      return { name: foundItem.name };
    } else {
      ui?.notifications.warn(game.i18n.format('ZWEI.othermessages.norank', { rank: skillRank }), { permanent: true });
      //TODO move to actor#prepareDerivedData
      if (this.item.isOwned) {
        ui?.notifications.error(game.i18n.format('ZWEI.othermessages.validwhat', { what: 'skill' }), {
          permanent: true,
        });
      }
      return { name: skillRank };
    }
  }
}
