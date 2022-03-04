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

  getEffectivePerilLadderValue(baseLadderValue, isIgnoredPerilLadderValue) {
    return isIgnoredPerilLadderValue[Math.max(0,3-baseLadderValue)] ? 5 : baseLadderValue;
  }

  getPerilMalus(ladderValue) {
    return Math.max(0,4-ladderValue)*10;
  }

  async createEmbeddedDocuments(embeddedName, data, context, actor) {
    if (embeddedName === "Item") {
      const filteredData = [];
      let ancestryAttached = actor.data.items.some(i => i.type === 'ancestry');
      const actorProfessions = actor.data.items.filter(i => i.type === 'profession');
      let numberOfProfessionsAttached = actorProfessions.length;
      for (let item of data) {
        if (item.type === "profession") {
          const previousTiersCompleted = actorProfessions
            .map(profession => profession.data.data.tier.completed)
            .every(value => value === true);
          const allTiersAssigned = numberOfProfessionsAttached == 3;
          const dragDroppedOwnProfession = actorProfessions.some(p => p._id === item._id);
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