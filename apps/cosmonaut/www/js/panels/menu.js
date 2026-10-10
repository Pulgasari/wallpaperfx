// a context menu: an anchored floating list. the collapsed chrome is only the
// dock strip, so the menu is a panel and expands the chrome to draw above it.
//
//   openMenu([{ label, icon, danger, run } | { separator: true }], anchor)
//
// anchor is an element (the menu centers on it horizontally) or { x }

import { html } from '@htx/js';

import { byId } from '../dom.js';
import { icon } from '../icons.js';
import { activeTab, call } from '../native.js';
import { closePanel, definePanel, openPanel } from '../panels.js';
import { isBookmarked, toggleBookmark } from './bookmarks.js';

const list = byId('menuList');

const menuItem = item => item.separator
  ? html`<li.sep role="separator" />`
  : html`
    <li role="menuitem" class=${{ danger: item.danger }} onClick=${() => { closePanel(); item.run(); }}>
      <span.mi !html=${item.icon ? icon(item.icon) : ''} />
      <span>${item.label}</span>
    </li>`;

function place (anchor) {
  const rect   = anchor?.getBoundingClientRect?.();
  const center = rect ? rect.left + rect.width / 2 : anchor?.x ?? window.innerWidth / 2;
  const left   = Math.min(Math.max(8, center - list.offsetWidth / 2), window.innerWidth - list.offsetWidth - 8);
  list.style.left = left + 'px';
}

export async function openMenu (items, anchor) {
  list.replaceChildren(...items.map(menuItem));
  await openPanel('menu');
  requestAnimationFrame(() => place(anchor));
}

// long press on the pill
export function openUrlBarMenu (anchor) {
  const tab = activeTab();
  openMenu([
    { label: tab && isBookmarked(tab.url) ? 'Remove bookmark' : 'Add bookmark', icon: 'book', run: toggleBookmark },
    { separator: true },
    { label: 'Reload',      icon: 'reload', run: () => call('reload') },
    { label: 'Hard reload', icon: 'bolt',   run: () => call('hardReload') },
    { separator: true },
    { label: 'Close tab',   icon: 'x', danger: true, run: () => tab && call('closeTab', { id: tab.id }) },
  ], anchor);
}

definePanel('menu', byId('panelMenu'));
