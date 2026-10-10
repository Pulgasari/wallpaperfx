// the tabs overview. the tabs are native (session), their grouping is chrome
// side: store.groups in order, store.tabGroups maps a tab id to a group id

import { bucketsBy, byId, domainOf, group, h, initial, isolated, uid } from '../dom.js';
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

function groupSelect (tab) {
  const select = h('select', { class: 'mini-select', on: { click: event => event.stopPropagation(), change: () => setGroup(tab.id, select.value) } },
    h('option', { value: '', text: '—' }),
    store.groups.map(item => h('option', { value: item.id, text: item.name })));
  select.value = store.tabGroups[tab.id] ?? '';
  return select;
}

function tabRow (tab) {
  const domain = domainOf(tab.url);
  return h('li', { class: 'row' + (tab.id === session.activeId ? ' active' : ''), on: { click: () => { call('activateTab', { id: tab.id }); closePanel(); } } },
    h('span', { class: 'ricon', text: initial(domain) }),
    h('span', { class: 'rtext' }, h('b', { text: tab.title || domain || 'New tab' }), h('span', { text: domain })),
    groupSelect(tab),
    h('button', { class: 'icon-btn', text: '×', 'aria-label': 'Close tab', on: { click: isolated(() => call('closeTab', { id: tab.id })) } }));
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
