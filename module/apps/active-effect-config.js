export default class ZweihanderActiveEffectConfig extends ActiveEffectConfig {
  static get defaultOptions() {
    const classes = ['zweihander'];

    return foundry.utils.mergeObject(super.defaultOptions, {
      classes,
    });
  }

  /**@override */
  getData() {
    const data = super.getData();

    console.log('getDATA @ ZweihanderActiveEffectConfig', data);

    return data;
  }
}
