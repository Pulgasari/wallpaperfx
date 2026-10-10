// the url / search panel: the field, suggestions from bookmarks and open tabs,
// and while a search is typed a row of engines to send it to

import { html } from '@htx/js';

import { byId, domainOf, initial } from '../dom.js';
import { activeTab, session } from '../native.js';
import { definePanel } from '../panels.js';
import { go, isUrlLike } from '../search.js';
import { store } from '../store.js';

const input   = byId('urlInput');
const suggest = byId('suggest');
const engines = byId('engineRow');

const MAX_SUGGESTIONS = 12;
const SCHEME          = /^[a-z]+:\/\//i;

function suggestions (raw) {
  const typed = raw.trim();
  const query = typed.toLowerCase();
  const items = [];

  // the input itself first, once it reads as a url or a phrase
  if (query && (query.includes('.') || query.includes(' ') || SCHEME.test(query))) {
    items.push({ title: typed, sub: isUrlLike(typed) ? 'open' : 'search', url: typed });
  }

  const pool = [
    ...store.bookmarks.map(mark => ({ title: mark.title || domainOf(mark.url), sub: domainOf(mark.url), url: mark.url })),
    ...session.tabs.filter(tab => tab.id !== session.activeId)
      .map(tab => ({ title: tab.title || domainOf(tab.url), sub: domainOf(tab.url) + ' · tab', url: tab.url })),
  ];
  for (const item of pool) {
    if (items.length >= MAX_SUGGESTIONS) break;
    if (!query || `${item.title} ${item.url}`.toLowerCase().includes(query)) items.push(item);
  }
  return items;
}

function renderSuggestions () {
  suggest.replaceChildren(...suggestions(input.value).map(item =>
    html`<li onClick=${() => go(item.url)}><b>${item.title}</b><span>${item.sub}</span></li>`));
}

// the engine's icon, or its initial when it has none or the icon fails to load
const engineButton = engine => {
  const letter = initial(engine.name);
  return html`
    <button.eng class=${{ default: engine.id === store.defaultEngine }} title=${engine.name} onClick=${() => go(input.value, engine.id)}>
      ${engine.icon ? html`<img src=${engine.icon} alt="" onError=${event => event.target.replaceWith(letter)} />` : letter}
    </button>`;
};

function renderEngines () {
  const query  = input.value.trim();
  const search = Boolean(query) && !isUrlLike(query);
  engines.hidden = !search;
  engines.replaceChildren(...(search ? store.engines.map(engineButton) : []));
}

function render () {
  input.value = activeTab()?.url ?? '';
  renderSuggestions();
  renderEngines();
  setTimeout(() => { input.focus(); input.select(); }, 30);
}

input.addEventListener('input', () => { renderSuggestions(); renderEngines(); });
byId('urlForm').addEventListener('submit', event => { event.preventDefault(); go(input.value); });

definePanel('url', byId('panelUrl'), { render, update: renderSuggestions });
