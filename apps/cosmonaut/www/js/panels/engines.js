// search engines: a name, a url with %s for the query and an optional icon url.
// anything with a query parameter works, not only search engines

import { byId, h, initial, isolated, uid } from '../dom.js';
import { icon } from '../icons.js';
import { definePanel } from '../panels.js';
import { save, store } from '../store.js';

const list  = byId('engineList');
const empty = byId('enginesEmpty');
const form  = {
  box       : byId('engineEditor'),
  name      : byId('engName'),
  url       : byId('engUrl'),
  icon      : byId('engIcon'),
  isDefault : byId('engDefault'),
  remove    : byId('engDelete'),
};
let editing = null;

function engineRow (engine) {
  const badge = engine.id === store.defaultEngine && h('span', { class: 'tags' }, h('span', { class: 'tag', text: 'Default' }));
  return h('li', { class: 'row', on: { click: () => openEditor(engine) } },
    h('span', { class: 'ricon', text: initial(engine.name) }),
    h('span', { class: 'rtext' }, h('b', { text: engine.name }), h('span', { text: engine.url }), badge),
    h('button', { class: 'icon-btn', 'aria-label': 'Edit', html: icon('pencil'), on: { click: isolated(() => openEditor(engine)) } }));
}

function render () {
  form.box.hidden = true;
  list.hidden     = false;
  list.replaceChildren(...store.engines.map(engineRow));
  empty.hidden    = store.engines.length > 0;
}

function openEditor (engine) {
  editing = engine ?? { id: uid('e'), name: '', url: '', icon: '' };
  form.name.value        = editing.name || '';
  form.url.value         = editing.url || '';
  form.icon.value        = editing.icon || '';
  form.isDefault.checked = editing.id === store.defaultEngine;
  form.remove.hidden     = !store.engines.includes(editing);
  list.hidden     = true;
  empty.hidden    = true;
  form.box.hidden = false;
}

// an engine without a url is not kept
function saveEditor () {
  if (!editing) return;
  const url = form.url.value.trim();
  if (url) {
    Object.assign(editing, { name: form.name.value.trim() || 'Search', url, icon: form.icon.value.trim() });
    if (!store.engines.includes(editing)) store.engines.push(editing);
    if (form.isDefault.checked) store.defaultEngine = editing.id;
    save();
  }
  render();
}

function deleteEdited () {
  if (!editing) return;
  store.engines = store.engines.filter(engine => engine !== editing);
  if (store.defaultEngine === editing.id) store.defaultEngine = store.engines[0]?.id;
  editing = null;
  save();
  render();
}

byId('newEngineBtn').addEventListener('click', () => openEditor(null));
byId('engSave').addEventListener('click', saveEditor);
byId('engCancel').addEventListener('click', render);
byId('engDelete').addEventListener('click', deleteEdited);

definePanel('engines', byId('panelEngines'), { render });
