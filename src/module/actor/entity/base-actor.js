export default class ZweihanderBaseActor {
  getRollData(rollData) {
    //TODO: make attributes more accessible here
    return rollData;
  }

  getEffectivePerilLadderValue(baseLadderValue, isIgnoredPerilLadderValue) {
    return isIgnoredPerilLadderValue[Math.max(0, 3 - baseLadderValue)] ? 5 : baseLadderValue;
  }

  getPerilMalus(ladderValue, alternativePerilSystem) {
    const alternativePerilTable = {
      5: 0,
      4: 0,
      3: -5,
      2: -10,
      1: -20,
      0: -20,
    };

    return alternativePerilSystem ? alternativePerilTable[ladderValue] : Math.max(0, 4 - ladderValue) * 10;
  }

  async _preCreate(actor, options, user, that) {
    // add default set of skills
    const skillPack = game.packs.get(game.settings.get('zweihander', 'skillPack'));
    const skillsFromPack = (await skillPack.getDocuments()).map((i) => i.toObject());
    await that.updateSource({ items: skillsFromPack }, { keepId: true, keepEmbeddedIds: true });
  }
}
