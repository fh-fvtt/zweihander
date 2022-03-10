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

  async _preCreate(actorData, options, user, that) {
    // add default set of skills
    const skillPack = game.packs.get(game.settings.get("zweihander", "skillPack"));
    const skillsFromPack = (await skillPack.getDocuments()).map(i => i.toObject());
    actorData.update({ "items": skillsFromPack }, { "keepId": true, "keepEmbeddedIds": true});
  }
}