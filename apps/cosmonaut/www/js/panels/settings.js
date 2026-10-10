// appearance and dock settings. every change is saved and applied live

import { applyDock, applyLoader, applyTheme, DOCK } from '../bar.js';
import { byId, h, segmented } from '../dom.js';
import { icon } from '../icons.js';
import { definePanel, openPanel } from '../panels.js';
import { save, store } from '../store.js';

const settings = () => store.settings;
const SIDES    = [['bottom', 'Bottom'], ['top', 'Top']];

// a setting changed: persist, then apply what depends on it
const change = (apply, update) => { update(settings()); save(); apply(); };

function moveDockItem (index, step) {
  const dock = settings().dock, target = index + step;
  if (target < 0 || target >= dock.length) return;
  [dock[index], dock[target]] = [dock[target], dock[index]];
  save();
  applyDock();
  renderDockList();
}

function renderDockList () {
  const dock = settings().dock;
  byId('dockList').replaceChildren(...dock.map((item, index) => {
    const toggle = h('input', { type: 'checkbox', checked: item.on, on: { change: () => change(applyDock, () => { item.on = toggle.checked; }) } });
    return h('li', { class: 'row' },
      h('span', { class: 'ricon', html: icon(DOCK[item.id].icon) }),
      h('span', { class: 'rtext' }, h('b', { text: DOCK[item.id].label })),
      h('button', { class: 'icon-btn', text: '↑', 'aria-label': 'Move up',   disabled: index === 0,               on: { click: () => moveDockItem(index, -1) } }),
      h('button', { class: 'icon-btn', text: '↓', 'aria-label': 'Move down', disabled: index === dock.length - 1, on: { click: () => moveDockItem(index, 1) } }),
      toggle);
  }));
}

function render () {
  const { accent, bg, dockGap, dockPos, dockSize, fg, loaderPos } = settings();
  byId('colBg').value     = bg;
  byId('colFg').value     = fg;
  byId('colAccent').value = accent;
  segmented(byId('dockPosSeg'),   SIDES, dockPos,   value => { change(applyDock,   s => { s.dockPos = value; });   render(); });
  segmented(byId('loaderPosSeg'), SIDES, loaderPos, value => { change(applyLoader, s => { s.loaderPos = value; }); render(); });
  byId('rangeDockSize').value      = dockSize;
  byId('valDockSize').textContent  = dockSize + 'px';
  byId('rangeDockGap').value       = dockGap;
  byId('valDockGap').textContent   = dockGap + 'px';
  renderDockList();
}

const color = (id, key) => byId(id).addEventListener('input', event => change(applyTheme, s => { s[key] = event.target.value; }));
color('colBg', 'bg');
color('colFg', 'fg');
color('colAccent', 'accent');

const range = (id, valueId, key) => byId(id).addEventListener('input', event => {
  change(applyTheme, s => { s[key] = Number(event.target.value); });
  byId(valueId).textContent = settings()[key] + 'px';
});
range('rangeDockSize', 'valDockSize', 'dockSize');
range('rangeDockGap', 'valDockGap', 'dockGap');

byId('openEngines').addEventListener('click', () => openPanel('engines'));

definePanel('settings', byId('panelSettings'), { render });
