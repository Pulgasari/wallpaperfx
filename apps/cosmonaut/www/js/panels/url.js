// the url / search panel: the field, suggestions from bookmarks and open tabs,
// and while a search is typed a row of engines to send it to

import { byId, domainOf, h, initial } from '../dom.js';
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
    h('li', { on: { click: () => go(item.url) } }, h('b', { text: item.title }), h('span', { text: item.sub }))));
}

const engineButton = engine => {
  const button = h('button', { class: 'eng' + (engine.id === store.defaultEngine ? ' default' : ''), title: engine.name, on: { click: () => go(input.value, engine.id) } });
  const letter = () => { button.textContent = initial(engine.name); };
  if (engine.icon) button.append(h('img', { src: engine.icon, alt: '', on: { error: letter } }));
  else letter();
  return button;
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
