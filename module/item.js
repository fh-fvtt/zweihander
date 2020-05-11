/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class ZweihanderItem extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    super.prepareData();

    // Get the Item's data
    const itemData = this.data;
    const actorData = this.actor ? this.actor.data : {};
    const data = itemData.data;

    if (itemData.type === 'ancestry')
      this._prepareAncestryData(itemData);
  }

  _prepareAncestryData(itemData) {
    const data = itemData.data;

    if (itemData.name.toLowerCase().includes("elf")) {
      itemData.img = "systems/zweihander/assets/elf-ear.svg";
    }

  }

}
