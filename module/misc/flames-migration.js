import { ZWEI } from "../config";
import { findItemWorldWide, normalizedEquals } from "../utils";

export const migrateFlames = async function () {
  const scenesToRestore = await migrateScenes();
  const itemsToRestore = game.items._source.flatMap(migrateItem).flatMap(x=>x).flatMap(x=>x).filter(x => x).map(x => expandObject(x));
  const actorsToRestore = (await Promise.all(game.actors._source.map(migrateActor))).filter(x => x).map(x => expandObject(x));
  const command = `(${restore.toString()})(${JSON.stringify(itemsToRestore)}, ${JSON.stringify(actorsToRestore)}, ${JSON.stringify(scenesToRestore)})`;
  Macro.create({type: 'script', name: '<<-=[Migration: Restore Items, Actors & Scenes]=->>', command});
}

const restore = async (itemsToRestore, actorsToRestore, scenesToRestore) => {
  await Item.createDocuments(itemsToRestore, {keepId: true, keepEmbeddedIds: true});
  await Actor.createDocuments(actorsToRestore, {keepId: true, keepEmbeddedIds: true});
  await Scene.createDocuments(scenesToRestore, {keepId: true, keepEmbeddedIds: true});
}

const migrateScenes = async () => {
  const skillPack = game.packs.get('zweihander.skills');
  const skills = (await skillPack.getDocuments()).map(item => item.toObject());
  const scenes = game.scenes._source;
  for (let s of scenes) {
    for (let t of s.tokens) {
      if (t.actorData?.items) {
        const j = [];
        for (let i of t.actorData.items) {
          j.push(...migrateItem(i));
        }
        t.actorData.items = j.flatMap(x => x).flatMap(x => x).flatMap(x => expandObject(x)).filter(x => x);
        t.actorData.items.push(...skills);
      }
    }
  }
  return scenes;
}

function makeid(length) {
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
 }
 return result;
}

const skillToSkill = (s) => ({
  martialranged: 'Martial Ranged',
  martialmelee: 'Martial Melee',
  invocation: 'Incantation',
  simplemelee: 'Simple Melee',
  simpleranged: 'Simple Ranged',
  handleanimal: 'Handle Animal'
}[(s.split('.')[1] ?? s)] ?? (s.split('.')[1]?.capitalize?.() ?? s.capitalize()));

const migrateActor = async (actor) => {
  const z = {
    _id: actor._id,
    flags: actor.flags,
    permission: actor.permission,
    name: actor.name,
    folder: actor.folder,
    img: actor.img,
    token: actor.token,
    sort: actor.sort,
    effects: actor.effectsf
  }
  if (z.flags?.core?.sourceId) {
    delete z.flags.core.sourceId;
  }
  const f = actor.data;
  if (actor.type === 'PC') {
    z.type = 'character';
    z.items = actor.items.map(migrateItem).flatMap(x=>x).flatMap(x => x).map(x => expandObject(x)).filter(x => x.type !=='talent');
    const professions = z.items.filter(i => i.type === 'profession');
    for (let p of professions) {
      for (let t of p.data.talents) {
        let linkedItem = z.items.find(i => i.type === 'talent' && normalizedEquals(i.name, t.value));
        t.linkedId = linkedItem?._id ?? null;
        if (!t.linkedId) {
          const fetched = (await findItemWorldWide('talent',t.value)).toObject();
          z.items.push(fetched);
          t.linkedId = fetched._id;
          linkedItem = fetched;
        }
        linkedItem.flags = {'zweihander': {source: { value: 'profession', label: `${p.name} (Profession)` }}};
      }
      const linkedDrawback = z.items.find(i => i.type === 'drawback' && normalizedEquals(i.name, p.data.drawback.value))
      p.data.drawback.linkedId = linkedDrawback?._id ?? null;
      if (linkedDrawback) {
        linkedDrawback.flags = {'zweihander': {source: { value: 'profession', label: `${p.name} (Profession)` }}};
      }
      const linkedPT = z.items.find(i => i.type === 'trait' && normalizedEquals(i.name, p.data.professionalTrait.value));
      p.data.professionalTrait.linkedId = linkedPT._id ?? null;
      if (linkedPT) {
        linkedPT.flags = {'zweihander': {source: { value: 'profession', label: `${p.name} (Profession)` }}};
      }
    }
    z['data.stats.primaryAttributes'] = Object.fromEntries(Object.entries(f.attributes).filter(x => x[1]).map(([k,v]) => [k, {value: Number(v.value) }]));
    const currentPeril = f.peril.value;
    const currentDamage = f.damage.value;
    z['data.stats.secondaryAttributes.perilCurrent.value'] = 5-currentPeril;
    z['data.stats.secondaryAttributes.damageCurrent.value'] = 5-currentDamage;
    z['data.flavor.description'] = f.biography;
    z['data.rewardPoints.total'] = f.rpearned;
    if (Number(f.rpmisc) > 0) {
      z.items.push(expandObject({type:'uniqueAdvance', img: ZWEI.defaultItemIcons['uniqueAdvance'], name:'Flames System Migration', 'data.advanceType.value': 'Misc', 'data.rewardPointCost.value': Number(f.rpmisc) }));
    }
    z['data.corruption.value'] = f.alignment.corruption;
    z['data.chaosRanks.value'] = f.alignment.chaosranks;
    z['data.orderRanks.value'] = f.alignment.orderranks;
    z['data.orderAlignment.value'] = f.alignment.orderalign;
    z['data.chaosAlignment.value'] = f.alignment.chaosalign;
    z['data.reputation.value'] = f.reputation;
    z['data.fate.value'] = f.determination;
    z['data.physical.age.value'] = f.age; 
    z['data.physical.sex.value'] = f.gender; 
    z['data.physical.height.value'] = f.height; 
    z['data.physical.weight.value'] = f.weight; 
    z['data.physical.hairColor.value'] = f.haircolor; 
    z['data.physical.eyeColor.value'] = f.eyecolor; 
    z['data.physical.complexion.value'] = f.complexion;
    z['data.physical.buildType.value'] = f.build;
    z['data.socialClass.value'] = f.socialclass;
    z['data.dooming.value'] = f.dooming;
    z['data.upbringing.value'] = f.upbringing;
    z['data.seasonOfBirth.value'] = f.birthseason;
    z['data.currency.gc'] = f.currency.gold;
    z['data.currency.ss'] = f.currency.silver;
    z['data.currency.bp'] = f.currency.brass;
    z['data.distinguishingMarks.value'] = f.distinguishingmark;
    
  } else if (actor.type === 'NPC') {
    z.type = 'npc';
    z.items = actor.items.flatMap(migrateItem).flatMap(x=>x).flatMap(x => x).map(x => expandObject(x));
    const currentPeril = Number(f.skills.peril.value);
    const currentDamage = Number(f.skills.damage.value);
    const movement = f.movement;
    delete f.skills.damage;
    delete f.skills.peril;
    delete f.skills.initiativedice;
    delete f.skills.initiativemod;
    delete f.skills.movement;
    delete f.skills.actionpoints;
    delete f.skills.determination;
    const skillRanks = Object.fromEntries(Object.values(f.skills).flatMap((v) => Object.entries(v)).map(([k,v]) => [skillToSkill(k),v]));
    z['data.skillRanks'] = skillRanks;
    z['data.stats.secondaryAttributes.movement.value'] = Number(movement);
    z['data.stats.secondaryAttributes.perilCurrent.value'] = 5-currentPeril;
    z['data.stats.secondaryAttributes.damageCurrent.value'] = 5-currentDamage;
    z['data.stats.primaryAttributes'] = Object.fromEntries(Object.entries(f.attributes).map(([k,v]) => [k, {value: Number(v.value), bonusAdvances: Number(v.bonus) - Math.floor(v.value/10) }]));
  } else {
    return
  }
  if (actor.img.indexOf('/flames/') >= 0) {
    // z.img = ZWEI.defaultActorIcons[z.type];
   }
   return z;
}

const migrateItem = (item) => {
  const z = {
    _id: item._id,
    flags: item.flags,
    permission: item.permission,
    name: item.name,
    folder: item.folder,
    img: item.img,
    sort: item.sort,
    effects: item.effects
  };
  const zz = [z];
  if (z.flags?.core?.sourceId) {
    delete z.flags.core.sourceId;
  }
  const f = item.data;
  if (item.type === 'Condition') {
    z.type = f.conditiontype;
    z['data.effect.value'] = f.description;
    switch (f.conditiontype) {
      case 'injury':
        z['data.severity.value'] = f.injurytype;
        break;
      case 'mutation':
        z.type = 'taint';
        z['data.category.value'] = 'Mutation';
        break;
    }
  } else if (item.type === 'Talent') {
    z.type = 'talent';
    z['data.effect.value'] = f.description;
  } else if (item.type === 'Spell') {
    z.type = 'spell';
    z['data.tradition.value'] = f.spelltype?.capitalize?.();
    z['data.principle.value'] = f.principle?.capitalize?.();
    z['data.duration.value'] = f.duration;
    z['data.reagents.value'] = f.reagents;
    z['data.distance.value'] = f.distance;
    z['data.effect.value'] = f.description;
    z['data.effect.criticalSuccess'] = f.criticalsuccess;
    z['data.effect.criticalFailure'] = f.criticalfailure;
  } else if (item.type === 'Focus') {
    z.type = 'uniqueAdvance';
    z['data.advanceType.value'] = 'focus';
    z['data.associatedFocusSkill'] = f.skill;
  } else if (item.type === 'Armor') {
    z.type = 'armor';
    z['data.equipped'] = f.equipped;
    z['data.encumbrance.value'] = f.encumbrance;
    z['data.damageThresholdModifier.value'] = f.armorvalue;
    z['data.qualities.value'] = f.qualities;
    z['data.flavor.description'] = f.description;
  } else if (item.type === 'Trapping') {
    z.type = 'trapping';
    z['data.flavor.description'] = f.description;
    z['data.encumbrance.value'] = f.encumbrance;
    z['data.quantity.value'] = f.quantity;
    // price not mapped...
  } else if (item.type === 'Weapon') {
    z.type = 'weapon';
    z['data.flavor.description'] = f.description;
    z['data.type.value'] = f.type;
    z['data.qualities.value'] = f.qualities;
    z['data.encumbrance.value'] = f.encumbrance;
    z['data.distance.value'] = f.distance;
    z['data.load.value'] = f.load;
    z['data.handling'] = f.handling;
    const skill = {
      martialranged: 'Martial Ranged',
      martialmelee: 'Martial Melee',
      invocation: 'Incantation',
      simplemelee: 'Simple Melee',
      simpleranged: 'Simple Ranged'
    }[f.skill] ?? 'Simple Melee';
    z['data.associatedSkill.value'] = skill;
    const bonus = {
      combatbonus: 'CB',
      agilitybonus: 'AB',
      willpowerbonus: 'WB',
      brawnbonus: 'BB',
    }[f.damagebonus] ?? 'CB';
    const baseDamage = f.damage;
    z['data.damage.formula'] = `[${bonus}] + ${baseDamage} + (1+[#])d6x6`;
  } else if (item.type === 'Ancestry') {
    z.type = 'ancestry';
    z['data.ancestralTrait.value'] = f.traitname;
    const pMods = [];
    const nMods = [];
    for (let pa of ZWEI.primaryAttributes) {
      if (f[pa] > 0) {
        pMods.push(...(new Array(f[pa]).fill(`[${pa[0].toUpperCase()}B]`)));
      } else if (f[pa] < 0) {
        nMods.push(...(new Array(-f[pa]).fill(`[${pa[0].toUpperCase()}B]`)));
      }
    }
    z['data.ancestralModifiers.positive'] = pMods;
    z['data.ancestralModifiers.negative'] = nMods;
  } else if (item.type === 'Profession') {
    z.type = 'profession';
    z['data.flavor.description'] = f.description;
    z['data.archetype.value'] = f.archetype?.capitalize?.();
    z['data.expert.value'] = f.requirements.trim() !== '';
    z['data.expert.requirements'] = f.requirements;
    z['data.tier.value'] = ZWEI.tiers[f.tier];
    const bonusAdvances = [f.bonus1, f.bonus2, f.bonus3, f.bonus4, f.bonus5, f.bonus6, f.bonus7].map(x => ({value: `[${x.bonusname[0].toUpperCase()}B]`, purchased: x.bonuspurchased}));
    z['data.bonusAdvances'] = bonusAdvances;
    const skillRanks = [f.skill1, f.skill2, f.skill3, f.skill4, f.skill5, f.skill6, f.skill7, f.skill8, f.skill9, f.skill10].map(x => ({value: skillToSkill(x.skillname), purchased: x.skillpurchased}));;
    z['data.skillRanks'] = skillRanks;
    const talents = [f.talent1, f.talent2, f.talent3].map(x => ({value: x.talentname, purchased: x.talentpurchased}));;
    z['data.talents'] = talents;
    z['data.professionalTrait'] = { value: f.trait1.name };
    z['data.drawback'] = { value: f.drawback1.name };
    if (f.trait1.name) {
      zz.push({type: 'trait', _id: makeid(16), img: ZWEI.defaultItemIcons['trait'], folder: item.folder, name: f.trait1.name, 'data.effect.value': f.trait1.description});
    }
    if (f.drawback1.name) {
      zz.push({type: 'drawback', _id: makeid(16), img: ZWEI.defaultItemIcons['drawback'], folder: item.folder, name: f.drawback1.name, 'data.effect.value': f.drawback1.description});
    }
   } else {
     return [];
   }
   if (item.img.indexOf('/flames/') >= 0) {
    // z.img = ZWEI.defaultItemIcons[z.type];
   }
   return [zz];
}