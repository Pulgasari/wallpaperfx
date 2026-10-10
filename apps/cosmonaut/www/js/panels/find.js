// find in page: a transparent bar, the page stays visible behind it. the native
// side highlights matches and reports them as "find" events

import { byId } from '../dom.js';
import { call, plugin } from '../native.js';
import { definePanel } from '../panels.js';

const input = byId('findInput');
const count = byId('findCount');

function render () {
  input.value = '';
  count.textContent = '';
  setTimeout(() => input.focus(), 30);
}

input.addEventListener('input', () => call('findInPage', { query: input.value }));
byId('findForm').addEventListener('submit', event => { event.preventDefault(); call('findNext', { forward: true }); });
byId('findPrev').addEventListener('click', () => call('findNext', { forward: false }));

plugin.addListener('find', ({ count: total, done, index } = {}) => {
  count.textContent = total ? `${index + 1}/${total}` : done ? '0/0' : '';
});

definePanel('find', byId('panelFind'), { render, close: () => call('clearFind') });
