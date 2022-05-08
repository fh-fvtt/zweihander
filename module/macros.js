export const createItemMacro = async (data, slot) => {
  if (data.type !== "Item") return;
  if (!("data" in data)) return ui?.notifications.warn("You can only create macro buttons for owned Items.");
  const item = data.data;

  if (!(item.type === 'weapon' || item.type === 'spell')) return ui?.notifications.warn(`Hotbar macros do not support specified Item type '${item.type}'.`);

  const command = `game.zweihander.rollItemMacro("${data.actorId}", "${item._id}");`;
  let macro = game.macros.find(m => (m.name === item.name) && (m.command === command));
  if (!macro) {
    macro = await Macro.create({
      name: `${game.actors.get(data.actorId).name}: ${item.name}`,
      type: "script",
      img: item.img,
      command: command,
      flags: { "zweihander.itemMacro": true }
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

export const rollItemMacro = async (actorId, itemId) => {
  const actor = game.actors.get(actorId);
  const item = actor.items.find(i => i.id == itemId);

  await item.roll();
}