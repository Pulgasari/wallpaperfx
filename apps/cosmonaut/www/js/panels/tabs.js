// the tabs overview. the tabs are native (session), their grouping is chrome
// side: store.groups in order, store.tabGroups maps a tab id to a group id

import { html } from '@htx/js';

import { bucketsBy, byId, domainOf, group, initial, isolated, uid } from '../dom.js';
import { call, session } from '../native.js';
import { closePanel, definePanel, openPanel } from '../panels.js';
import { save, store } from '../store.js';

const box = byId('tabGroups');

function setGroup (tabId, groupId) {
  if (groupId) store.tabGroups[tabId] = groupId;
  else delete store.tabGroups[tabId];
  save();
  render();
}

// the value is set by ref: props are written before the options exist
const groupSelect = tab => html`
  <select.mini-select
    onClick=${event => event.stopPropagation()}
    onChange=${event => setGroup(tab.id, event.target.value)}
    ref=${select => { select.value = store.tabGroups[tab.id] ?? ''; }}>
    <option value="">—</option>
    ${store.groups.map(item => html`<option value=${item.id}>${item.name}</option>`)}
  </select>`;

const activate = tab => () => { call('activateTab', { id: tab.id }); closePanel(); };

function tabRow (tab) {
  const domain = domainOf(tab.url);
  return html`
    <li.row class=${{ active: tab.id === session.activeId }} onClick=${activate(tab)}>
      <span.ricon>${initial(domain)}</span>
      <span.rtext><b>${tab.title || domain || 'New tab'}</b><span>${domain}</span></span>
      ${groupSelect(tab)}
      <button.icon-btn aria-label="Close tab" onClick=${isolated(() => call('closeTab', { id: tab.id }))}>×</button>
    </li>`;
}

// the named groups in their order, then the tabs in none
function render () {
  const buckets = bucketsBy(session.tabs, tab => store.tabGroups[tab.id] ?? '');
  const order   = [...store.groups.map(item => item.id).filter(id => buckets.has(id)), ...(buckets.has('') ? [''] : [])];
  const nameOf  = id => store.groups.find(item => item.id === id)?.name ?? '';
  box.replaceChildren(...order.map(id => group(id && nameOf(id), buckets.get(id).map(tabRow))));
}

function newGroup () {
  const name = prompt('Group name:', 'Group');
  if (name == null) return;
  store.groups.push({ id: uid('g'), name: name.trim() || 'Group' });
  save();
  render();
}

byId('newGroupBtn').addEventListener('click', newGroup);
byId('newTabBtn').addEventListener('click', async () => { await call('newTab'); openPanel('dash'); });

definePanel('tabs', byId('panelTabs'), { render, update: render });
