import * as ZweihanderUtils from "../../utils";

export default class ZweihanderBaseActor {

  prepareEmbeddedEntities(actorData) {

  }

  getRollData(rollData) {
    //TODO: make attributes more accessible here
    return rollData;
  }


  buildPerilDamageLadder(data, initialPeril, initialDamage) {
    const ladder = [
      "value",
      "valuePlusSix",
      "valuePlusTwelve",
      "valuePlusEighteen"
    ];
    let ladderIncrement = 0;
    data.stats.secondaryAttributes.perilThreshold = {};
    data.stats.secondaryAttributes.damageThreshold = {};
    ladder.forEach((v) => {
      data.stats.secondaryAttributes.perilThreshold[v] = initialPeril + ladderIncrement;
      data.stats.secondaryAttributes.damageThreshold[v] = initialDamage + ladderIncrement;
      ladderIncrement += 6;
    })
  }

  getPerilMalus(data) {
    return {
      0: 30,
      1: 30,
      2: 20,
      3: 10
    }[data.stats.secondaryAttributes.perilCurrent.value] ?? 0;
  }

  async createEmbeddedDocuments(embeddedName, data, context, actor) {
    if (embeddedName === "Item") {
      const filteredData = [];
      let ancestryAttached = actor.data.ancestry.length === 1;
      let numberOfProfessionsAttached = actor.data.professions.length;
      for (let item of data) {
        if (item.type === "profession") {
          const previousTiersCompleted = actor.data.professions
            .map(profession => profession.data.tier.completed)
            .every(value => value === true);
          const allTiersAssigned = numberOfProfessionsAttached == 3;
          const dragDroppedOwnProfession = actor.data.professions.some(p => p._id === item._id);
          if (allTiersAssigned && !dragDroppedOwnProfession) {
            ui.notifications.error("A character may not enter more than 3 Professions.");
          } else if (!previousTiersCompleted && !dragDroppedOwnProfession) {
            ui.notifications.error("A character must complete the previous Tier before entering a new Profession.");
          }
          if (!allTiersAssigned && previousTiersCompleted) {
            filteredData.push(item);
            numberOfProfessionsAttached++;
          }
        } else if (item.type === "ancestry") {
          if (ancestryAttached) {
            ui.notifications.error("A character may not possess more than 1 Ancestry.");
          } else {
            filteredData.push(item);
            ancestryAttached = true;
          }
        } else {
          filteredData.push(item);
        }
      }
      return filteredData;
    }
    return data;
  }
  
}