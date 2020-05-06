/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class ZweihanderActor extends Actor {

  /** @override */
  getRollData() {
    const data = super.getRollData();
    
    /*
    const shorthand = game.settings.get("zweihander", "macroShorthand");

    // Re-map all attributes onto the base roll data
    if ( !!shorthand ) {
      for ( let [k, v] of Object.entries(data.attributes) ) {
        if ( !(k in data) ) data[k] = v.value;
      }
      delete data.attributes;
    }

    // Map all items data using their slugified names
    data.items = this.data.items.reduce((obj, i) => {
      let key = i.name.slugify({strict: true});
      let itemData = duplicate(i.data);
      if ( !!shorthand ) {
        for ( let [k, v] of Object.entries(itemData.attributes) ) {
          if ( !(k in itemData) ) itemData[k] = v.value;
        }
        delete itemData["attributes"];
      }
      obj[key] = itemData;
      return obj;
    }, {});*/
    return data;
  }

  prepareData() {
    super.prepareData();

    const actorData = this.data;
    const data = actorData.data;
    const flags = actorData.flags;

    if (actorData.type === 'character')
      this._prepareCharacterData(actorData);
  }

  _prepareCharacterData(actorData) {
    const data = actorData.data;

    // Calculate primary attribute bonuses (first digit)

    for (let attribute of Object.values(data.stats.primaryAttributes)) {
      const attributeString = ('' + attribute.value);
      
      attribute.bonus = attributeString.length == 1 ? 0 : Number(attributeString[0]);
    }


    // Assign a value to each skill equal to the value of the underlying primary attribute

    for (let skill of Object.values(data.stats.skills)) {
        skill.value = data.stats.primaryAttributes[skill.associatedPrimaryAttribute].value;
    }


    // Assign a value to Dodge equal to the value of its underlying skill 

    data.stats.secondaryAttributes.dodge.value = data.stats.skills.coordination.value;


    // Assign a value to Parry equal to the value of its underlying skill 

    data.stats.secondaryAttributes.parry.value = data.stats.skills[data.stats.secondaryAttributes.parry.associatedSkill].value;


    // Assign encumbrance overage TODO: Items, Armor, etc...
    //...

    const overage = data.stats.secondaryAttributes.encumbrance.overage;


    // Assign Initiative values

    const initiativeValue = data.stats.secondaryAttributes.initiative.value = data.stats.primaryAttributes.perception.bonus + 3;
    data.stats.secondaryAttributes.initiative.current = initiativeValue - overage;


    // Assign Movement values

    const movementValue = data.stats.secondaryAttributes.movement.value = data.stats.primaryAttributes.agility.bonus + 3;
    data.stats.secondaryAttributes.movement.current = movementValue - overage;


    // Assign Peril Threshold values

    var initialPeril = data.stats.primaryAttributes.willpower.bonus, perilModifier = 3;

    const perilArray = Object.keys(data.stats.secondaryAttributes.perilThreshold);

    for(let i = 0; i < perilArray.length; i++) {
      data.stats.secondaryAttributes.perilThreshold[perilArray[i]] = initialPeril += perilModifier;

      if(i % 2)
        perilModifier += 3;
    }


    // Assign Damage Threshold values

    var initialDamage = data.stats.primaryAttributes.brawn.bonus, damageModifier = 3;

    const damageArray = Object.keys(data.stats.secondaryAttributes.damageThreshold);

    for(let i = 0; i < damageArray.length; i++) {
      data.stats.secondaryAttributes.damageThreshold[damageArray[i]] = initialDamage += damageModifier;

      if(i % 2)
        damageModifier += 3;
    }
  }

}
