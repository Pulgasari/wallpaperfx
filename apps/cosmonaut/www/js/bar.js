// the dock bar: buttons split evenly around the pill, the load progress on the
// content seam, and the appearance settings that drive both

import { html } from '@htx/js';

import { byId, domainOf } from './dom.js';
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

const dockButton = id => html`
  <button.trig title|aria-label=${DOCK[id].label} onClick=${DOCK[id].run} !html=${icon(DOCK[id].icon)} />`;

// the palette goes on body, where aufbau's palette sets it (see styles.css)
export function applyTheme () {
  const { accent, bg, blur, dockGap, dockSize, fg } = store.settings;
  const body = document.body.style;
  body.setProperty('--color-bg', bg);
  body.setProperty('--color-fg', fg);
  body.setProperty('--color-ink', accent);
  document.documentElement.style.setProperty('--dock-size', dockSize + 'px');
  document.documentElement.style.setProperty('--dock-gap', dockGap + 'px');
  document.body.classList.toggle('no-blur', !blur);
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

// the native strip (the collapsed chrome webview) is exactly the dock bar: its
// measured height, in css px (= dp in the webview), goes to native, which sizes
// the strip and the content inset to it, and to --strip for what sits on the seam
export function watchStrip () {
  const bar = byId('bar');
  new ResizeObserver(() => {
    const height = Math.ceil(bar.getBoundingClientRect().height);
    document.documentElement.style.setProperty('--strip', height + 'px');
    call('setStripHeight', { height });
  }).observe(bar, { box: 'border-box' });
}

export function applyAll () {
  applyTheme();
  applyDock();
  applyLoader();
  renderBar();
}
