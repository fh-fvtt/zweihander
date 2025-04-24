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

  _canDragDrop(selector) {
    return this.isEditable;
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

          if (talentList.filter((t) => t.uuid === droppedItem.uuid).length > 0) {
            ui.notifications.error(`Profession (${this.item.name}) already has following Talent: ${droppedItem.name}`);
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

    console.log('GET DATA');

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

    if (sheetData.type === 'disease') {
      sheetData.difficultyRatings = [...Array(7).keys()].map((i) => {
        const value = i * 10 - 30;
        const selected = (Number(sheetData.system.resist) ?? 0) === value ? 'selected' : '';
        return { value, label: ZweihanderUtils.getDifficultyRatingLabel(value), selected };
      });

      const diceTypes = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'];

      sheetData.dice = diceTypes.map((d) => ({
        value: d,
        label: d,
        selected: sheetData.system.duration.formula.die === d ? 'selected' : '',
      }));
    }

    if (sheetData.type === 'ritual') {
      sheetData.ritualCastingTimes = ['varies', 'special', 'formula'].map((ct) => ({
        label: game.i18n.localize(`ZWEI.actor.items.castingtimeList.${ct}`),
        value: ct,
        selected: sheetData.system.castingTime.setting === ct,
      }));

      sheetData.ritualDifficultiesSpecific = [...Array(7).keys()].map((i) => {
        const value = i * 10 - 30;
        const selected = (Number(sheetData.system.difficulty.rating) ?? 0) === value ? 'selected' : '';
        return { value, label: ZweihanderUtils.getDifficultyRatingLabel(value), selected };
      });

      sheetData.ritualDifficultiesGeneric = ['varies', 'special'].map((d) => ({
        label: game.i18n.localize(`ZWEI.actor.items.difficultyList.${d}`),
        value: d,
        selected: sheetData.system.difficulty.rating === d,
      }));

      const skillPack = game.packs.get(game.settings.get('zweihander', 'skillPack'));
      sheetData.skills = (await skillPack.getIndex())
        .map((x) => ({
          value: x.name,
          label: x.name,
          selected: sheetData.system.difficulty.associatedSkill === x.name ? 'selected' : '',
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
    }

    if (sheetData.type === 'spell') {
      sheetData.spellDurations = ['instantaneous', 'forever', 'special'].map((d) => ({
        label: game.i18n.localize(`ZWEI.actor.items.durationList.${d}`),
        value: d,
        selected: sheetData.system.duration.value === d,
      }));

      sheetData.governingDurationAttribute = this._prepareGoverningAttributeData(
        sheetData,
        CONFIG.ZWEI.primaryAttributes,
        CONFIG.ZWEI.primaryAttributeBonuses,
        'system.duration.base'
      );
    }

    if (sheetData.type === 'trapping') {
      sheetData.settings.currencies = game.settings.get('zweihander', 'currencySettings');
    }

    if (sheetData.type === 'armor') {
      sheetData.settings.currencies = game.settings.get('zweihander', 'currencySettings');

      const qualities = this._prepareQualities(sheetData);

      sheetData.qualitiesCompendium = qualities.compendium;
      sheetData.qualitiesWorld = qualities.world;
    }

    if (sheetData.type === 'weapon') {
      sheetData.settings.currencies = game.settings.get('zweihander', 'currencySettings');

      const diceTypes = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'];

      sheetData.dice = diceTypes.map((d) => ({
        value: d,
        label: d,
        selected: sheetData.system.damage?.die === d ? 'selected' : '',
      }));

      const skillPack = game.packs.get(game.settings.get('zweihander', 'skillPack'));
      sheetData.skills = (await skillPack.getIndex())
        .map((x) => ({
          value: x.name,
          label: x.name,
          selected: sheetData.system.associatedSkill === x.name ? 'selected' : '',
        }))
        .sort((a, b) => a.label.localeCompare(b.label));

      const qualities = this._prepareQualities(sheetData);

      sheetData.qualitiesCompendium = qualities.compendium;
      sheetData.qualitiesWorld = qualities.world;

      sheetData.governingDamageAttribute = this._prepareGoverningAttributeData(
        sheetData,
        CONFIG.ZWEI.primaryAttributes,
        CONFIG.ZWEI.primaryAttributeBonuses,
        'system.damage.attributeBonus'
      );

      sheetData.governingDistanceAttribute = this._prepareGoverningAttributeData(
        sheetData,
        CONFIG.ZWEI.primaryAttributes,
        CONFIG.ZWEI.primaryAttributeBonuses,
        'system.distance.base'
      );
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

    console.log(sheetData);

    return sheetData;
  }

  _prepareQualities(sheetData) {
    const qualities = {};
    // @todo: localize
    const qualitiesPack = game.packs.get('zweihander.zh-qualities');

    qualities.compendium = Array.from(qualitiesPack.index)
      .map((q) => ({
        value: q.uuid,
        label: q.name,
        selected: sheetData.system.qualities.includes(q.uuid) ? 'selected' : '',
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    qualities.world = game.items
      .filter((i) => i.type === 'quality')
      .map((q) => ({
        value: q.uuid,
        label: q.name,
        selected: sheetData.system.qualities.includes(q.uuid) ? 'selected' : '',
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    return qualities;
  }

  _prepareGoverningAttributeData(sheetData, primaryAttributes, primaryAttributeBonuses, key) {
    return primaryAttributes.reduce((acc, val, idx) => {
      const attributeBonus = '[' + primaryAttributeBonuses[idx] + ']';
      const attributeBonusLabel = val.capitalize() + ' Bonus';

      return acc.concat([
        {
          label: attributeBonusLabel,
          value: attributeBonus,
          selected: getProperty(sheetData, key) === attributeBonus ? 'selected' : '',
        },
      ]);
    }, []);
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
        name: linkedItem?.name,
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

    // @todo: figure out a less hacky way to handle this
    html.find('.editor-edit').click((event) => {
      const toggler = $(event.currentTarget);
      const sheet = toggler.parents('.zweihander.sheet.item');

      const currentTabHeight = html.find('.tab.active').height();

      $(sheet).height(currentTabHeight + 169.67);
    });

    html.find('.profile').click(async (event) => {
      this._onEditImage(event);
    });

    // Show item sheet on right click
    html.find('div[class="tag"]').contextmenu(async (event) => {
      const itemUuid = $(event.currentTarget).data('key');

      if (/^\d+$/.test(itemUuid)) return;

      const item = await fromUuid(itemUuid);

      if (item !== null) item.sheet.render(true);
    });

    // Add new Active Effect (from within the sheet)
    html.find('.add-new').click(async (ev) => {
      let type = ev.currentTarget.dataset.itemType;

      let createdItemArray = [];

      if (type === 'effect') {
        // @todo: refactor to use ActiveEffect.create
        createdItemArray = await this.item.createEmbeddedDocuments('ActiveEffect', [
          {
            label: this.item.name,
            icon: this.item.img,
            origin: (this.item.parent ? `Actor.${this.item.parent.id}.` : '') + 'Item.' + this.item.id,

            // @todo: refactor after transition to DataMode
            system: {
              details: {
                source: this.item.name + ' (' + game.i18n.localize(CONFIG.Item.typeLabels[this.item.type]) + ')',
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

    // @todo: no need for qualities to be here; remove
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

    html.find('.resist-disease').click(this._resistDisease.bind(this));

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

  async _resistDisease() {
    await this.item.roll();
  }

  async _randomizeAncestralTrait() {
    const item = this.item;

    if (item.type !== 'ancestry') return;

    const worldTable = game.tables.find((table) => table.name.includes(item.name));
    const isWorldTableUndefined = typeof worldTable === 'undefined';

    // If Roll Table doesn't exist in World, use Compendium as fallback. Only works for default Ancestries.
    let compendiumTable;

    if (isWorldTableUndefined) {
      const characterCreationPackName = game.settings.get('zweihander', 'characterCreationList');
      const characterCreationPack = game.packs.get(characterCreationPackName);
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
    super._updateObject(event, formData);
  }
}
