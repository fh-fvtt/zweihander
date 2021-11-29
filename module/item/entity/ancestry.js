import ZweihanderBaseItem from "./base-item";
import * as ZweihanderUtils from "../../utils";

export default class ZweihanderAncestry extends ZweihanderBaseItem {

  async _preCreate(data, options, user, item) {
    const trait = await ZweihanderBaseItem.getOrCreateLinkedItem(item.parent, item.data.data.ancestralTrait.value, 'trait', item.name, 'ancestry'); 
    if (trait) {
      item.data.update({ 'data.ancestralTrait': trait });
    }
  }

  async _preUpdate(changed, options, user, item) {
    const itemData = item.data;
    const diffData = changed.data;
    const actor = item.parent;
    for (let updatedField of Object.keys(diffData)) {
      if (updatedField === "ancestralTrait") {
        const newTrait = diffData.ancestralTrait.value.trim();
        const oldTrait = itemData.data.ancestralTrait.value;
        if (newTrait !== oldTrait) {
          await ZweihanderBaseItem.removeLinkedItem(item.parent, itemData.data.ancestralTrait.linkedId);
          const trait = await ZweihanderBaseItem.getOrCreateLinkedItem(actor, newTrait, 'trait', itemData.name, 'ancestry');
          if (trait) {
            diffData.ancestralTrait = trait;
          }
        }
      }
    }
  }

  async _preDelete(options, user, item) {
    options.idToDelete=item.data.data.ancestralTrait.linkedId;
  }

  async _onDelete(options, user, item) {
    await ZweihanderBaseItem.removeLinkedItem(item.parent, options.idToDelete);
  }

}