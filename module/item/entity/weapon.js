import ZweihanderBaseItem from "./base-item";
import * as ZweihanderUtils from "../../utils";

export default class ZweihanderWeapon extends ZweihanderBaseItem {
  
  prepareDerivedData(itemData) {
    itemData.data.qualities.arrayOfValues = itemData.data.qualities.value.split(", ");
  }

}