// userscripts, managed here and pushed to native, which injects each enabled one
// at document end into pages whose url matches one of its globs

import { html } from '@htx/js';

import { byId, isolated, uid } from '../dom.js';
import { call } from '../native.js';
import { definePanel } from '../panels.js';
import { save, store } from '../store.js';

const list  = byId('scriptList');
const empty = byId('scriptsEmpty');
const form  = {
  name    : byId('scriptName'),
  matches : byId('scriptMatches'),
  code    : byId('scriptCode'),
  enabled : byId('scriptEnabled'),
  box     : byId('scriptEditor'),
};
let editing = null;

export function pushUserscripts () {
  call('setUserscripts', { scripts: store.userscripts.map(({ code, enabled, matches, name }) => ({ code, enabled, matches, name })) });
}

const commit = () => { save(); pushUserscripts(); };

function scriptRow (script) {
  const toggle = event => { script.enabled = event.target.checked; commit(); };
  const remove = () => { store.userscripts = store.userscripts.filter(other => other.id !== script.id); commit(); render(); };

  return html`
    <li.row onClick=${() => openEditor(script)}>
      <span.rtext><b>${script.name || 'Script'}</b><span>${script.matches?.join(' ') || 'all pages'}</span></span>
      <input type="checkbox" checked=${script.enabled !== false} onClick=${event => event.stopPropagation()} onChange=${toggle} />
      <button.icon-btn aria-label="Delete" onClick=${isolated(remove)}>×</button>
    </li>`;
}

function render () {
  form.box.hidden = true;
  list.hidden     = false;
  list.replaceChildren(...store.userscripts.map(scriptRow));
  empty.hidden    = store.userscripts.length > 0;
}

function openEditor (script) {
  editing = script ?? { id: uid('u'), name: '', matches: [], code: '', enabled: true };
  form.name.value      = editing.name || '';
  form.matches.value   = (editing.matches || []).join(' ');
  form.code.value      = editing.code || '';
  form.enabled.checked = editing.enabled !== false;
  form.box.hidden = false;
  list.hidden     = true;
  empty.hidden    = true;
}

function saveEditor () {
  Object.assign(editing, {
    name    : form.name.value.trim() || 'Script',
    matches : form.matches.value.split(/\s+/).filter(Boolean),
    code    : form.code.value,
    enabled : form.enabled.checked,
  });
  if (!store.userscripts.includes(editing)) store.userscripts.push(editing);
  commit();
  render();
}

byId('newScriptBtn').addEventListener('click', () => openEditor(null));
byId('scriptSave').addEventListener('click', saveEditor);
byId('scriptCancel').addEventListener('click', render);

definePanel('scripts', byId('panelScripts'), { render });
