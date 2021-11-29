let moduleName = "zweihander";
let packName = "weapons"

// Reference a Compendium pack by it's collection ID
const pack = game.packs.find(p => p.collection === `${moduleName}.${packName}`);

let names = "Bolas, Bottle bomb, Francisca, Hunting bow, Improvised throwing weapon, Javelin, Light crossbow, Shepherd's sling, Throwing knife";

let descriptions = [
"Useful for capturing dogs or prey on the run; both despicable curs.",
"Generally sparked by a demagogue’s fiery rhetoric, this rudimentary incendiary sets its enemies aflame upon contact.",
"A balanced throwing axe, it’s good for splitting pumpkins or noggins at range. Strangely, both make similar sounds when struck.",
"Lightweight and easy to wield, these bows are favored by forest stalkers. They have a strong pull, but not strong enough to split an arrow in twain.",
"Bottles of beer, a brass pitcher, a sizable rock, a lead plate or even a pair of boots are all serviceable enough to be flung. Mostly, they serve as a minor annoyance.",
"Used both in sport and murder, these short spears are carried by the half dozen. The range it can be thrown is a point of pride on both fields.",
"These are lighter versions of the arbalest, their strings hand-drawn by a crank. They’re typically used as weaponry for peasant militias, or as playthings for lordly children too nearsighted or clumsy to draw a bowstring.",
"Used to deter wolves from flocks of sheep, they can be used to fell the greatest of goliaths if slung correctly.",
"This small blade is the staple of vagabonds and cut throats. Well-balanced ones can be juggled and pierce any thrown apple... often to reluctant applause."
]


const items = await Item.create(names.split(",").map((x,i) => ({name: x.trim(), type: 'weapon', data: { flavor: {description: descriptions[i]},associatedSkill: { value: "Simple Ranged"},encumbrance: { value: 1},type: { value: "Missile"}, load: {value: 1}, distance: {value: "1 + [PB] yards"}}})), {temporary: true});

for (let i of items ) {
  await pack.importDocument(i);
  console.log(i);
  console.log(`Imported Item ${i.name} into Compendium pack ${pack.collection}`);
  i.sheet.render(true);
}