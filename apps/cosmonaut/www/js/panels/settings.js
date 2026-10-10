// appearance and dock settings. every change is saved and applied live

import { html } from '@htx/js';

import { applyDock, applyLoader, applyTheme, DOCK } from '../bar.js';
import { byId, segmented } from '../dom.js';
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
  const toggle = item => event => change(applyDock, () => { item.on = event.target.checked; });
  byId('dockList').replaceChildren(...dock.map((item, index) => html`
    <li.row>
      <span.ricon !html=${icon(DOCK[item.id].icon)} />
      <span.rtext><b>${DOCK[item.id].label}</b></span>
      <button.icon-btn aria-label="Move up"   disabled=${index === 0}               onClick=${() => moveDockItem(index, -1)}>↑</button>
      <button.icon-btn aria-label="Move down" disabled=${index === dock.length - 1} onClick=${() => moveDockItem(index, 1)}>↓</button>
      <input type="checkbox" checked=${item.on} onChange=${toggle(item)} />
    </li>`));
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
