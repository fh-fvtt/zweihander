export default class ZweihanderActiveEffect extends ActiveEffect {
  apply(actor, change) {
    if (!this.data.details.isActive) return null;

    return super.apply(actor, change);
  }

  prepareData() {
    const effectData = this.data;

    effectData.details = {
      category: {
        '@en': '???',
      },
      isActive: false,
      source: {
        '@en': '',
      },
    };
  }
}
