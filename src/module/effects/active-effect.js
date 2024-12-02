export default class ZweihanderActiveEffect extends ActiveEffect {
  prepareBaseData() {}

  apply(actor, change) {
    if (!this.system.isActive) return null;

    return super.apply(actor, change);
  }
}
