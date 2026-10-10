// cosmonaut chrome: the dock and panels over the native content webviews (see
// ../../ARCHITECTURE.md). tabs come from native "state" events, everything the
// chrome owns comes from the store. each panel module registers itself on import.

import { applyAll, renderBar } from './bar.js';
import { byId, onLongPress } from './dom.js';
import { icon } from './icons.js';
import { call, plugin, setSession } from './native.js';
import { closePanel, openPanel, syncPanels } from './panels.js';

import './panels/bookmarks.js';
import './panels/dash.js';
import './panels/engines.js';
import './panels/find.js';
import { openUrlBarMenu } from './panels/menu.js';
import './panels/settings.js';
import './panels/tabs.js';
import './panels/url.js';
import { pushUserscripts } from './panels/userscripts.js';

const pill = byId('pill');

byId('urlGo').innerHTML = icon('go');
pill.addEventListener('click', () => openPanel('url'));
onLongPress(pill, () => openUrlBarMenu(pill));
document.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closePanel));

plugin.addListener('state', state => {
  setSession(state);
  renderBar();
  syncPanels(state);
});

applyAll();
pushUserscripts();

const initial = await call('ready');
if (initial) setSession(initial);
renderBar();
