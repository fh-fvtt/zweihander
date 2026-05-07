function _generateLinks() {
  const links = document.createElement('ul');
  links.classList.add('unlist', 'links');
  links.innerHTML = `
    <li>
      <a href="https://github.com/fh-fvtt/zweihander/releases/latest" target="_blank">
        ${game.i18n.localize('ZWEI.settings.versionsettings.notes')}
      </a>
    </li>
    <li>
      <a href="https://github.com/fh-fvtt/zweihander/issues" target="_blank">${game.i18n.localize(
        'ZWEI.settings.versionsettings.issues'
      )}</a>
    </li>
    <li>
      <a href="https://github.com/fh-fvtt/zweihander/wiki" target="_blank">${game.i18n.localize(
        'ZWEI.settings.versionsettings.wiki'
      )}</a>
    </li>
    <li>
      <a href="https://discord.gg/63Zrmd5tMK" target="_blank">
        ${game.i18n.localize('ZWEI.settings.versionsettings.discord')}
      </a>
    </li>
  `;
  return links;
}

export function renderSettings(html) {
  const pip = html.querySelector('.info .system .notification-pip');
  html.querySelector('.info .system').remove();

  const section = document.createElement('section');
  section.classList.add('zweihander', 'sidebar-info');
  section.innerHTML = `
    <h4 class="divider">${game.i18n.localize('WORLD.FIELDS.system.label')}</h4>
    <div class="system-badge flexcol">
      <img src="systems/zweihander/assets/zweihander-logo.webp" data-tooltip="Zweihänder" alt="Zweihänder">
      <span class="system-info">${game.system.version}</span>
    </div>
  `;
  section.append(_generateLinks());
  if (pip) section.querySelector('.system-info').insertAdjacentElement('beforeend', pip);
  html.querySelector('.info').insertAdjacentElement('afterend', section);
}
