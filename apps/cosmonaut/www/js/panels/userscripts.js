// userscripts, managed here and pushed to native, which injects each enabled one
// at document end into pages whose url matches one of its globs. native only
// runs javascript, so a script's css goes along as a snippet that adds a <style>

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
  css     : byId('scriptCss'),
  enabled : byId('scriptEnabled'),
  box     : byId('scriptEditor'),
};
let editing = null;

// the css as a statement that appends it to the page, once per load
const styleSnippet = css => css?.trim()
  ? `\n;(() => { const style = document.createElement('style'); style.textContent = ${JSON.stringify(css)}; (document.head || document.documentElement).append(style); })();`
  : '';

export function pushUserscripts () {
  call('setUserscripts', { scripts: store.userscripts.map(({ code, css, enabled, matches, name }) => ({ code: (code || '') + styleSnippet(css), enabled, matches, name })) });
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
  editing = script ?? { id: uid('u'), name: '', matches: [], code: '', css: '', enabled: true };
  form.name.value      = editing.name || '';
  form.matches.value   = (editing.matches || []).join(' ');
  form.code.value      = editing.code || '';
  form.css.value       = editing.css || '';
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
    css     : form.css.value,
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
