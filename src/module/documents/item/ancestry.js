import ZweihanderBaseItem from './base-item';

export default class ZweihanderAncestry extends ZweihanderBaseItem {
  static linkedSingleProperties = [{ property: 'ancestralTrait', itemType: 'trait' }];

  prepareDerivedData(item) {
    const itemData = item.system;

    const ancestralModifiers = itemData.ancestralModifiers.value;

    if (ancestralModifiers.length) {
      let toAddPositive = [];
      let toAddNegative = [];

      for (const modifier of ancestralModifiers) {
        if (modifier.value == 0) continue;

        const toAdd = Array(Math.abs(modifier.value)).fill(modifier.key);

        if (modifier.value > 0) toAddPositive = toAddPositive.concat(toAdd);
        else toAddNegative = toAddNegative.concat(toAdd);
      }

      // @todo: remove these keys from template.json
      itemData.ancestralModifiers.positive = toAddPositive;
      itemData.ancestralModifiers.negative = toAddNegative;
    }
  }
}
