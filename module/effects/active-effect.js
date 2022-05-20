export default class ZweihanderActiveEffect extends ActiveEffect {
  isSuppressed = false;

  apply(actor, change) {
    if (this.isSuppressed) return null;

    return super.apply(actor, change);
  }
}
