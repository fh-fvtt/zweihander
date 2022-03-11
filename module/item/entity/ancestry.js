import ZweihanderBaseItem from "./base-item";

export default class ZweihanderAncestry extends ZweihanderBaseItem {

  static linkedSingleProperties = [
    { property: 'ancestralTrait', itemType: 'trait' }
  ];

}