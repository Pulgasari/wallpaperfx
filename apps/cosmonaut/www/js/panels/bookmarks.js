// the bookmarks panel, three views in one sheet: the list (by folder), the
// editor of one bookmark, and import / export

import {
  detectFormat, fromJson, fromNetscape, pickTextFile, saveTextFile, toJson, toNetscape,
} from '../bookmarks-io.js';
import { html } from '@htx/js';

import { bucketsBy, byId, domainOf, group, initial, isolated, segmented, uid } from '../dom.js';
import { icon } from '../icons.js';
import { activeTab } from '../native.js';
import { definePanel, openPanelName } from '../panels.js';
import { go } from '../search.js';
import { save, store } from '../store.js';

const views = {
  list   : [byId('markTagBar'), byId('markGroups'), byId('marksEmpty')],
  editor : [byId('markEditor')],
  io     : [byId('markIO')],
};

function showView (name) {
  for (const [view, elements] of Object.entries(views)) {
    for (const el of elements) el.hidden = view !== name;
  }
}

// :::::: LIST

const folderName = id => store.bookmarkFolders.find(folder => folder.id === id)?.name ?? '';

// the tag the list is filtered by, null for all
let tagFilter = null;

const filterBy = tag => { tagFilter = tagFilter === tag ? null : tag; renderList(); };

const tagChip = tag => html`<button.tag class=${{ active: tag === tagFilter }} onClick=${isolated(() => filterBy(tag))}>${tag}</button>`;

function markRow (mark) {
  const domain = domainOf(mark.url);
  const tags   = mark.tags?.length && html`<span.tags>${mark.tags.map(tagChip)}</span>`;
  return html`
    <li.row onClick=${() => go(mark.url)}>
      <span.ricon>${initial(domain)}</span>
      <span.rtext><b>${mark.title || domain}</b><span>${domain}</span>${tags}</span>
      <button.icon-btn aria-label="Edit" onClick=${isolated(() => openEditor(mark))} !html=${icon('pencil')} />
    </li>`;
}

// the folders in their order, then the bookmarks in none; with a tag filter
// only the bookmarks that carry it
function renderList () {
  const tags = [...new Set(store.bookmarks.flatMap(mark => mark.tags ?? []))].sort();
  if (!tags.includes(tagFilter)) tagFilter = null;

  const shown   = tagFilter ? store.bookmarks.filter(mark => mark.tags?.includes(tagFilter)) : store.bookmarks;
  const buckets = bucketsBy(shown, mark => mark.folder || '');
  const order   = [...store.bookmarkFolders.map(folder => folder.id).filter(id => buckets.has(id)), ...(buckets.has('') ? [''] : [])];
  const titleOf = id => id ? folderName(id) : store.bookmarkFolders.length ? 'No folder' : '';

  byId('markGroups').replaceChildren(...order.map(id => group(titleOf(id), buckets.get(id).map(markRow))));
  byId('markTagBar').replaceChildren(...tags.map(tagChip));
  showView('list');
  byId('markTagBar').hidden = tags.length === 0;
  byId('marksEmpty').hidden = store.bookmarks.length > 0;
}

function newFolder () {
  const name = prompt('Folder name:', 'Folder');
  if (name == null) return;
  store.bookmarkFolders.push({ id: uid('f'), name: name.trim() || 'Folder' });
  save();
  renderList();
}

const newMark = tab => ({ id: uid('b'), url: tab.url, title: tab.title || domainOf(tab.url) });

function addCurrent () {
  const tab = activeTab();
  if (!tab?.url || store.bookmarks.some(mark => mark.url === tab.url)) return;
  store.bookmarks.unshift(newMark(tab));
  save();
  renderList();
}

export const isBookmarked = url => store.bookmarks.some(mark => mark.url === url);

export function toggleBookmark () {
  const tab = activeTab();
  if (!tab?.url) return;
  store.bookmarks = isBookmarked(tab.url)
    ? store.bookmarks.filter(mark => mark.url !== tab.url)
    : [newMark(tab), ...store.bookmarks];
  save();
  if (openPanelName() === 'marks') renderList();
}

// :::::: EDITOR

const editor = {
  title  : byId('markTitle'),
  url    : byId('markUrl'),
  folder : byId('markFolder'),
  tags   : byId('markTags'),
};
let editing = null;

function openEditor (mark) {
  editing = mark;
  editor.title.value = mark.title || '';
  editor.url.value   = mark.url || '';
  editor.tags.value  = (mark.tags || []).join(' ');
  editor.folder.replaceChildren(
    html`<option value="">No folder</option>`,
    ...store.bookmarkFolders.map(folder => html`<option value=${folder.id}>${folder.name}</option>`));
  editor.folder.value = mark.folder || '';
  showView('editor');
}

function saveEditor () {
  if (!editing) return;
  Object.assign(editing, {
    title  : editor.title.value.trim(),
    url    : editor.url.value.trim(),
    folder : editor.folder.value || undefined,
    tags   : editor.tags.value.split(/\s+/).filter(Boolean),
  });
  save();
  renderList();
}

function deleteEdited () {
  if (!editing) return;
  store.bookmarks = store.bookmarks.filter(mark => mark !== editing);
  editing = null;
  save();
  renderList();
}

// :::::: IMPORT / EXPORT

const ioText   = byId('markIoText');
const ioStatus = byId('markIoStatus');
let format = 'json';

const status = message => { ioStatus.textContent = message || ''; ioStatus.hidden = !message; };

function drawFormat () {
  segmented(byId('markIoFmt'), [['json', 'JSON'], ['html', 'HTML']], format, value => { format = value; drawFormat(); });
}

function openIo () {
  drawFormat();
  ioText.value = '';
  status('');
  showView('io');
}

async function exportMarks () {
  const text = format === 'html' ? toNetscape(store) : toJson(store);
  ioText.value = text;
  const where = await saveTextFile(`bookmarks.${format}`, text);
  status(where ? `saved: ${where}` : 'saving failed, the content above can be copied');
}

// merges by url: a bookmark whose url is already there is skipped
function importMarks (source) {
  const text = ioText.value.trim();
  if (!text) return status('nothing to import');

  const parsed = format === 'html' ? fromNetscape(text) : fromJson(text);
  if (!parsed) return status(`could not read this as ${format.toUpperCase()}`);

  const known = new Set(store.bookmarks.map(mark => mark.url));
  const added = parsed.bookmarks.filter(mark => mark.url && !known.has(mark.url) && known.add(mark.url));
  store.bookmarkFolders.push(...parsed.folders);
  store.bookmarks.push(...added);
  save();

  const skipped = parsed.bookmarks.length - added.length;
  status(`${added.length} imported` + (skipped ? ` (${skipped} already there)` : '') + (source ? ` from ${source}` : ''));
}

async function loadFile () {
  try {
    const { name, text } = await pickTextFile(byId('markIoFile'));
    format = detectFormat(name, text);
    drawFormat();
    ioText.value = text;
    importMarks(name);
  } catch {
    status('the file could not be read');
  }
}

// :::::: WIRING

byId('addMarkBtn').addEventListener('click', addCurrent);
byId('newFolderBtn').addEventListener('click', newFolder);
byId('markIoBtn').addEventListener('click', openIo);

byId('markSave').addEventListener('click', saveEditor);
byId('markDelete').addEventListener('click', deleteEdited);
byId('markCancel').addEventListener('click', renderList);

byId('markIoClose').addEventListener('click', renderList);
byId('markIoLoad').addEventListener('click', loadFile);
byId('markIoExport').addEventListener('click', exportMarks);
byId('markIoImport').addEventListener('click', () => importMarks());

definePanel('marks', byId('panelMarks'), { render: renderList });
