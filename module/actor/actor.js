import ZweihanderPC from "./entity/pc";
import ZweihanderNPC from "./entity/npc";
import ZweihanderCreature from "./entity/creature";
import { ZWEI } from "../config";

export default class ZweihanderActor extends Actor {

  static types = {
    character: new ZweihanderPC(),
    npc: new ZweihanderNPC(),
    creature: new ZweihanderCreature()
  };

  constructor(...args) {
    super(...args);
  }

  // convention: dispatch is async when the function it calls is
  dispatch(fnName, cfg = { orElse: { value: {}, async: false }, args: [] }) {
    // console.log(`${this.name}: dispatch: ${fnName}`);
    if (ZweihanderActor.types[this.type]) {
      const type = ZweihanderActor.types[this.type];
      if (type[fnName] && typeof type[fnName] === "function") {
        if (cfg?.args?.length) {
          return (type[fnName])(...cfg.args, this);
        } else {
          return (type[fnName])(this.data, this);
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
    this.dispatch("prepareBaseData");
  }

  prepareEmbeddedDocuments(...args) {
    if (super.prepareEmbeddedDocuments) super.prepareEmbeddedDocuments();
    this.dispatch("prepareEmbeddedEntities");
  }

  prepareEmbeddedEntities() {
    if (super.prepareEmbeddedEntities) super.prepareEmbeddedEntities();
    this.dispatch("prepareEmbeddedEntities");
  }

  applyActiveEffects() {
    super.applyActiveEffects();
    this.dispatch("applyActiveEffects");
  }

  prepareDerivedData() {
    super.prepareDerivedData();
    this.dispatch("prepareDerivedData");
  }

  getRollData() {
    return this.dispatch("getRollData", { args: [this.data.data], orElse: { value: this.data.data } });
  }

  async _preCreate(data, options, user) {
    await super._preCreate(data, options, user);
    if (!this.data.img || ZWEI.replacedDefaultCoreIcons.includes(this.data.img)) {
      const img = ZWEI.defaultActorIcons[this.data.type] ?? ZWEI.defaultActorIcons._default;
      await this.data.update({ img });
    }
    await this.dispatch("_preCreate", { args: [this.data, options, user] });
  }

  async _onCreate(data, options, user) {
    await super._onCreate(data, options, user);
    // TODO: user is an incorrect parameter and will be fixed in future versions
    if (user !== game.user.id)
      return;
    await this.dispatch("_onCreate", { args: [data, options, user] });
  }

  async createEmbeddedDocuments(embeddedName, data, context = {}) {
    const enrichedData = await this.dispatch("createEmbeddedDocuments", { args: [embeddedName, data, context], orElse: { value: data, async: true } });
    if (enrichedData) {
      return super.createEmbeddedDocuments(embeddedName, enrichedData, context)
    }
  }

  async updateEmbeddedDocuments(embeddedName, updates, context = {}) {
    const enrichedUpdates = await this.dispatch("updateEmbeddedDocuments", { args: [embeddedName, updates, context], orElse: { value: updates, async: true } });
    if (enrichedUpdates) {
      return super.updateEmbeddedDocuments(embeddedName, enrichedUpdates, context);
    }
  }

  async deleteEmbeddedDocuments(embeddedName, ids, context = {}) {
    await this.dispatch("deleteEmbeddedDocuments", { args: [embeddedName, ids, context] });
    return super.deleteEmbeddedDocuments(embeddedName, ids, context);
  }

  /* -------------------------------------------- */

  _preCreateEmbeddedDocuments(embeddedName, result, options, userId) {
    super._preCreateEmbeddedDocuments(embeddedName, result, options, userId);
    if (userId === game.user.id)
      this.dispatch("_preCreateEmbeddedDocuments", { args: [embeddedName, result, options, userId] });
  }

  _onCreateEmbeddedDocuments(embeddedName, documents, result, options, userId) {
    super._onCreateEmbeddedDocuments(embeddedName, documents, result, options, userId);
    if (userId === game.user.id)
      this.dispatch("_onCreateEmbeddedDocuments", { args: [embeddedName, documents, result, options, userId] });
  }

  _preUpdateEmbeddedDocuments(embeddedName, result, options, userId) {
    super._preUpdateEmbeddedDocuments(embeddedName, result, options, userId);
    if (userId === game.user.id)
      this.dispatch("_preUpdateEmbeddedDocuments", { args: [embeddedName, result, options, userId] });
  }

  _onUpdateEmbeddedDocuments(embeddedName, documents, result, options, userId) {
    super._onUpdateEmbeddedDocuments(embeddedName, documents, result, options, userId);
    if (userId === game.user.id)
      this.dispatch("_onUpdateEmbeddedDocuments", { args: [embeddedName, documents, result, options, userId] });
  }

  _preDeleteEmbeddedDocuments(embeddedName, result, options, userId) {
    super._preDeleteEmbeddedDocuments(embeddedName, result, options, userId);
    if (userId === game.user.id)
      this.dispatch("_preDeleteEmbeddedDocuments", { args: [embeddedName, result, options, userId] });
  }

  _onDeleteEmbeddedDocuments(embeddedName, documents, result, options, userId) {
    super._onDeleteEmbeddedDocuments(embeddedName, documents, result, options, userId);
    if (userId === game.user.id)
      this.dispatch("_onDeleteEmbeddedDocuments", { args: [embeddedName, documents, result, options, userId] });
  }


}
