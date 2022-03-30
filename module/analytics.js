export const triggerAnalytics = async () => {
  if (game.user.isGM) {
    const systemId = game.settings.get("zweihander", "systemId");
    if (systemId === '') {
      await Promise.all(game.messages.filter(x => x.data.flags?.zweihander?.analytics).map(x => x.delete()));
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ alias: 'F&H Development' }),
        flavor: 'Wants to create premium content for this system and needs your help',
        flags: { zweihander: { img: 'systems/zweihander/assets/icons/informer.svg', analytics: {} } },
        whisper: [game.user.id],
        content: `
          <h2>Usage Survey</h2>
          Hello there, thanks for using our system for playing Zweihänder!<br/>
          We are currently evaluating the potential of providing premium modules for this system.<br/>
          In order to make an educated decision, we need to know how many GMs use this system regularly. Therefore, we designed this <strong>100% privacy-respecting</strong> automatic usage survey.<br/>
          As part of the automatic usage survey,
          <ul>
            <li> we will generate an anonymous unique identifier for this installation </li>
            <li> we will send this identifier together with the currently used version number to our website </li>
            <li> we will <strong> NOT </strong> create a digital fingerprint </li>
            <li> we will <strong> NOT </strong> use tracking cookies </li>
            <li> we will <strong> NOT </strong> track your IP </li>
          </ul>
          <p>
          Please consider participating!
          </p>
          <button type="button" class="analytics-agree" disabled="disabled">Yes, I want to participate</button> 
          <button type="button" class="analytics-decline" disabled="disabled">No, I don't want to participate</button> 
        `
      })
    } else if (systemId !== 'no-analytics') {
      sendAnalytics()
    }
  }
}

export const sendAnalytics = () => {
  const systemId = game.settings.get("zweihander", "systemId");
  const url = `https://kxfin.xyz/zh-analytics.php?id=${systemId}&version=${game.system.data.version}`;
  const request = new XMLHttpRequest();
  request.open('GET', url);
  request.send();
  console.info(`Send system id: "${systemId}" & version: "${game.system.data.version}" data to ${url}.`)
}