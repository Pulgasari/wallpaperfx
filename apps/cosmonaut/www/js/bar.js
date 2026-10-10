// the dock bar: buttons split evenly around the pill, the load progress on the
// content seam, and the appearance settings that drive both

import { byId, domainOf, h } from './dom.js';
import { icon } from './icons.js';
import { activeTab, call } from './native.js';
import { closePanel, openPanel } from './panels.js';
import { store } from './store.js';

// every dock button by id (store.DOCK_IDS has the default order)
export const DOCK = {
  tabs        : { icon: 'tabs',    label: 'Tabs',         run: () => openPanel('tabs') },
  marks       : { icon: 'book',    label: 'Bookmarks',    run: () => openPanel('marks') },
  find        : { icon: 'search',  label: 'Find in page', run: () => openPanel('find') },
  userscripts : { icon: 'code',    label: 'Userscripts',  run: () => openPanel('scripts') },
  devtools    : { icon: 'console', label: 'Dev tools',    run: () => { call('toggleDevtools'); closePanel(); } },
  settings    : { icon: 'gear',    label: 'Settings',     run: () => openPanel('settings') },
};

const dockButton = id => h('button', {
  class        : 'trig',
  title        : DOCK[id].label,
  'aria-label' : DOCK[id].label,
  html         : icon(DOCK[id].icon),
  on           : { click: DOCK[id].run },
});

export function applyTheme () {
  const style = document.documentElement.style;
  const { accent, bg, dockGap, dockSize, fg } = store.settings;
  style.setProperty('--bg', bg);
  style.setProperty('--fg', fg);
  style.setProperty('--accent', accent);
  style.setProperty('--dock-size', dockSize + 'px');
  style.setProperty('--dock-gap', dockGap + 'px');
}

export function applyLoader () {
  document.body.classList.toggle('loader-top', store.settings.loaderPos === 'top');
}

export function applyDock () {
  const { dock, dockPos } = store.settings;
  document.body.classList.toggle('dock-top', dockPos === 'top');
  call('setDockPosition', { position: dockPos });

  const enabled = dock.filter(item => item.on).map(item => item.id);
  const half    = Math.ceil(enabled.length / 2);
  byId('dockLeft').replaceChildren(...enabled.slice(0, half).map(dockButton));
  byId('dockRight').replaceChildren(...enabled.slice(half).map(dockButton));
}

// the pill shows the active tab's domain, the bar its load progress
export function renderBar () {
  const tab     = activeTab();
  const loading = Boolean(tab?.loading && tab.progress < 100);
  byId('pillText').textContent = tab?.url ? domainOf(tab.url) : 'Search or URL';
  byId('prog').hidden = !loading;
  byId('progFill').style.width = (loading ? tab.progress : 0) + '%';
}

export function applyAll () {
  applyTheme();
  applyDock();
  applyLoader();
  renderBar();
}
