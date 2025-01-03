import ZweihanderPC from './entity/pc';
import ZweihanderNPC from './entity/npc';
import ZweihanderCreature from './entity/creature';
import ZweihanderVehicle from './entity/vehicle';

import { ZWEI } from '../config';

export default class ZweihanderActor extends Actor {
  static types = {
    character: new ZweihanderPC(),
    npc: new ZweihanderNPC(),
    creature: new ZweihanderCreature(),
    vehicle: new ZweihanderVehicle(),
  };

  constructor(...args) {
    super(...args);

    Hooks.on('updateActor', (actor, changed) => this.#updateOccupantsData(actor, changed));
  }

  // @todo: refactor this after getting rid of the entire 'dispatch' system
  async #updateOccupantsData(actor, changed) {
    if (this.type !== 'vehicle') return;

    // console.log(changed);

    const vehicleOccupants = this.getFlag('zweihander', 'vehicleOccupants');
    const drivers = vehicleOccupants.drivers;
    const passengers = vehicleOccupants.passengers;

    const foundDriver = drivers.find((d) => d.uuid === actor.uuid);

    const foundPassenger = passengers.find((d) => d.uuid === actor.uuid);

    if (!foundDriver && !foundPassenger) return;

    if (foundDriver) {
      drivers[drivers.indexOf(foundDriver)] = {
        name: actor.name,
        img: actor.img,
        uuid: actor.uuid,
        system: actor.system,
        isDriver: true,
      };
    } else if (foundPassenger) {
      passengers[passengers.indexOf(foundPassenger)] = {
        name: actor.name,
        img: actor.img,
        uuid: actor.uuid,
        system: actor.system,
        isDriver: false,
      };
    }

    const newVehicleOccupants = {
      drivers: drivers,
      passengers: passengers,
    };

    await this.setFlag('zweihander', 'vehicleOccupants', newVehicleOccupants);
  }

  // convention: dispatch is async when the function it calls is
  dispatch(fnName, cfg = { orElse: { value: {}, async: false }, args: [] }) {
    // console.log(`${this.name}: dispatch: ${fnName}`);
    if (ZweihanderActor.types[this.type]) {
      const type = ZweihanderActor.types[this.type];
      if (type[fnName] && typeof type[fnName] === 'function') {
        if (cfg?.args?.length) {
          return type[fnName](...cfg.args, this);
        } else {
          return type[fnName](this, this);
        }
      }
    }
    if (cfg?.orElse?.async) {
      return Promise.resolve(cfg?.orElse?.value);
    } else {
      return cfg?.orElse?.value;
    }
  }

  prepareData() {
    super.prepareData();
  }

  prepareBaseData() {
    super.prepareBaseData();
    this.dispatch('prepareBaseData');
  }

  prepareEmbeddedDocuments(...args) {
    if (super.prepareEmbeddedDocuments) super.prepareEmbeddedDocuments();
    this.dispatch('prepareEmbeddedDocuments');
  }

  prepareEmbeddedEntities() {
    if (super.prepareEmbeddedEntities) super.prepareEmbeddedEntities();
    this.dispatch('prepareEmbeddedEntities');
  }

  applyActiveEffects() {
    // super.applyActiveEffects();
    this.dispatch('applyActiveEffects', {
      args: [this, 'initial'], // when Foundry first calls applyActiveEffects(), we want to defer certain applications to later
    });
  }

  prepareDerivedData() {
    super.prepareDerivedData();
    this.dispatch('prepareDerivedData');
  }

  getRollData() {
    return this.dispatch('getRollData', {
      args: [this.system],
      orElse: { value: this.system },
    });
  }

  async _preCreate(data, options, user) {
    await super._preCreate(data, options, user);
    if (!this.img || ZWEI.replacedDefaultCoreIcons.includes(this.img)) {
      const img = ZWEI.defaultActorIcons[this.type] ?? ZWEI.defaultActorIcons._default;
      await this.updateSource({ img });
    }
    return await this.dispatch('_preCreate', { args: [this, options, user] });
  }

  async _preUpdate(changed, options, user) {
    await super._preUpdate(changed, options, user);
    return await this.dispatch('_preUpdate', { args: [changed, options, user, this] });
  }

  async _onCreate(data, options, user) {
    await super._onCreate(data, options, user);
    // TODO: user is an incorrect parameter and will be fixed in future versions
    if (user !== game.user.id) return;
    await this.dispatch('_onCreate', { args: [data, options, user] });
  }

  async createEmbeddedDocuments(embeddedName, data, context = {}) {
    const enrichedData = await this.dispatch('createEmbeddedDocuments', {
      args: [embeddedName, data, context],
      orElse: { value: data, async: true },
    });
    if (enrichedData) {
      return super.createEmbeddedDocuments(embeddedName, enrichedData, context);
    }
  }

  async updateEmbeddedDocuments(embeddedName, updates, context = {}) {
    const enrichedUpdates = await this.dispatch('updateEmbeddedDocuments', {
      args: [embeddedName, updates, context],
      orElse: { value: updates, async: true },
    });
    if (enrichedUpdates) {
      return super.updateEmbeddedDocuments(embeddedName, enrichedUpdates, context);
    }
  }

  async deleteEmbeddedDocuments(embeddedName, ids, context = {}) {
    await this.dispatch('deleteEmbeddedDocuments', {
      args: [embeddedName, ids, context],
    });
    return super.deleteEmbeddedDocuments(embeddedName, ids, context);
  }

  /* -------------------------------------------- */

  _preCreateDescendantDocuments(embeddedName, result, options, userId) {
    super._preCreateDescendantDocuments(embeddedName, result, options, userId);
    if (userId === game.user.id)
      this.dispatch('_preCreateDescendantDocuments', {
        args: [embeddedName, result, options, userId],
      });
  }

  _onCreateDescendantDocuments(embeddedName, documents, result, options, userId) {
    super._onCreateDescendantDocuments(embeddedName, documents, result, options, userId);
    if (userId === game.user.id)
      this.dispatch('_onCreateDescendantDocuments', {
        args: [embeddedName, documents, result, options, userId],
      });
  }

  _preUpdateDescendantDocuments(embeddedName, result, options, userId) {
    super._preUpdateDescendantDocuments(embeddedName, result, options, userId);
    if (userId === game.user.id)
      this.dispatch('_preUpdateDescendantDocuments', {
        args: [embeddedName, result, options, userId],
      });
  }

  _onUpdateDescendantDocuments(embeddedName, documents, result, options, userId) {
    super._onUpdateDescendantDocuments(embeddedName, documents, result, options, userId);
    if (userId === game.user.id)
      this.dispatch('_onUpdateDescendantDocuments', {
        args: [embeddedName, documents, result, options, userId],
      });
  }

  _preDeleteDescendantDocuments(embeddedName, result, options, userId) {
    super._preDeleteDescendantDocuments(embeddedName, result, options, userId);
    if (userId === game.user.id)
      this.dispatch('_preDeleteDescendantDocuments', {
        args: [embeddedName, result, options, userId],
      });
  }

  _onDeleteDescendantDocuments(embeddedName, documents, result, options, userId) {
    super._onDeleteDescendantDocuments(embeddedName, documents, result, options, userId);
    if (userId === game.user.id)
      this.dispatch('_onDeleteDescendantDocuments', {
        args: [embeddedName, documents, result, options, userId],
      });
  }
}
