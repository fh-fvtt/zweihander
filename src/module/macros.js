export const createItemMacro = async (macroData, slot) => {
  if (!macroData.uuid) return;

  const item = await fromUuid(macroData.uuid);

  if (macroData.type === 'Macro') {
    game.user.assignHotbarMacro(item, slot);
    return;
  } else if (macroData.type !== 'Item') return;

  if (!('system' in item)) return ui?.notifications.warn(game.i18n.localize('ZWEI.othermessages.errormacro'));

  if (!(item.type === 'weapon' || item.type === 'spell'))
    return ui?.notifications.warn(game.i18n.format('ZWEI.othermessages.macrossupport', { type: item.type }));

  const command = `game.zweihander.rollItemMacro("${item.actor._id}", "${item._id}");`;

  let macro = game.macros.find((m) => m.name === item.name && m.command === command);

  if (!macro) {
    macro = await Macro.create({
      name: `${game.actors.get(item.actor._id).name}: ${item.name}`,
      type: 'script',
      img: item.img,
      command: command,
      flags: { 'zweihander.itemMacro': true },
    });
  }
  game.user.assignHotbarMacro(macro, slot);
};

export const rollItemMacro = async (actorId, itemId) => {
  const actor = game.actors.get(actorId);
  const item = actor.items.find((i) => i.id == itemId);

  await item.roll();
};
