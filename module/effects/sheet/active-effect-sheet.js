export default class ZweihanderActiveEffectSheet extends ActiveEffectConfig {
  static get defaultOptions() {
    const classes = ['zweihander'];

    return foundry.utils.mergeObject(super.defaultOptions, {
      classes,
    });
  }
}
