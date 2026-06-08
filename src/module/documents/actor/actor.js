import * as ZweihanderUtils from '../../system/utils';

export default class ZweihanderActor extends Actor {
  constructor(...args) {
    super(...args);

    if (this.type === 'vehicle')
      Hooks.on('updateActor', (actor, changed) => {
        if (this.isOwner) this.#updateOccupantsData(actor, changed);
      });
  }

  get isVehicle() {
    return this.type === 'vehicle';
  }

  get isNPC() {
    return this.type === 'npc';
  }

  get isCreature() {
    return this.type === 'creature';
  }

  get isCharacter() {
    return this.type === 'character';
  }

  getSkillEffects(skill, testType = 'skill') {
    const skillName = skill.name;
    const hasRanks = skill.system.rank > 0;

    return Array.from(this.allApplicableEffects()).flatMap(
      (e) =>
        e.system.changes
          .filter((c) => {
            if (c.key.startsWith('system') || c.key.startsWith('token')) return false;

            const [category, target] = c.key.split('.');

            if (category === 'skill') {
              switch (target) {
                case 'all':
                  return true;
                case 'ranked':
                  return hasRanks;
                case 'unranked':
                  return !hasRanks;
                default:
                  return ZweihanderUtils.normalizedEquals(target, skillName);
              }
            } else if (category === testType) {
              switch (target) {
                case 'all':
                  return true;
                default:
                  return ZweihanderUtils.normalizedEquals(target, skillName);
              }
            }
          })
          .map((c) => ({ ...c, description: e.description, effectName: e.name })) // @todo: this mapping is probably useless
    );
  }

  getRollData() {
    const rollData = super.getRollData();

    return rollData;
  }

  getEffectivePerilLadderValue(baseLadderValue, isIgnoredPerilLadderValue) {
    return isIgnoredPerilLadderValue[Math.max(0, 3 - baseLadderValue)] ? 5 : baseLadderValue;
  }

  getPerilMalus(ladderValue, alternativePerilSystem) {
    return alternativePerilSystem ? CONFIG.ZWEI.alternativePerilTable[ladderValue] : Math.max(0, 4 - ladderValue) * 10;
  }

  getItem(type, name, strict = false) {
    return this.items.find(
      (i) => i.type === type && (strict ? i.name === name : ZweihanderUtils.normalizedEquals(i.name, name))
    );
  }

  getSkillChance(skill) {
    if (!skill) return 0;

    const pa = skill.system.associatedPrimaryAttribute.toLowerCase();
    const paChance = this.system.stats.primaryAttributes[pa].value;
    const skillBonus = skill.system.bonus;

    return paChance + skillBonus;
  }

  // @todo: refactor this after getting rid of the entire 'dispatch' system
  async #updateOccupantsData(actor, changed) {
    if (this.type !== 'vehicle') return;

    // console.log(changed);

    const vehicleOccupants = this.getFlag('zweihander', 'vehicleOccupants');
    const drivers = vehicleOccupants.drivers;
    const passengers = vehicleOccupants.passengers;

    const foundDriver = drivers.find((d) => d.uuid === actor.uuid);

    const foundPassenger = passengers.find((d) => d.uuid === actor.uuid);

    if (!foundDriver && !foundPassenger) return;

    if (foundDriver) {
      drivers[drivers.indexOf(foundDriver)] = {
        name: actor.name,
        img: actor.img,
        uuid: actor.uuid,
        system: actor.system,
        isDriver: true,
      };
    } else if (foundPassenger) {
      passengers[passengers.indexOf(foundPassenger)] = {
        name: actor.name,
        img: actor.img,
        uuid: actor.uuid,
        system: actor.system,
        isDriver: false,
      };
    }

    const newVehicleOccupants = {
      drivers: drivers,
      passengers: passengers,
    };

    await this.setFlag('zweihander', 'vehicleOccupants', newVehicleOccupants);
  }
}
