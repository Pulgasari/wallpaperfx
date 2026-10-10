// what the chrome owns, persisted in localStorage: bookmarks and their folders,
// tab groups (keyed by native tab id), userscripts, search engines, appearance.
// the key stays "browser" so existing data carries over.

const KEY = 'browser';

// every dock button, in default order. devtools starts hidden
export const DOCK_IDS = ['tabs', 'marks', 'find', 'userscripts', 'devtools', 'settings'];

// a search engine is any url with %s for the query
const defaultEngines = () => [
  { id: 'ddg',       name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=%s',                    icon: '' },
  { id: 'google',    name: 'Google',     url: 'https://www.google.com/search?q=%s',              icon: '' },
  { id: 'wikipedia', name: 'Wikipedia',  url: 'https://en.wikipedia.org/w/index.php?search=%s', icon: '' },
];

const defaultSettings = () => ({
  bg        : '#0c0d10',
  fg        : '#edeef0',
  accent    : '#4f8cff',
  dockPos   : 'bottom',
  loaderPos : 'bottom',
  dockSize  : 46,
  dockGap   : 12,
  dock      : DOCK_IDS.map(id => ({ id, on: id !== 'devtools' })),
});

const list   = value => Array.isArray(value) ? value : [];
const record = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};

// the stored dock in its saved order, unknown ids dropped, new ones appended
function reconcileDock (dock) {
  const seen = new Set;
  const kept = list(dock).filter(item => item && DOCK_IDS.includes(item.id) && !seen.has(item.id) && seen.add(item.id));
  return [...kept, ...DOCK_IDS.filter(id => !seen.has(id)).map(id => ({ id, on: id !== 'devtools' }))];
}

function load () {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch {}

  const settings = { ...defaultSettings(), ...record(saved.settings) };
  settings.dock  = reconcileDock(settings.dock);

  const engines       = list(saved.engines).length ? saved.engines : defaultEngines();
  const defaultEngine = engines.some(engine => engine.id === saved.defaultEngine) ? saved.defaultEngine : engines[0]?.id;

  return {
    bookmarks       : list(saved.bookmarks),
    bookmarkFolders : list(saved.bookmarkFolders),
    groups          : list(saved.groups),
    tabGroups       : record(saved.tabGroups),
    userscripts     : list(saved.userscripts),
    engines,
    defaultEngine,
    settings,
  };
}

export const store = load();

export function save () {
  try { localStorage.setItem(KEY, JSON.stringify(store)); } catch {}
}
