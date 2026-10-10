// small dom helpers. the chrome has no framework: elements are built with h()
// and every list is re-rendered whole from state, which is cheap at this size.

export const byId = id => document.getElementById(id);

// h('button', { class: 'icon-btn', 'aria-label': 'close', on: { click } }, child, ...)
// props: class, text, html (trusted markup only, i.e. icons), on (listeners),
// dom properties (title, type, checked, value, disabled, hidden, ...), anything
// else as an attribute. null / false props and null / false / '' children are skipped.
export function h (tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value == null || value === false) continue;
    if      (key === 'class') el.className = value;
    else if (key === 'text')  el.textContent = value;
    else if (key === 'html')  el.innerHTML = value;
    else if (key === 'on')    for (const [type, fn] of Object.entries(value)) el.addEventListener(type, fn);
    else if (key in el && !key.includes('-')) el[key] = value;
    else el.setAttribute(key, value === true ? '' : value);
  }
  el.append(...children.flat().filter(child => child != null && child !== false && child !== ''));
  return el;
}

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
    h('button', { class: 'seg-btn' + (value === current ? ' active' : ''), text: label, on: { click: () => onPick(value) } })));
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
export const group = (title, rows) => h('div', { class: 'group' },
  title && h('div', { class: 'group-head' }, h('span', { text: title }), h('span', { class: 'line' })),
  h('ul', { class: 'rows' }, rows));

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
