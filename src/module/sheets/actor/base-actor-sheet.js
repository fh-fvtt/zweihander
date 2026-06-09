import * as ZweihanderDice from '../../system/rolls/dice';
import * as ZweihanderUtils from '../../system/utils';

import ZweihanderLanguageConfig from '../../apps/language-config';
import ZweihanderActorConfig from '../../apps/actor-config';
import ZweihanderActiveEffect from '../../documents/effects/active-effect';

const { DialogV2, HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;
const { getProperty, mergeObject } = foundry.utils;

export default class ZweihanderBaseActorSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ['zweihander', 'sheet', 'actor', 'damage-tracker'],
    window: {
      resizable: true,
    },
    form: {
      submitOnChange: true,
      submitOnClose: true,
    },
    actions: {
      toggleCompactMode: ZweihanderBaseActorSheet.#toggleCompactMode,
      renderLanguageApplication: ZweihanderBaseActorSheet.#renderLanguageApplication,
      itemEdit: ZweihanderBaseActorSheet.#itemEdit,
      itemDelete: ZweihanderBaseActorSheet.#itemDelete,
    },
  };

  #languageConfig;
  #actorConfig;
  sortCriteria = {};
  filterCriteria = {};

  constructor(...args) {
    super(...args);
    this.#languageConfig = new ZweihanderLanguageConfig({ document: this.actor });
    this.#actorConfig = new ZweihanderActorConfig({ document: this.actor });
  }

  _preSyncPartState(partId, newElement, priorElement, state) {
    state.toggleStateIds = Array.from(priorElement.querySelectorAll('.save-toggle.open')).map(
      (el) => el.parentNode.dataset.itemId
    );

    super._preSyncPartState(partId, newElement, priorElement, state);

    for (const id of state.toggleStateIds) {
      const element = newElement.querySelector(`[data-item-id="${id}"] .save-toggle`);
      if (element) element.classList.add('open');
    }
  }

  async _prepareContext(options) {
    const sheetData = await super._prepareContext(options);

    // Basic data
    let isOwner = this.actor.isOwner;
    const zweihanderContext = {
      owner: isOwner,
      limited: this.actor.limited,
      options: this.options,
      editable: this.isEditable,
      cssClass: isOwner ? 'editable' : 'locked',
      isCharacter: this.actor.type === 'character',
      isNPC: this.actor.type === 'npc',
      isCreature: this.actor.type === 'creature',
      isVehicle: this.actor.type === 'vehicle',
      config: CONFIG.ZWEI,
      rollData: this.actor.getRollData.bind(this.actor),
      effects: [],
      settings: {},
    };

    mergeObject(sheetData, zweihanderContext);

    // The Actor's data
    const actor = this.actor;
    sheetData.actor = actor;
    sheetData.system = this.actor.system;

    // Owned Items
    sheetData.items = Array.from(actor.items);
    sheetData.items.sort((a, b) => (a.sort || 0) - (b.sort || 0));

    // Prepare owned items
    await this._prepareItems(sheetData);

    // Effects
    sheetData.effects = actor.effects; // comes *after* Owned Items, as Active Effects are their own thing

    const itemGroups = this._processGroups(this._getItemGroups(sheetData), this.sortCriteria);
    sheetData.itemGroups = ZweihanderUtils.assignPacks(this.actor.type, itemGroups);

    // Return data to the sheet
    return sheetData;
  }

  async _prepareItems(sheetData) {
    return this._prepareItemsDisplay(sheetData);
  }

  async _prepareItemsDisplay(sheetData) {
    await Promise.all(
      sheetData.items.map(async (item) => {
        item.html = {};
        if (item.system.description) {
          item.html.description = await ZweihanderUtils.enrichLocalized(item.system.description);
        }
        if (item.system.notes) {
          item.html.notes = await ZweihanderUtils.enrichLocalized(item.system.notes);
        }
        if (item.system.rules) {
          item.html.rules = await ZweihanderUtils.processRules(item.system);
        }
        return item;
      })
    );
    return sheetData;
  }

  _getActorGroups() {}

  _getItemGroups() {
    return {};
  }

  _processGroups(itemGroups, sortCriteria) {
    const sort = (itemGroup, criteria) =>
      itemGroup.entries.sort((a, b) => {
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
      (itemGroup.entries = itemGroup.entries.filter((i) => {
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
    for (let [k, v] of Object.entries(sortCriteria)) {
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

  async _onDropItem(event, item) {
    // Check to make sure items of this type are allowed on this actor
    if (this.constructor.unsupportedItemTypes.has(item.type)) {
      return ui.notifications.warn(
        game.i18n.format('ZWEI.actorwarninginvaliditem', {
          itemType: game.i18n.localize(CONFIG.Item.typeLabels[item.type]),
          actorType: game.i18n.localize(CONFIG.Actor.typeLabels[this.actor.type]),
        })
      );
    }
    // Create the owned item as normal
    return await super._onDropItem(event, item);
  }

  async _renderFrame(options) {
    const frame = await super._renderFrame(options);
    const defaultToCompact = game.settings.get('zweihander', 'openInCompactMode');

    const buttons = [
      ZweihanderUtils.constructHTMLButton({
        label: '',
        classes: [
          'header-control',
          'icon',
          'fa-solid',
          `fa-${defaultToCompact && this.actor.type !== 'character' ? 'expand' : 'compress'}`,
        ],
        dataset: { action: 'toggleCompactMode', tooltip: game.i18n.localize('ZWEI.settings.togglecompact') },
      }),
    ];

    this.window.controls.after(...buttons);

    return frame;
  }

  static #toggleCompactMode(event, target) {
    const sheet = target.closest('.sheet');
    sheet.classList.toggle('zweihander-compact-sheet');

    target.classList.toggle('fa-compress');
    target.classList.toggle('fa-expand');

    this.render();

    // @todo: persist toggled state for a given Actor
  }

  static async #itemEdit(event, target) {
    const container = target.closest('.item');
    const item = this.actor.items.get(container.dataset.itemId);
    await item.sheet.render(true);
  }

  static async #itemDelete(event, target) {
    const container = target.closest('.item');
    const item = this.actor.items.get(container.dataset.itemId);
    const type = game.i18n.localize(CONFIG.Item.typeLabels[item.type]);

    await DialogV2.confirm({
      window: { title: game.i18n.format('ZWEI.othermessages.deleteembedded', { type: type, name: item.name }) },
      content: game.i18n.format('ZWEI.othermessages.suretype', { type: type }),
      yes: {
        callback: async () => {
          await item.delete();
        },
      },
      no: { callback: () => {} },
      position: { width: 455 },
      rejectClose: false,
      defaultYes: true,
    });
  }

  /**
   * @this {ZweihanderBaseActorSheet}
   */
  static #renderLanguageApplication(event, target) {
    this.#languageConfig.render(true);
  }

  _getItemListContextOptions() {
    return [
      {
        label: game.i18n.localize('ZWEI.actor.items.edit'),
        icon: 'fas fa-pencil-alt',
        onClick: async (event, target) => {
          const container = target.closest('.item');
          const item = this.actor.items.get(container.dataset.itemId);
          await item.sheet.render(true);
        },
      },
      {
        label: game.i18n.localize('ZWEI.actor.items.duplicate'),
        icon: 'fas fa-clone',
        onClick: async (event, target) => {
          const actor = this.actor;
          const container = target.closest('.item');
          const item = actor.items.get(container.dataset.itemId);
          const duplicate = await Item.create({ ...item }, { parent: actor });
          if (duplicate) await duplicate.sheet.render(true);
        },
      },
      {
        label: game.i18n.localize('ZWEI.actor.items.postchat'),
        icon: 'fas fa-message',
        onClick: async (event, target) => {
          const container = target.closest('.item');
          const item = this.actor.items.get(container.dataset.itemId);

          if (item.type === 'weapon' || item.type === 'armor') {
            item.system.qualities = await item.system.getQualitiesData();
          }

          let htmlContent;

          try {
            htmlContent = await renderTemplate(
              `systems/zweihander/src/templates/item-card/item-card-${item.type}.hbs`,
              item
            );
          } catch (e) {
            htmlContent = await renderTemplate(
              `systems/zweihander/src/templates/item-card/item-card-fallback.hbs`,
              item
            );
          }

          await ChatMessage.create({ content: htmlContent });
        },
      },
      {
        label: game.i18n.localize('ZWEI.actor.items.delete'),
        icon: 'fas fa-trash-alt',
        onClick: async (event, target) => {
          const container = target.closest('.item');
          const item = this.actor.items.get(container.dataset.itemId);
          const type = game.i18n.localize(CONFIG.Item.typeLabels[item.type]);

          // prevent deletion of Professions out of order
          if (item.type === 'profession') {
            const currentTier = item.parent.items.filter((i) => i.type === 'profession').length;
            const tiersInversed = ZweihanderUtils.getLocalizedTierMapping();
            const itemTier = tiersInversed[item.system.tier];

            if (itemTier < currentTier) {
              ui.notifications.error(game.i18n.format('ZWEI.othermessages.errortierdelete', { name: item.name }));
              return;
            }
          }

          await DialogV2.confirm({
            window: { title: game.i18n.format('ZWEI.othermessages.deleteembedded', { type: type, name: item.name }) },
            content: game.i18n.format('ZWEI.othermessages.suretype', { type: type }),
            yes: {
              callback: async () => {
                if (item.type !== 'ancestry') await ZweihanderUtils.slideUpOnDelete(container, 200);
                await item.delete();
              },
            },
            no: { callback: () => {} },
            position: { width: 455 },
            rejectClose: false,
            defaultYes: true,
          });
        },
      },
    ];
  }

  _getEffectListContextOptions() {
    return [
      {
        label: game.i18n.localize('ZWEI.actor.items.edit'),
        icon: 'fas fa-pencil-alt',
        onClick: async (event, target) => {
          const container = target.closest('.item');
          const { itemId, parentId } = container.dataset;

          const effect = this._getEmbeddedEffect(parentId, itemId);

          effect.sheet.render(true);
        },
      },
      {
        label: game.i18n.localize('ZWEI.actor.items.clearexpired'),
        icon: 'fas fa-clock-rotate-left',
        visible: (target) => {
          const container = target.closest('.item');
          const { itemId, parentId } = container.dataset;

          const effect = this._getEmbeddedEffect(parentId, itemId);

          return effect.duration.expired;
        },
        onClick: async (event, target) => {
          const container = target.closest('.item');
          const { itemId, parentId } = container.dataset;

          const effect = this._getEmbeddedEffect(parentId, itemId);

          await effect.update({
            start: ZweihanderActiveEffect.getEffectStart(),
            disabled: false,
            'duration.expired': false,
          });
        },
      },
      {
        label: game.i18n.localize('ZWEI.actor.items.delete'),
        icon: 'fas fa-trash-alt',
        onClick: async (event, target) => {
          const container = target.closest('.item');
          const { itemId, parentId } = container.dataset;

          const effect = this._getEmbeddedEffect(parentId, itemId);
          const type = game.i18n.localize('TYPES.ActiveEffect.Base');

          await DialogV2.confirm({
            window: { title: game.i18n.format('ZWEI.othermessages.deletetype', { type: type, label: effect.name }) },
            content: game.i18n.format('ZWEI.othermessages.suretype', { type: type }),
            yes: {
              callback: async () => {
                await ZweihanderUtils.slideUpOnDelete(container, 200);
                await effect.delete();
              },
            },
            no: { callback: () => {} },
            position: { width: 455 },
            rejectClose: false,
            defaultYes: true,
          });
        },
      },
    ];
  }

  /** @override */
  async _onFirstRender(context, options) {
    await super._onFirstRender(context, options);

    this._createContextMenu(this._getItemListContextOptions, '.item-list .item.item-entry', { fixed: true });
    //this._createContextMenu(this._getItemListContextOptions, '.skills-container .skills-list', { fixed: true });
    this._createContextMenu(this._getItemListContextOptions, '.item-options', { eventName: 'click', fixed: true });

    this._createContextMenu(this._getEffectListContextOptions, '.item-list .item.effect-entry', { fixed: true });
    this._createContextMenu(this._getEffectListContextOptions, '.effect-options', { eventName: 'click', fixed: true });
  }

  async _onRender(context, options) {
    await super._onRender(context, options);

    const html = this.element;

    this._applyDamageDecals(html);
    this._applyPerilDecals(html);

    /*
    html.querySelectorAll('.modded-value-indicator').forEach((el) => {
      el.addEventListener('mouseenter', (event) => {
        const source = event.currentTarget.querySelector('.modded-value-tooltip');
        const tooltip = source.cloneNode(true);

        const rect = event.currentTarget.getBoundingClientRect();
        const top = rect.top + window.scrollY + 25;
        const left = rect.left + window.scrollX - 110 / 2 + 8;

        tooltip.classList.add('zh-modded-value-tooltip-instance');

        tooltip.style.position = 'absolute';
        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;

        document.body.appendChild(tooltip);
      });

      el.addEventListener('mouseleave', () => {
        document.querySelectorAll('.zh-modded-value-tooltip-instance').forEach((t) => t.remove());
      });
    });
    */

    // auto size the details inputs once
    const autoSizeInput = (el) =>
      el.setAttribute('size', Math.max(el.getAttribute('placeholder').length, el.value.length));
    const inputsToAutoSize = Array.from(html.querySelectorAll('input.auto-size'));
    inputsToAutoSize.forEach(autoSizeInput);

    html.querySelectorAll('.show-filter').forEach((el) => {
      el.addEventListener('click', (event) => {
        event.stopPropagation();

        const container = event.currentTarget.closest('.filterable');
        const { itemGroup, detail: detailStr } = container.dataset;
        const detail = Number.parseInt(detailStr);

        ZweihanderUtils.getCriterion(this.filterCriteria, itemGroup, detail).active = true;

        const filterInput = container.querySelector('.filter-input');
        filterInput.classList.add('filter-input-active');
        filterInput.querySelector('input').focus();
      });
    });

    html.querySelectorAll('.hide-filter').forEach((el) => {
      el.addEventListener('click', (event) => {
        event.stopPropagation();

        const container = event.currentTarget.closest('.filterable');
        const { itemGroup, detail: detailStr } = container.dataset;
        const detail = Number.parseInt(detailStr);

        event.currentTarget.closest('.filter-input').classList.remove('filter-input-active');
        ZweihanderUtils.getCriterion(this.filterCriteria, itemGroup, detail).active = false;
      });
    });

    html
      .querySelectorAll('.filter-input input')
      .forEach((el) => el.addEventListener('click', (event) => event.stopPropagation()));

    html.querySelectorAll('.filter-input input').forEach((el) => {
      el.addEventListener('keydown', async (event) => {
        event.stopPropagation();

        const container = event.currentTarget.closest('.filterable');
        const { itemGroup, detail: detailStr } = container.dataset;
        const detail = Number.parseInt(detailStr);

        if (event.key === 'Escape') {
          event.currentTarget.parentElement.classList.remove('filter-input-active');
          ZweihanderUtils.getCriterion(this.filterCriteria, itemGroup, detail).active = false;
        } else if (event.key === 'Enter') {
          const criterion = ZweihanderUtils.getCriterion(this.filterCriteria, itemGroup, detail);
          criterion.value = event.currentTarget.value;
          if (criterion.value.trim() === '') {
            event.currentTarget.parentElement.classList.remove('filter-input-active');
            criterion.active = false;
          }
          await this.render();
        }
      });
    });

    html.querySelectorAll('.sortable').forEach((el) => {
      el.addEventListener('click', async (event) => {
        event.stopPropagation();

        const { itemGroup, detail: detailStr } = event.currentTarget.dataset;
        const detail = Number.parseInt(detailStr);
        const criterion = ZweihanderUtils.getCriterion(this.sortCriteria, itemGroup, detail);

        if (!criterion.sort) {
          criterion.sort = 1;
        } else if (criterion.sort === 1) {
          criterion.sort = -1;
        } else if (criterion.sort === -1) {
          criterion.sort = 0;
          const ig = this.sortCriteria[itemGroup];
          ig.splice(ig.indexOf(criterion), 1);
        }

        await this.render();
      });
    });

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // auto size the details inputs on change
    inputsToAutoSize.forEach((el) => el.addEventListener('input', (event) => autoSizeInput(event.currentTarget)));

    const actor = this.actor;

    html.querySelectorAll('.skill').forEach((el) => {
      el.addEventListener('mouseenter', async (event) => {
        const target = 'li.pa.pa-' + event.currentTarget.dataset.associatedPa.toLowerCase();
        document.querySelectorAll(target).forEach((el) => el.classList.add('pa-hover-helper'));
      });

      el.addEventListener('mouseleave', async (event) => {
        const target = 'li.pa.pa-' + event.currentTarget.dataset.associatedPa.toLowerCase();
        document.querySelectorAll(target).forEach((el) => el.classList.remove('pa-hover-helper'));
      });
    });

    // Add new Item (from within the sheet)
    html.querySelectorAll('.add-new').forEach((el) =>
      el.addEventListener('click', async (event) => {
        const type = event.currentTarget.dataset.itemType;

        let created;

        if (type !== 'effect') {
          created = await Item.create({ type: type, name: type }, { parent: actor });
        } else {
          created = await ActiveEffect.create(
            {
              name: 'New Effect',
              img: 'systems/zweihander/assets/icons/dice-fire.svg',
              origin: 'Actor.' + this.actor.id,
              system: {
                details: {
                  source: _loc('TYPES.Item.manual'),
                },
              },
            },
            { parent: actor }
          );
        }

        if (created) await created.sheet.render(true);
      })
    );

    html.querySelectorAll('.add-new').forEach((el) =>
      el.addEventListener('contextmenu', async (event) => {
        const packIds = event.currentTarget.dataset.openPacks?.split?.(',')?.filter?.((x) => x);
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
            position: {
              top: actor.sheet.position.top,
              left: actor.sheet.position.left + (i % 2 == 0 ? -400 : actor.sheet.position.width + 50),
            },
          })
        );
      })
    );

    // Handle formulas for display
    html.querySelectorAll('.inject-data').forEach(async (el) => {
      el.textContent = await ZweihanderUtils.parseDataPaths(el.textContent.trim(), actor);
    });

    html.querySelectorAll('.inject-data-disease').forEach((el) => {
      el.textContent = ZweihanderUtils.getDifficultyRatingLabel(el.textContent.trim());
    });

    html.querySelectorAll('.inline-roll').forEach(async (el) => {
      const formula = el.textContent.trim().split('+');
      const diceRoll = formula[0];
      const dataPath = formula[1];

      if (dataPath && dataPath.includes('@'))
        el.innerHTML =
          '<i class="fas fa-dice-d20"></i> ' + diceRoll + '+' + (await ZweihanderUtils.parseDataPaths(dataPath, actor));
    });

    // "Link" checkboxes on character sheet and item sheet so both have the same state
    html.querySelectorAll('.link-checkbox').forEach((el) =>
      el.addEventListener('click', async (event) => {
        event.preventDefault();
        const checkbox = event.currentTarget;
        const item = this.actor.items.get(checkbox.dataset.itemId);
        const key = checkbox.dataset.key;

        await item.update({ [key]: checkbox.checked });
      })
    );

    // "Link" checkboxes on character sheet and active effect sheet so both have the same state
    html.querySelectorAll('.link-effect-checkbox').forEach((el) =>
      el.addEventListener('click', async (event) => {
        event.preventDefault();
        const checkbox = event.currentTarget;
        const effectId = checkbox.dataset.itemId;
        const parentId = checkbox.dataset.parentId;
        const effect = this._getEmbeddedEffect(parentId, effectId);
        const key = checkbox.dataset.key;

        await effect.update({ [key]: !checkbox.checked });
      })
    );

    html.querySelectorAll('.profession-checkbox').forEach((el) =>
      el.addEventListener('click', async (event) => {
        event.preventDefault();
        const checkbox = event.currentTarget;
        const item = this.actor.items.get(checkbox.dataset.itemId);
        if (!checkbox.checked && item.system.tier !== item.actor.system.tier) {
          ui.notifications.error(game.i18n.localize('ZWEI.othermessages.errorreset'));
          return;
        }
        await DialogV2.confirm({
          window: {
            title: !checkbox.checked
              ? game.i18n.format('ZWEI.othermessages.resetprogress', { name: item.name })
              : game.i18n.format('ZWEI.othermessages.completeprogress', { name: item.name }),
          },
          content: !checkbox.checked
            ? game.i18n.localize('ZWEI.othermessages.reallyresetprogress')
            : game.i18n.localize('ZWEI.othermessages.purchaseall'),
          yes: { callback: () => item.system.toggleProfessionPurchases(!checkbox.checked) },
          position: { width: 455 },
          rejectClose: false,
          defaultYes: false,
        });
      })
    );

    // Show item sheet on right click
    /*html.querySelectorAll('.fetch-item').forEach((el) =>
      el.addEventListener('contextmenu', async (event) => {
        const itemId = event.currentTarget.parentElement.dataset.itemId ?? event.currentTarget.dataset.itemId;
        const item = this.actor.items.get(itemId);

        await item.sheet.render(true);
      })
    );

    // Show effect sheet on right click
    html.querySelectorAll('.fetch-effect').forEach((el) =>
      el.addEventListener('contextmenu', async (event) => {
        const itemId = event.currentTarget.parentElement.dataset.itemId ?? event.currentTarget.dataset.itemId;
        const parentId = event.currentTarget.parentElement.dataset.parentId ?? event.currentTarget.dataset.parentId;
        const effect = this._getEmbeddedEffect(parentId, itemId);

        await effect.sheet.render(true);
      })
    );*/

    // Show item sheet on right click
    html.querySelectorAll('.fetch-skill').forEach((el) =>
      el.addEventListener('contextmenu', async (event) => {
        const actor = this.actor;

        if (actor.type !== 'character') return;

        const itemId = event.currentTarget.parentElement.dataset.itemId ?? event.currentTarget.dataset.itemId;
        const item = this.actor.items.get(itemId);

        await item.sheet.render(true);
      })
    );

    // Show extra item information on click
    html
      .querySelectorAll('.js-show-item-description')
      .forEach((el) => el.addEventListener('click', (event) => this._showItemDescription(event)));

    // Roll Skill
    html.querySelectorAll('.skill-roll').forEach((el) =>
      el.addEventListener('click', (event) => {
        this._onRollSkill(event, CONFIG.ZWEI.testTypes.skill);
      })
    );

    // Roll Weapon
    html.querySelectorAll('.weapon-roll').forEach((el) =>
      el.addEventListener('click', (event) => {
        this._onRollSkill(event, CONFIG.ZWEI.testTypes.weapon);
      })
    );

    // Roll Spell
    html.querySelectorAll('.spell-roll').forEach((el) =>
      el.addEventListener('click', (event) => {
        this._onRollSkill(event, CONFIG.ZWEI.testTypes.spell);
      })
    );

    // Roll Dodge
    html.querySelectorAll('.dodge-roll').forEach((el) =>
      el.addEventListener('click', (event) => {
        this._onRollSkill(event, CONFIG.ZWEI.testTypes.dodge);
      })
    );

    // Roll Parry
    html.querySelectorAll('.parry-roll').forEach((el) =>
      el.addEventListener('click', (event) => {
        this._onRollSkill(event, CONFIG.ZWEI.testTypes.parry);
      })
    );

    // Roll Madness
    html.querySelectorAll('.madness-roll').forEach((el) =>
      el.addEventListener('click', (event) => {
        this._onRollSkill(event, CONFIG.ZWEI.testTypes.madness);
      })
    );

    html.querySelectorAll('.js-display-quality').forEach((el) =>
      el.addEventListener('click', async (event) => {
        event.preventDefault();

        const itemId = event.currentTarget.dataset.itemId;
        const quality = await fromUuid(itemId);

        await quality.sheet.render(true);
      })
    );

    html.querySelector('.open-language-config')?.addEventListener('click', async () => {
      await this.#languageConfig.render(true);
    });

    // Modify numerable value by clicking '+' and '-' buttons on sheet, e.g. quantity, encumbrance
    const updateNumerable = (i) => async (event) => {
      const lookup = (obj, key) => {
        const keys = key.split('.');
        let val = obj;
        for (let key of keys) {
          val = val?.[key];
        }
        return val;
      };

      const numerablePath = event.currentTarget.dataset.numerablePath;

      const itemElement = $(event.currentTarget).parents('.item');
      const item = this.actor.items.get($(itemElement).data('itemId'));

      const newNumerableValue = lookup(item, numerablePath) + i;

      await item.update({
        [`${numerablePath}`]: newNumerableValue >= 0 ? newNumerableValue : 0,
      });
    };

    html
      .querySelectorAll('.numerable-field-subtract')
      .forEach((el) => el.addEventListener('click', updateNumerable(-1)));
    html.querySelectorAll('.numerable-field-add').forEach((el) => el.addEventListener('click', updateNumerable(1)));
  }

  _getEmbeddedEffect(parentId, itemId) {
    // If IDs match, Actor is the parent
    if (parentId === this.actor._id) {
      return this.actor.effects.get(itemId);
    } else {
      const parent = this.actor.items.get(parentId);
      return parent.effects.get(itemId);
    }
  }

  _applyDamageDecals(sheetElement) {
    const damage = Number(this.actor.system.stats.secondaryAttributes.damageCurrent.value);
    for (let i = 0; i <= 4; i++) {
      if (damage <= i) {
        sheetElement.classList.add(`damage-tracker-${i}`);
      } else {
        sheetElement.classList.remove(`damage-tracker-${i}`);
      }
    }
  }

  _applyPerilDecals(sheetElement) {
    const actor = this.actor;

    if (actor.type === 'vehicle') return;

    const peril = Number(actor.system.stats.secondaryAttributes.perilCurrent.value);
    const profileImg = sheetElement.querySelector('.peril-tracker');
    for (let i = peril; i <= 4; i++) {
      profileImg.classList.add(`peril-tracker-${i}`);
    }
  }

  _registerDimensionChangeListener(el, cb) {
    // this magic changes the pattern of the skills list when it resizes beyond the column breakpoint.
    // sadly, this is currently not possible with pure css.
    const iframe = document.createElement('iframe');
    iframe.classList.add('dimension-change-listener');
    iframe.setAttribute('tabindex', '-1');

    el.prepend(iframe);

    iframe.contentWindow.addEventListener('resize', cb);
    cb.bind(iframe.contentWindow)();
  }

  _getDimensionBreakpointsCallback(dimension, breakpoints) {
    let y = -1;
    return function () {
      const x = this[dimension];
      for (let [i, bp] of breakpoints.entries()) {
        const lastAt = i === 0 ? 0 : breakpoints[i - 1].at;
        const nextAt = i === breakpoints.length - 1 ? Number.POSITIVE_INFINITY : breakpoints[i + 1].at;
        if (x > lastAt && x < nextAt && (y === -1 || (y > lastAt && y < nextAt))) {
          if (x >= bp.at && y < bp.at) {
            bp.callback(true);
          } else if (x < bp.at && y >= bp.at) {
            bp.callback(false);
          }
        }
      }
      y = x;
    };
  }

  async _onRollSkill(event, testType) {
    event.stopImmediatePropagation();
    event.stopPropagation();
    event.preventDefault();

    const element = event.currentTarget;
    const skill = element.dataset.label;
    const skillItem = this.actor.items.find(
      (item) => item.type === 'skill' && ZweihanderUtils.normalizedEquals(item.name, skill)
    );

    if (skillItem) {
      const additionalConfiguration = {};
      if (testType === 'weapon' || testType === 'spell') {
        additionalConfiguration[`${testType}Id`] = element.closest('.item').dataset.itemId;
      }
      await ZweihanderDice.rollTest(skillItem, testType, additionalConfiguration, {
        showDialog: true,
      });
    } else {
      ui.notifications.error(game.i18n.format('ZWEI.othermessages.noskillexists', { skill: skill }));
    }
  }

  _showItemDescription(event) {
    const container = event.currentTarget.closest('.item');
    const description = container.querySelector('.item-summary');

    ZweihanderUtils.slideToggle(description, 200).then(() => {}); //description.classList.toggle('open'));
  }

  _getHeaderControls() {
    const buttons = super._getHeaderControls();

    if (this.isEditable && (game.user.isGM || this.actor.isOwner)) {
      buttons.splice(0, 0, {
        label: game.i18n.localize('ZWEI.settings.configactor'),
        icon: 'fas fa-user-cog',
        visible: true,
        onClick: () => this.#actorConfig.render(true),
      });
    }

    return buttons;
  }

  async close(options) {
    const isActorConfigRendered = this.#actorConfig.rendered;
    const isLanguageConfigRendered = this.#languageConfig.rendered;

    if (isActorConfigRendered) this.#actorConfig.close();
    if (isLanguageConfigRendered) this.#languageConfig.close();

    await super.close(options);
  }

  get title() {
    const isSyntheticActor = this.token;
    return isSyntheticActor ? super.title + ' [Token]' : super.title;
  }
}
