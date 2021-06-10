export default class FuryDie extends Die {
  constructor(termData) {
    super(termData);
    this.faces = 6;

    if (!termData.modifiers.length)
      this.modifiers = [ "x6" ];
  }

  explode(modifiers, {recursive=true}={}) {
    const regex = /x([0-9]+)?(\{[0-9]+\,(\s+)?[0-9]+\})?/i;
    const match = modifiers.match(regex);

    if (!match)
      return false;

    let candidates = match.slice(1);

    let max = candidates[0] ? [ candidates[0] ] : candidates[1].replace(/[\{\}]/g, "").split(",");
    max = max.map(element => Number(element));

    let target = max;
    max = null;

    let checked = 0;
    let initial = this.results.length;

    while (checked < this.results.length) {
      let r = this.results[checked];

      checked++;

      if (!r.active)
        continue;

      if ((max !== null) && (max <= 0))
        break;


      if (FuryDie._resultInTargetArray(r.result, target)) {
        r.exploded = true,
        this.roll();
        if ( max !== null ) max -= 1;
      }

      if (!recursive && (checked >= initial)) checked = this.results.length;
      if (checked > 1000) throw new Error("Maximum recursion depth for exploding dice roll exceeded");
    }
  }

  static _resultInTargetArray(result, targetArray) {
    return targetArray.includes(result);
  }
}