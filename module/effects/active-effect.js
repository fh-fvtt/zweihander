export default class ZweihanderActiveEffect extends ActiveEffect {
  isActive = true;

  apply(actor, change) {
    if (!this.isActive) return null;

    return super.apply(actor, change);
  }

  prepareDerivedData() {
    if (!this.data.details)
      this.data.details = {
        category: 'TestCat',
        source: 'TestSrc',
      };
    console.log('effect data ----------- ', this);

    /*     effectData.details = {
      category: {
        '@en': '???',
      },
      isActive: false,
      source: {
        '@en': '',
      },
    }; */
  }
}
