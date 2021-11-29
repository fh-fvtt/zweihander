import ZweihanderWeapon from "./entity/weapon";
import ZweihanderProfession from "./entity/profession";
import ZweihanderSkill from "./entity/skill";
import ZweihanderAncestry from "./entity/ancestry";

export default class ZweihanderItem extends Item {

  static types = {
    weapon: new ZweihanderWeapon(),
    profession: new ZweihanderProfession(),
    skill: new ZweihanderSkill(),
    ancestry: new ZweihanderAncestry()
  };

  constructor(...args) {
    super(...args);
  }

  // convention: dispatch is async when the function it calls is
  dispatch(fnName, cfg = {orElse: {value: {}, async: false}, args: []}) {
    // console.log(`${this.name}: dispatch: ${fnName}`);
    if (ZweihanderItem.types[this.type]) {
      const type = ZweihanderItem.types[this.type];
      if (type[fnName] && typeof type[fnName] === "function") {
        if (cfg.args?.length) {
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

  prepareEmbeddedDocuments() {
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

  async _preCreate(data, options, user) {
    await super._preCreate(data, options, user);
    if (this.parent === null) return;
    await this.dispatch("_preCreate", {args: [data, options, user]});
  }

  async _preDelete(options, user) {
    await super._preDelete(options, user);
    if (this.parent === null) return;
    await this.dispatch("_preDelete", {args: [options, user]});
  }

  async _onDelete(options, user) {
    await super._preDelete(options, user);
    if (user !== game.user.id) return
    if (this.parent === null) return;
    await this.dispatch("_onDelete", {args: [options, user]});
  }

  async _preUpdate(changed, options, user) {
    if (this.parent && changed.data) {
      await this.dispatch("_preUpdate", {args: [changed, options, user]});
    }
    await super._preUpdate(changed, options, user);
  }

  async _onUpdate(changed, options, user) {
    await super._onUpdate(changed, options, user);
    if (user !== game.user.id) return
    if (this.parent === null || !changed.data) return;
    await this.dispatch("_onUpdate", {args: [changed, options, user]});
  }
}