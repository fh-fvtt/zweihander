export const createItemMacro = async (macroData, slot) => {
  if (macroData.type !== 'Item') return;
  if (!('data' in macroData))
    return ui?.notifications.warn(
      'You can only create macro buttons for owned Items.'
    );
  const item = system;

  if (!(item.type === 'weapon' || item.type === 'spell'))
    return ui?.notifications.warn(
      `Hotbar macros do not support specified Item type '${item.type}'.`
    );

  const command = `game.zweihander.rollItemMacro("${macroData.actorId}", "${item._id}");`;
  let macro = game.macros.find(
    (m) => m.name === item.name && m.command === command
  );
  if (!macro) {
    macro = await Macro.create({
      name: `${game.actors.get(macroData.actorId).name}: ${item.name}`,
      type: 'script',
      img: item.img,
      command: command,
      flags: { 'zweihander.itemMacro': true },
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
};

export const rollItemMacro = async (actorId, itemId) => {
  const actor = game.actors.get(actorId);
  const item = actor.items.find((i) => i.id == itemId);

  await item.roll();
};
