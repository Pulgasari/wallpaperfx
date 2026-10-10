// panels are fixed overlays drawn while the chrome webview is expanded to full
// screen (the resize trick in ../../ARCHITECTURE.md). one is open at a time.
//
//   definePanel('tabs', element, { render, update, close })
//
// render runs on open, update on every native state change while open, close
// when the panel goes away (by the chrome or by the native back button).

import { call } from './native.js';

const panels = new Map;
let current = null;

export const definePanel = (name, el, hooks = {}) => panels.set(name, { el, ...hooks });

export const openPanelName = () => current;

const hideAll = () => panels.forEach(panel => { panel.el.hidden = true; });

// drops the open panel, its close hook included, without touching native
function drop () {
  const panel = panels.get(current);
  hideAll();
  current = null;
  panel?.close?.();
}

export async function openPanel (name) {
  drop();
  current = name;
  await call('setChromeExpanded', { expanded: true });
  const panel = panels.get(name);
  panel.el.hidden = false;
  panel.render?.();
}

export async function closePanel () {
  drop();
  await call('setChromeExpanded', { expanded: false });
}

// a native state arrived: a collapse (back button) closes the panel, otherwise
// the open panel gets to update from it
export function syncPanels (state) {
  if (!state.expanded) { if (current) drop(); return; }
  panels.get(current)?.update?.();
}
