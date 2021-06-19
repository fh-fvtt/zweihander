import UtilityHelpers from "./utility-helpers.js";

export class ZweihanderItem extends Item {

  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareBaseData() {
    super.prepareBaseData();

    const itemData = this.data;
    const actorData = this.actor ? this.actor.data : {};
    const data = itemData.data;

    if (itemData.type === "ancestry") 
      this._prepareAncestryData(itemData);
    else if (itemData.type === "skill")
      this._prepareSkillData(itemData);
    else if (itemData.type === "profession")
      this._prepareProfessionData(itemData);
    else if (itemData.type === "weapon")
      this._prepareWeaponData(itemData, actorData);
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

  _prepareWeaponData(weaponData, actorData) {
    const data = weaponData.data;  
    
    if (!UtilityHelpers.isObjectEmpty(actorData)) {
      const primaryAttributeSelected = weaponData.data.damage.associatedPrimaryAttribute;

      data.damage.primaryAttributeBonus = actorData.data.stats.primaryAttributes[primaryAttributeSelected.toLowerCase()].bonus;
    }
  }

  /** @override */
  async _preCreate(data, options, user) {
    await super._preCreate(data, options, user);

    const item = this;
    const itemData = this.data;

    const isOwned = item.parent !== null;

    if (item.type === "profession" && isOwned) {
      const actor = item.parent;

      // ------------------------------------------------ //
      //  Assign Tier based on number of Professions      //
      // ------------------------------------------------ //

      let tier = actor.data.professions.length;

      switch (tier) {
        case 0:
          itemData.update({ "data.tier.value": "Basic", "data.tier.advancesPurchased": 1 });
          actor.update({ "data.rewardPoints.spent": actor.data.data.rewardPoints.spent + 100 });
          break;
        case 1:
          itemData.update({ "data.tier.value": "Intermediate", "data.tier.advancesPurchased": 1 });
          actor.update({ "data.rewardPoints.spent": actor.data.data.rewardPoints.spent + 200 });
          break;
        case 2:
          itemData.update({ "data.tier.value": "Advanced", "data.tier.advancesPurchased": 1 });
          actor.update({ "data.rewardPoints.spent": actor.data.data.rewardPoints.spent + 300 });
          break;
        default:
          return;
      }

      // ------------------------------------------------ //
      //  Get relevant compendium and item data           //
      // ------------------------------------------------ //

      let talentsToFetch = itemData.data.talents.value.split(", ");
      let professionalTraitToFetch = [ itemData.data.professionalTrait.value ];
      let specialTraitToFetch = [ itemData.data.specialTrait.value ];
      let drawbackToFetch = itemData.data.drawback.value;

      let traitsToFetch = professionalTraitToFetch.concat(specialTraitToFetch);

      let talentPack = game.packs.get("zweihander.talents");
      let traitPack = game.packs.get("zweihander.traits");
      let drawbackPack = game.packs.get("zweihander.drawbacks");

      // ------------------------------------------------ //
      //  Get talents from compendium                     //
      // ------------------------------------------------ //

      // WARN: Bypasses client-side caching, can lead to performance issues
      let talentsToAdd = await talentPack.getDocuments({ name: { $in: talentsToFetch } }).then(result => {
        return result.map(item => item.toObject());
      });  

      let talentsToAddDifference = UtilityHelpers.findDifference(talentsToAdd, actor.data.talents);

      // ------------------------------------------------ //
      //  Get professional/special traits from compendium //
      // ------------------------------------------------ //

      let traitsToAdd = await traitPack.getDocuments({ name: { $in: traitsToFetch } }).then(result => {
        return result.map(item => item.toObject());
      });

      let traitsToAddDifference = UtilityHelpers.findDifference(traitsToAdd, actor.data.traits);

      // ------------------------------------------------ //
      //  Get drawback from compendium                    //
      // ------------------------------------------------ //

      let drawbackToAdd = drawbackToFetch.length !== 0 ? await drawbackPack.getDocuments({ name: drawbackToFetch }).then(result => {
        return result.map(item => item.toObject());
      }) : [];

      const drawbackPresent = actor.data.drawbacks.filter(d => d.name === drawbackToAdd[0]?.name).length > 0;

      // ---------------------------------------------- //
      //  If there are things to create, create them    //
      // ---------------------------------------------- //

      if (traitsToAddDifference.length > 0)
        await actor.createEmbeddedDocuments("Item", traitsToAddDifference);

      if (talentsToAddDifference.length > 0)
        await actor.createEmbeddedDocuments("Item", talentsToAddDifference);

      if (drawbackToAdd !== "" && !drawbackPresent)
        await actor.createEmbeddedDocuments("Item", drawbackToAdd);
    
    } else if (item.type === "ancestry" && isOwned) {
      const actor = item.parent;

      const ancestralTraitToFetch = itemData.data.ancestralTrait.value;

      let traitPack = game.packs.get("zweihander.traits");

      let traitToAdd = await traitPack.getDocuments({ name: ancestralTraitToFetch }).then(result => {
        return result.map(item => item.toObject());
      });

      let traitToAddDifference = UtilityHelpers.findDifference(traitToAdd, actor.data.traits);

      if (traitToAddDifference.length > 0)
        await actor.createEmbeddedDocuments("Item", traitToAddDifference);
    }
  }

  /** @override */
  async _preDelete(options, user) {
    await super._preDelete(options, user);

    const item = this;
    const itemData = this.data;

    const isOwned = item.parent !== null;

    if (item.type === "profession" && isOwned) {
      const actor = item.parent;

      // ---------------------------------------------- //
      //  Refund Reward Point cost of Profession        //
      // ---------------------------------------------- //

      const tier = actor.data.professions.length;
      const refundMultiplier = item.data.data.tier.advancesPurchased;

      switch (tier) {
        case 1:
          actor.update({ "data.rewardPoints.spent": actor.data.data.rewardPoints.spent - (refundMultiplier * 100) });
          break;
        case 2:
          actor.update({ "data.rewardPoints.spent": actor.data.data.rewardPoints.spent - (refundMultiplier * 200) });
          break;
        case 3:
          actor.update({ "data.rewardPoints.spent": actor.data.data.rewardPoints.spent - (refundMultiplier * 300) });
          break;
        default:
          break;
      }

      // ---------------------------------------------- //
      //  Delete Items referenced by a Profession       //
      // ---------------------------------------------- //    

      const talents = itemData.data.talents.value.split(",");
      const traits = [ itemData.data.specialTrait.value ].concat([ itemData.data.professionalTrait.value ]);
      const drawback = itemData.data.drawback.value;

      let itemsToDelete = talents.concat(traits).concat(drawback).filter(item => item !== "").map(item => item.trim());

      const actorProfessions = actor.data.professions;

      let itemsToKeep = [];

      // ---------------------------------------------- //
      //  Iterate remaining Professions for duplicates  //
      // ---------------------------------------------- // 

      for (let profession of actorProfessions) {
        if (profession._id === itemData._id)
          continue;

        const toIterate = [ "talents", "professionalTrait", "specialTrait", "drawback" ];

        for (let attribute of toIterate)
          itemsToKeep.push(...profession.data[attribute].value.split(",").map(element => element.trim()));
      }

      // ---------------------------------------------------- //
      //  Only delete Items not present in other Professions  //
      // ---------------------------------------------------- // 

      const toDeleteDifference = UtilityHelpers.getArrayDifference(itemsToDelete, itemsToKeep);

      if (!toDeleteDifference.length) // If there is nothing to delete, return
        return;

      let arrayOfId = [];

      for (let itemToDelete of toDeleteDifference) {
        if (itemToDelete === "")
          continue;

        const itemObject = actor.items.getName(itemToDelete.trim());
        
        if (itemObject) 
          arrayOfId.push(itemObject.id);
      }

      await actor.deleteEmbeddedDocuments("Item", arrayOfId);

    } else if (item.type === "ancestry") {
      const actor = item.parent;

      const ancestralTrait = itemData.data.ancestralTrait.value;

      let arrayOfId = [];

      const itemObject = actor.items.getName(ancestralTrait.trim());

      if (itemObject)
        arrayOfId.push(itemObject.id);

      await actor.deleteEmbeddedDocuments("Item", arrayOfId);
    }
  }

  /** @override */
  async _preUpdate(changed, options, user) {
    await super._preUpdate(changed, options, user);

    const item = this;
    const itemData = this.data;

    const isOwned = item.parent !== null;
    
    if (item.type === "profession" && isOwned) {
      const actor = item.parent;
      const diffData = changed.data;
      
      if (diffData) {
        const updatedField = Object.keys(diffData)[0];
  
        let talentPack, traitPack, drawbackPack;
  
        // Only Talents, Traits and Drawbacks are relevant
        switch (updatedField) {
          case "talents":
            talentPack = game.packs.get("zweihander.talents");
            break;
          case "professionalTrait":
          case "specialTrait":
            traitPack = game.packs.get("zweihander.traits");
            break;
          case "drawback":
            drawbackPack = game.packs.get("zweihander.drawbacks");
            break;
          default:
            return;
        }
  
        const updatedFieldValue = diffData[updatedField].value.split(",").map(talent => talent.trim());
        const oldFieldValue = itemData.data[updatedField].value.split(",").map(talent => talent.trim());
  
        const itemsToAdd = UtilityHelpers.getArrayDifference(updatedFieldValue, oldFieldValue);
        const itemsToRemove = UtilityHelpers.getArrayDifference(oldFieldValue, updatedFieldValue);

        const actorProfessions = actor.data.professions;

        let itemsToKeep = [];

        // ---------------------------------------------- //
        //  Iterate remaining Professions for duplicates  //
        // ---------------------------------------------- // 

        for (let profession of actorProfessions) {
          if (profession._id === itemData._id)
            continue;

          itemsToKeep.push(...profession.data[updatedField].value.split(",").map(element => element.trim()));
        }

        // ---------------------------------------------------- //
        //  Only delete Items not present in other Professions  //
        // ---------------------------------------------------- // 

        const toRemoveDifference = UtilityHelpers.getArrayDifference(itemsToRemove, itemsToKeep);
  
        let idsToRemove = [];
  
        for (let itemToRemove of toRemoveDifference) {
          if (itemToRemove === "")
            continue;

          const itemObject = actor.items.getName(itemToRemove);

          if (itemObject)
            idsToRemove.push(itemObject.id);
        }     
    
        if (idsToRemove.length)
          await actor.deleteEmbeddedDocuments("Item", idsToRemove);
  
        if (itemsToAdd[0] !== "") {
          let toAdd, toAddDifference;
  
          switch (updatedField) {
            case "talents":
              // WARN: Bypasses client-side caching, can lead to performance issues
              toAdd = await talentPack.getDocuments({ name: { $in: itemsToAdd } }).then(result => {
                return result.map(item => item.toObject());
              });
  
              toAddDifference = UtilityHelpers.findDifference(toAdd, actor.data.talents);
              break;
            case "professionalTrait":
            case "specialTrait":
              toAdd = await traitPack.getDocuments({ name: { $in: itemsToAdd } }).then(result => {
                return result.map(item => item.toObject());
              });
  
              toAddDifference = UtilityHelpers.findDifference(toAdd, actor.data.traits);
              break;
            case "drawback":
              toAdd = await drawbackPack.getDocuments({ name: { $in: itemsToAdd } }).then(result => {
                return result.map(item => item.toObject());
              });
  
              toAddDifference = UtilityHelpers.findDifference(toAdd, actor.data.drawbacks);
              break;
            default:
              return;
          }
    
          if (toAddDifference && toAddDifference.length)
            await actor.createEmbeddedDocuments("Item", toAddDifference);
        }
      }
    } else if (item.type === "ancestry" && isOwned) {
      const actor = item.parent;
      const diffData = changed.data;
      
      if (diffData) {
        const updatedField = Object.keys(diffData)[0];
  
        let traitPack;
  
        // Only Ancestral Trait is relevant
        if (updatedField === "ancestralTrait") {
          traitPack = game.packs.get("zweihander.traits");
        } else {
          return;
        }

        const updatedFieldValue = diffData[updatedField].value.split(",").map(talent => talent.trim());
        const oldFieldValue = itemData.data[updatedField].value.split(",").map(talent => talent.trim());
  
        const itemsToAdd = UtilityHelpers.getArrayDifference(updatedFieldValue, oldFieldValue);
        const itemsToRemove = UtilityHelpers.getArrayDifference(oldFieldValue, updatedFieldValue);
  
        let idsToRemove = [];
  
        for (let itemToRemove of itemsToRemove) {
          if (itemToRemove === "")
            continue;

          const itemObject = actor.items.getName(itemToRemove);

          if (itemObject)
            idsToRemove.push(itemObject.id);
        }     
    
        if (idsToRemove.length)
          await actor.deleteEmbeddedDocuments("Item", idsToRemove);
  
        if (itemsToAdd[0] !== "") {
          let toAdd = await traitPack.getDocuments({ name: { $in: itemsToAdd } }).then(result => {
            return result.map(item => item.toObject());
          });

          let toAddDifference = UtilityHelpers.findDifference(toAdd, actor.data.traits);

          if (toAddDifference && toAddDifference.length)
            await actor.createEmbeddedDocuments("Item", toAddDifference);
        } 
      }
    }
  }

  /** @override */
  async _onUpdate(changed, options, user) {
    await super._onUpdate(changed, options, user);

    // TODO: user is an incorrect parameter and will be fixed in future versions
    if (user !== game.user.id)
      return;

    const item = this;
    const itemData = this.data;

    const isOwned = item.parent !== null;
    
    if (item.type === "profession" && isOwned && changed.data) {
      const actor = item.parent;
      const diffData = changed.data;

      const updatedField = Object.keys(diffData)[0];

      if (updatedField === "tier") {
        const advancesPurchased = diffData.tier.advancesPurchased;

        if (advancesPurchased)
          await item.update({ "data.tier.completed": advancesPurchased === 21 });
      }
    }
  }
}