// small dom helpers. the chrome has no framework: elements are built with htx
// (@htx/js, a dom builder, no vdom) and every list is re-rendered whole from
// state, which is cheap at this size.

import { html } from '@htx/js';

export const byId = id => document.getElementById(id);

// a listener that does not let the click reach the row it sits in
export const isolated = fn => event => { event.stopPropagation(); fn(event); };

export const uid = prefix => prefix + Math.random().toString(36).slice(2, 8);

export const domainOf = url => {
  try   { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return url || ''; }
};

// the letter a row or tile shows in place of a favicon
export const initial = text => (String(text || '')[0] || '?').toUpperCase();

// a row of mutually exclusive buttons. options: [[value, label], ...]
export function segmented (box, options, current, onPick) {
  box.replaceChildren(...options.map(([value, label]) =>
    html`<button.seg-btn class=${{ active: value === current }} onClick=${() => onPick(value)}>${label}</button>`));
}

// items in buckets by key, in first-seen order
export function bucketsBy (items, keyOf) {
  const buckets = new Map;
  for (const item of items) {
    const key = keyOf(item);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(item);
  }
  return buckets;
}

// a section of rows under an optional heading, used by tabs and bookmarks
export const group = (title, rows) => html`
  <div.group>
    ${title && html`<div.group-head><span>${title}</span><span.line /></div>`}
    <ul.rows>${rows}</ul>
  </div>`;

// fires handler on a long press (and on right-click, for the desktop mock), and
// swallows the click that follows so a long press does not also tap through
export function onLongPress (el, handler, ms = 450) {
  let timer = null, x = 0, y = 0, fired = false;
  const clear = () => { clearTimeout(timer); timer = null; };

  el.addEventListener('pointerdown', event => {
    fired = false; x = event.clientX; y = event.clientY; clear();
    timer = setTimeout(() => { fired = true; handler(event); }, ms);
  });
  el.addEventListener('pointermove', event => { if (timer && Math.hypot(event.clientX - x, event.clientY - y) > 10) clear(); });
  el.addEventListener('pointerup', clear);
  el.addEventListener('pointercancel', clear);
  el.addEventListener('click', event => { if (fired) { event.stopPropagation(); event.preventDefault(); fired = false; } }, true);
  el.addEventListener('contextmenu', event => { event.preventDefault(); clear(); handler(event); });
}
