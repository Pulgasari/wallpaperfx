// the start page of a new tab: the bookmarks as a grid

import { html } from '@htx/js';

import { byId, domainOf, initial } from '../dom.js';
import { definePanel, openPanel } from '../panels.js';
import { go } from '../search.js';
import { store } from '../store.js';

function tile (mark) {
  const domain = domainOf(mark.url);
  return html`
    <div.tile onClick=${() => go(mark.url)}>
      <span.fav>${initial(domain)}</span>
      <b>${mark.title || domain}</b>
    </div>`;
}

function render () {
  byId('dashGrid').replaceChildren(...store.bookmarks.map(tile));
  byId('dashEmpty').hidden = store.bookmarks.length > 0;
}

byId('dashSearch').addEventListener('click', () => openPanel('url'));

definePanel('dash', byId('panelDash'), { render });
