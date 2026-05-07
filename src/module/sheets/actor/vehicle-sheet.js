import ZweihanderBaseActorSheet from '../../sheets/actor/base-actor-sheet';

import { selectedChoice, localizePath } from '../../system/utils';

export default class ZweihanderVehicleSheet extends ZweihanderBaseActorSheet {
  static unsupportedItemTypes = new Set([
    'ancestry',
    'profession',
    'skill',
    'uniqueAdvance',
    'talent',
    'armor',
    'ritual',
    'disorder',
    'disease',
    'weapon',
  ]);

  static DEFAULT_OPTIONS = {
    classes: ['vehicle'],
    window: {
      icon: 'fa-solid fa-caravan',
    },
  };

  static PARTS = {
    header: { template: 'systems/zweihander/src/templates/vehicle/header.hbs' },
    details: { template: 'systems/zweihander/src/templates/partials/details-list-npc.hbs' },
    main: {
      template: 'systems/zweihander/src/templates/vehicle/main.hbs',
      scrollable: ['', '.save-scroll', '.sheet-body'],
    },
    encumbrance: { template: 'systems/zweihander/src/templates/vehicle/vehicle-encumbrance-meter.hbs' },
  };

  _initializeApplicationOptions(options) {
    const initialized = super._initializeApplicationOptions(options);

    const compactMode = game.settings.get('zweihander', 'openInCompactMode');

    initialized.position.width = compactMode ? 540 : 625;
    initialized.position.height = compactMode ? 560 : 705;

    return initialized;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    context.choices = {};

    const associatedPrimaryAttribute = context.system.details.associatedPrimaryAttribute;
    context.choices.associatedPrimaryAttribute = selectedChoice(associatedPrimaryAttribute, [
      { value: 'combat', label: 'combat' },
      { value: 'brawn', label: 'brawn' },
      { value: 'agility', label: 'agility' },
      { value: 'perception', label: 'perception' },
      { value: 'intelligence', label: 'intelligence' },
      { value: 'willpower', label: 'willpower' },
      { value: 'fellowship', label: 'fellowship' },
    ]);

    const hidden = this.actor.limited;
    context.details = [
      {
        key: 'details.associatedPrimaryAttribute',
        choices: context.choices.associatedPrimaryAttribute,
      },
      {
        key: 'details.operateSkill',
        placeholder: game.i18n.localize('ZWEI.actor.details.placeholders.operateSkill'),
        hidden,
      },
      {
        key: 'details.horsepower',
        placeholder: game.i18n.localize('ZWEI.actor.details.placeholders.horsepower'),
        hidden,
      },
    ];
    const $$ = (x) => context.itemGroups[x];
    context.itemLists = {
      loot: ['trappings'].map($$),
      qualities: ['qualities'].map($$),
    };

    const actorMap = (x) => context.actorGroups[x];
    context.actorLists = {
      vehicleOccupants: ['drivers', 'passengers'].map(actorMap),
    };

    // console.log(context.actorLists);

    return context;
  }

  async _prepareItems(context) {
    await super._prepareItems(context);
    // set up collections for all item types
    const indexedTypes = [
      'trapping',
      'condition',
      'injury',
      'disease',
      'disorder',
      'profession',
      'ancestry',
      'armor',
      'spell',
      'ritual',
      'talent',
      'trait',
      'drawback',
      'quality',
      'skill',
      'uniqueAdvance',
      'taint',
    ].filter((t) => t === 'skill' || !this.constructor.unsupportedItemTypes.has(t));
    const pluralize = (t) =>
      ({
        injury: 'injuries',
        ancestry: 'ancestry',
        armor: 'armor',
        quality: 'qualities',
      }[t] ?? t + 's');
    indexedTypes.forEach((t) => (context[pluralize(t)] = []));
    context.items
      .filter((i) => indexedTypes.includes(i.type))
      .sort((a, b) => (a.sort || 0) - (b.sort || 0))
      .forEach((i) => context[pluralize(i.type)].push(i));

    return context;
  }

  _getActorGroups(context) {
    return {
      drivers: {
        title: 'drivers',
        summaryTemplate: 'item-summary/vehicleOccupant',
        details: [],
        actors: context.drivers,
        rollType: 'skill-roll',
        rollLabelKey: 'system.details.operateSkill',
      },
      passengers: {
        title: 'passengers',
        summaryTemplate: 'item-summary/vehicleOccupant',
        details: [],
        actors: context.passengers,
      },
    };
  }

  _getItemGroups(context) {
    return {
      trappings: {
        title: 'trappings',
        type: 'trapping',
        summaryTemplate: 'item-summary/trapping',
        details: [
          {
            title: 'category',
            size: 160,
            key: localizePath('system.details.category'),
            filterable: true,
          },
          {
            title: 'qty',
            size: 80,
            key: 'system.quantity',
            isNumerable: true,
          },
          {
            title: 'enc',
            size: 80,
            key: 'system.encumbrance',
            isNumerable: true,
          },
        ],
        items: context.trappings,
      },
      qualities: {
        title: 'qualities',
        type: 'quality',
        summaryTemplate: 'item-summary/quality',
        details: [],
        items: context.qualities,
      },
    };
  }

  async _onRender(options) {
    await super._onRender(options);

    const html = this.element;

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Update the encumbrance meter
    this._updateEncumbranceMeter(html);

    // manual mode
    const manualModeElement = html.querySelector('.manual-mode-button');

    manualModeElement.addEventListener('click', async () => {
      await this.actor.update({
        'system.stats.manualMode': !this.actor.system.stats.manualMode,
      });
    });

    manualModeElement.addEventListener('contextmenu', async () => {
      if (!this.actor.system.stats.manualMode) {
        const sa = this.actor.system.stats.secondaryAttributes;
        const x = 'system.stats.secondaryAttributes';
        await this.actor.update({
          [`${x}.sizeModifier.value`]: sa.sizeModifier.value,
          [`${x}.movement.value`]: sa.movement.value,
          [`${x}.movement.fly`]: sa.movement.fly,
          [`${x}.damageThreshold.value`]: sa.damageThreshold.value,
        });
      }
    });

    // Edit Actor
    html.querySelectorAll('.actor-edit').forEach((el) =>
      el.addEventListener('click', (ev) => {
        const a = ev.currentTarget.closest('.item');

        const actor = fromUuidSync(a.dataset.actorUuid);

        actor.sheet.render(true);
      })
    );

    const updateOccupants = async (vehicle, actorUuid, action) => {
      const vehicleOccupants = vehicle.getFlag('zweihander', 'vehicleOccupants');
      const { drivers, passengers } = vehicleOccupants;

      switch (action) {
        case 'promote': {
          const target = passengers.find((p) => p.uuid === actorUuid);

          target.isDriver = true;
          drivers.push(target);
          passengers.splice(passengers.indexOf(target), 1);

          break;
        }
        case 'demote': {
          const target = drivers.find((p) => p.uuid === actorUuid);

          target.isDriver = false;
          passengers.push(target);
          drivers.splice(drivers.indexOf(target), 1);

          break;
        }
        case 'delete': {
          const toDeleteDriver = drivers.find((p) => p.uuid === actorUuid);

          if (toDeleteDriver) {
            drivers.splice(drivers.indexOf(toDeleteDriver), 1);
          } else {
            const toDeletePassanger = passengers.find((p) => p.uuid === actorUuid);
            passengers.splice(passengers.indexOf(toDeletePassanger), 1);
          }
          break;
        }
      }

      await vehicle.setFlag('zweihander', 'vehicleOccupants', { ...vehicleOccupants, drivers, passengers });
    };

    ['promote', 'demote', 'delete'].forEach((action) => {
      html.querySelectorAll(`.actor-${action}`).forEach((el) =>
        el.addEventListener('click', async (ev) => {
          const actorUuid = ev.currentTarget.closest('.item').dataset.actorUuid;
          await updateOccupants(this.actor, actorUuid, action);
        })
      );
    });
  }

  _updateEncumbranceMeter(html) {
    const encumbranceData = this.actor.system.stats.secondaryAttributes.encumbranceLimit;
    const currentEncumbrance = encumbranceData.current;
    const totalEncumbrance = encumbranceData.value;
    let ratio = (currentEncumbrance / totalEncumbrance) * 100;
    if (ratio > 100) {
      ratio = 100;
      html.querySelector('.encumbrance-bar-container').classList.add('encumbrance-overage');
    }
    html.querySelector('.encumbrance-bar').style.width = ratio + '%';
  }

  async _onDropActor(event, data) {
    const vehicle = this.actor;
    const uuid = data.uuid;

    const vehicleOccupants = await vehicle.getFlag('zweihander', 'vehicleOccupants');

    // add everyone as passenger by default; driver logic handled elsewhere
    if (!vehicleOccupants.passengers.includes(uuid) && !vehicleOccupants.drivers.includes(uuid)) {
      const actor = fromUuidSync(uuid);
      const actorData = actor.toObject(false);

      if (actor.type === 'vehicle') {
        ui.notifications.error("An Actor of type 'vehicle' cannot be a passenger in a vehicle.");
        return;
      }

      vehicleOccupants.passengers.push({
        name: actorData.name,
        img: actorData.img,
        uuid: uuid,
        system: actorData.system,
        isDriver: false,
      });
    } else {
      ui.notifications.warn(game.i18n.format('ZWEI.othermessages.actoralready', { actor: actor.name }));
    }

    await vehicle.setFlag('zweihander', 'vehicleOccupants', {
      drivers: vehicleOccupants.drivers,
      passengers: vehicleOccupants.passengers,
    });

    await super._onDropActor(event, data);
  }
}
