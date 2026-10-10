// the start page of a new tab: the bookmarks as a grid

import { byId, domainOf, h, initial } from '../dom.js';
import { definePanel, openPanel } from '../panels.js';
import { go } from '../search.js';
import { store } from '../store.js';

function tile (mark) {
  const domain = domainOf(mark.url);
  return h('div', { class: 'tile', on: { click: () => go(mark.url) } },
    h('span', { class: 'fav', text: initial(domain) }),
    h('b', { text: mark.title || domain }));
}

function render () {
  byId('dashGrid').replaceChildren(...store.bookmarks.map(tile));
  byId('dashEmpty').hidden = store.bookmarks.length > 0;
}

byId('dashSearch').addEventListener('click', () => openPanel('url'));

definePanel('dash', byId('panelDash'), { render });
