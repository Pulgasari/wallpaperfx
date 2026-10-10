// what the url field does with its input: a url opens as it is, anything else
// is a search with the default engine, or with the engine picked explicitly

import { call } from './native.js';
import { closePanel } from './panels.js';
import { store } from './store.js';

// a scheme, or a dotted word without spaces
export const isUrlLike = value => /^[a-z][a-z0-9+.-]*:\/\//i.test(value) || (value.includes('.') && !value.includes(' '));

export const engineById = id => store.engines.find(engine => engine.id === id);

export const defaultEngine = () => engineById(store.defaultEngine) ?? store.engines[0];

const searchUrl = (engine, query) => engine.url.includes('%s')
  ? engine.url.replaceAll('%s', encodeURIComponent(query))
  : engine.url + encodeURIComponent(query);

export function go (input, engineId) {
  const value = (input || '').trim();
  if (!value) return;

  const engine = engineId ? engineById(engineId) : isUrlLike(value) ? null : defaultEngine();
  call('navigate', { url: engine ? searchUrl(engine, value) : value });
  closePanel();
}
