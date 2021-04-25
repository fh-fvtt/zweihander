/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class ZweihanderItem extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareBaseData() {
    super.prepareBaseData();

    // Get the Item's data
    const itemData = this.data;
    const actorData = this.actor ? this.actor.data : {};
    const data = itemData.data;

    if (itemData.type === "ancestry") 
      this._prepareAncestryData(itemData);
    else if (itemData.type === "skill")
      this._prepareSkillData(itemData);
    else if (itemData.type === "profession")
      this._prepareProfessionData(this);
  }

  _prepareAncestryData(itemData) {
    const data = itemData.data;

    itemData.img = "systems/zweihander/assets/icons/ancestry.svg";

  }

  _prepareSkillData(itemData) {
    const data = itemData.data;

    let rankBonus;

    if (data.ranks.master.purchased)
      rankBonus = 30;
    else if (data.ranks.journeyman.purchased)
      rankBonus = 20;
    else if (data.ranks.apprentice.purchased)
      rankBonus = 10;
    else
      rankBonus = 0;

    data.ranks.bonus = rankBonus;
  }

  _prepareProfessionData(professionItem) {

  }

}
