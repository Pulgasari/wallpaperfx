// minimalist browser chrome. plain js. drives the native Browser plugin (tabs =
// native content webviews) and re-renders on "state" events. bookmarks, groups,
// userscripts and appearance are chrome-side (localStorage). a mock keeps the ui
// usable in a plain browser for layout/screenshots. see ../ARCHITECTURE.md.
(function () {
    'use strict';

    const domainOf = url => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url || ''; } };

    function getPlugin() {
        const cap = window.Capacitor;
        if (cap && cap.Plugins && cap.Plugins.Browser) return cap.Plugins.Browser;
        const listeners = {};
        const emit = (ev, d) => (listeners[ev] || []).forEach(fn => fn(d));
        let tabs = [
            { id: 't1', url: 'https://duckduckgo.com/', title: 'DuckDuckGo', loading: false, progress: 100, canGoBack: false },
            { id: 't2', url: 'https://news.ycombinator.com/', title: 'Hacker News', loading: false, progress: 100, canGoBack: true },
            { id: 't3', url: 'https://developer.mozilla.org/', title: 'MDN Web Docs', loading: false, progress: 100, canGoBack: false },
        ];
        let activeId = 't2', expanded = false, n = 3;
        const state = () => ({ tabs: JSON.parse(JSON.stringify(tabs)), activeId, expanded });
        const push = () => emit('state', state());
        return {
            async ready() { return state(); },
            async getState() { return state(); },
            async navigate({ url }) {
                let t = tabs.find(x => x.id === activeId) || tabs[0];
                t.url = /^[a-z]+:\/\//i.test(url) ? url : (url.includes('.') && !url.includes(' ') ? 'https://' + url : 'https://duckduckgo.com/?q=' + encodeURIComponent(url));
                t.title = domainOf(t.url); expanded = false; push(); return state();
            },
            async newTab({ url }) { const id = 't' + (++n); tabs.push({ id, url: url || 'https://duckduckgo.com/', title: 'Neuer Tab', loading: false, progress: 100, canGoBack: false }); activeId = id; push(); return state(); },
            async closeTab({ id }) { tabs = tabs.filter(t => t.id !== id); if (activeId === id) activeId = tabs.length ? tabs[tabs.length - 1].id : ''; push(); return state(); },
            async activateTab({ id }) { activeId = id; push(); return state(); },
            async goBack() { return state(); }, async goForward() { return state(); }, async reload() { return state(); }, async hardReload() { return state(); },
            async setChromeExpanded({ expanded: e }) { expanded = e; push(); return state(); },
            async setDockPosition() {}, async findInPage() {}, async findNext() {}, async clearFind() {},
            async toggleDevtools() {}, async setUserscripts() {},
            addListener(ev, fn) { (listeners[ev] = listeners[ev] || []).push(fn); return { remove() { listeners[ev] = (listeners[ev] || []).filter(f => f !== fn); } }; },
        };
    }
    const plugin = getPlugin();

    // ---- icons ----
    const ICONS = {
        tabs: '<rect x="4" y="4" width="16" height="16" rx="3"/><line x1="4" y1="9" x2="20" y2="9"/>',
        book: '<path d="M7 4h10a1 1 0 0 1 1 1v15l-6-4-6 4V5a1 1 0 0 1 1-1z"/>',
        go: '<line x1="5" y1="12" x2="18" y2="12"/><path d="M13 7l5 5-5 5"/>',
        search: '<circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/>',
        console: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9l3 3-3 3"/><line x1="13" y1="15" x2="17" y2="15"/>',
        code: '<path d="M8 8l-4 4 4 4"/><path d="M16 8l4 4-4 4"/><line x1="13.5" y1="6" x2="10.5" y2="18"/>',
        gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 3.5v2.4M12 18.1v2.4M20.5 12h-2.4M5.9 12H3.5M18 6l-1.7 1.7M7.7 16.3L6 18M18 18l-1.7-1.7M7.7 7.7L6 6"/>',
        reload: '<path d="M20 11a8 8 0 1 0-2.34 5.66"/><path d="M20 4v5h-5"/>',
        bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
        x: '<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>',
        pencil: '<path d="M4 20h4L18.5 9.5a2 2 0 0 0-2.83-2.83L5 17.5V20z"/><path d="M13.5 6.5l4 4"/>',
    };
    const svg = name => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';

    const $ = id => document.getElementById(id);
    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const uid = p => p + Math.random().toString(36).slice(2, 8);
    const STORE = 'browser';

    // ---- dock element catalog ----
    const DOCK = {
        tabs: { icon: 'tabs', label: 'Tabs', run: () => openPanel('tabs') },
        marks: { icon: 'book', label: 'Lesezeichen', run: () => openPanel('marks') },
        find: { icon: 'search', label: 'Auf Seite suchen', run: () => openPanel('find') },
        devtools: { icon: 'console', label: 'Dev-Tools', run: () => { plugin.toggleDevtools(); closePanel(); } },
        userscripts: { icon: 'code', label: 'Userscripts', run: () => openPanel('scripts') },
        settings: { icon: 'gear', label: 'Einstellungen', run: () => openPanel('settings') },
    };
    const DOCK_DEFAULT = [
        { id: 'tabs', on: true }, { id: 'marks', on: true }, { id: 'find', on: true },
        { id: 'userscripts', on: true }, { id: 'devtools', on: false }, { id: 'settings', on: true },
    ];
    const SETTINGS_DEFAULT = () => ({
        bg: '#0c0d10', fg: '#edeef0', accent: '#4f8cff',
        dockPos: 'bottom', loaderPos: 'bottom', dockSize: 46, dockGap: 12,
        dock: DOCK_DEFAULT.map(d => ({ ...d })),
    });
    // search engines: name + url with %s (the search word) + optional icon url. not
    // really "search" engines — anything with a query-param url works.
    const DEFAULT_ENGINES = () => ([
        { id: 'ddg', name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=%s', icon: '' },
        { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=%s', icon: '' },
        { id: 'wikipedia', name: 'Wikipedia', url: 'https://de.wikipedia.org/w/index.php?search=%s', icon: '' },
    ]);

    // ---- state ----
    let ns = { tabs: [], activeId: '', expanded: false };
    let local = loadLocal();
    let panel = null;
    const PANELS = ['panelUrl', 'panelFind', 'panelTabs', 'panelMarks', 'panelScripts', 'panelSettings', 'panelMenu', 'panelDash', 'panelEngines'];

    function loadLocal() {
        let s = {};
        try { s = JSON.parse(localStorage.getItem(STORE) || '{}'); } catch {}
        const settings = Object.assign(SETTINGS_DEFAULT(), s.settings || {});
        // reconcile dock list with the known catalog (keep order, add missing, drop unknown)
        const known = Object.keys(DOCK);
        const seen = new Set();
        settings.dock = (Array.isArray(settings.dock) ? settings.dock : [])
            .filter(d => d && known.includes(d.id) && !seen.has(d.id) && seen.add(d.id));
        for (const id of known) if (!seen.has(id)) settings.dock.push({ id, on: id !== 'devtools' });
        const engines = (Array.isArray(s.engines) && s.engines.length) ? s.engines : DEFAULT_ENGINES();
        const defaultEngine = s.defaultEngine && engines.some(e => e.id === s.defaultEngine) ? s.defaultEngine : (engines[0] && engines[0].id);
        return {
            bookmarks: Array.isArray(s.bookmarks) ? s.bookmarks : [],
            bookmarkFolders: Array.isArray(s.bookmarkFolders) ? s.bookmarkFolders : [],
            groups: Array.isArray(s.groups) ? s.groups : [],
            tabGroups: s.tabGroups && typeof s.tabGroups === 'object' ? s.tabGroups : {},
            userscripts: Array.isArray(s.userscripts) ? s.userscripts : [],
            engines, defaultEngine,
            settings,
        };
    }
    function saveLocal() { try { localStorage.setItem(STORE, JSON.stringify(local)); } catch {} }
    const activeTab = () => ns.tabs.find(t => t.id === ns.activeId) || null;

    // ---- appearance ----
    function applyAll() { applyTheme(); applyDock(); applyLoader(); renderBar(); }
    function applyTheme() {
        const st = document.documentElement.style, s = local.settings;
        st.setProperty('--bg', s.bg); st.setProperty('--fg', s.fg); st.setProperty('--accent', s.accent);
        st.setProperty('--dock-size', s.dockSize + 'px'); st.setProperty('--dock-gap', s.dockGap + 'px');
    }
    function applyLoader() {
        document.body.classList.toggle('loader-top', local.settings.loaderPos === 'top');
    }
    function applyDock() {
        document.body.classList.toggle('dock-top', local.settings.dockPos === 'top');
        try { plugin.setDockPosition({ position: local.settings.dockPos }); } catch {}
        const enabled = local.settings.dock.filter(d => d.on).map(d => d.id);
        const leftN = Math.ceil(enabled.length / 2);
        buildDockGroup($('dockLeft'), enabled.slice(0, leftN));
        buildDockGroup($('dockRight'), enabled.slice(leftN));
    }
    function buildDockGroup(box, ids) {
        box.innerHTML = '';
        for (const id of ids) {
            const def = DOCK[id]; if (!def) continue;
            const b = document.createElement('button');
            b.className = 'trig'; b.setAttribute('aria-label', def.label); b.title = def.label;
            b.innerHTML = svg(def.icon);
            b.addEventListener('click', def.run);
            box.appendChild(b);
        }
    }

    // ---- bar / progress ----
    function renderBar() {
        const t = activeTab();
        $('pillText').textContent = t && t.url ? domainOf(t.url) : 'Suchen oder URL';
        const p = t ? t.progress : 100;
        const loading = t && t.loading && p < 100;
        $('prog').hidden = !loading;
        $('progFill').style.width = (loading ? p : 0) + '%';
    }

    // ---- panels ----
    async function openPanel(name) {
        panel = name;
        PANELS.forEach(id => { $(id).hidden = true; });
        try { await plugin.setChromeExpanded({ expanded: true }); } catch {}
        const map = { url: 'panelUrl', find: 'panelFind', tabs: 'panelTabs', marks: 'panelMarks', scripts: 'panelScripts', settings: 'panelSettings', menu: 'panelMenu', dash: 'panelDash', engines: 'panelEngines' };
        $(map[name]).hidden = false;
        if (name === 'url') primeUrl();
        if (name === 'find') primeFind();
        if (name === 'tabs') renderTabs();
        if (name === 'marks') renderMarks();
        if (name === 'scripts') renderScripts();
        if (name === 'settings') renderSettings();
        if (name === 'dash') renderDash();
        if (name === 'engines') renderEngines();
    }
    async function closePanel() {
        const wasFind = panel === 'find';
        panel = null;
        PANELS.forEach(id => { $(id).hidden = true; });
        if (wasFind) { try { plugin.clearFind(); } catch {} }
        try { await plugin.setChromeExpanded({ expanded: false }); } catch {}
    }

    // ---- url / search ----
    function primeUrl() {
        const t = activeTab(); const input = $('urlInput');
        input.value = t && t.url ? t.url : '';
        renderSuggest(input.value); renderEngineRow(input.value);
        setTimeout(() => { input.focus(); input.select(); }, 30);
    }
    function renderSuggest(q) {
        const query = (q || '').trim().toLowerCase();
        const items = [];
        if (query && (query.includes('.') || query.includes(' ') || /^[a-z]+:\/\//i.test(query))) {
            const isUrl = /^[a-z]+:\/\//i.test(query) || (query.includes('.') && !query.includes(' '));
            items.push({ title: q.trim(), sub: isUrl ? 'öffnen' : 'suchen', url: q.trim() });
        }
        const pool = [
            ...local.bookmarks.map(b => ({ title: b.title || domainOf(b.url), sub: domainOf(b.url), url: b.url })),
            ...ns.tabs.filter(t => t.id !== ns.activeId).map(t => ({ title: t.title || domainOf(t.url), sub: domainOf(t.url) + ' · Tab', url: t.url })),
        ];
        for (const it of pool) { if (!query || (it.title + ' ' + it.url).toLowerCase().includes(query)) items.push(it); if (items.length >= 12) break; }
        const ul = $('suggest');
        ul.innerHTML = items.map((it, i) => `<li data-i="${i}"><b>${esc(it.title)}</b><span>${esc(it.sub)}</span></li>`).join('');
        ul._items = items;
    }
    // treat input as a url if it has a scheme or looks like a domain; else it's a search
    const isUrlLike = v => /^[a-z][a-z0-9+.-]*:\/\//i.test(v) || (v.includes('.') && !v.includes(' '));
    const engineById = id => local.engines.find(e => e.id === id);
    const searchUrl = (engine, q) => (engine.url.includes('%s') ? engine.url.replace(/%s/g, encodeURIComponent(q)) : engine.url + encodeURIComponent(q));
    // navigate to a url, or run a search. engineId forces a specific engine; otherwise a
    // non-url input searches with the default engine (a real url passes through as-is).
    function go(input, engineId) {
        const v = (input || '').trim(); if (!v) return;
        let url = v;
        if (engineId) { const e = engineById(engineId); if (e) url = searchUrl(e, v); }
        else if (!isUrlLike(v)) { const e = engineById(local.defaultEngine) || local.engines[0]; if (e) url = searchUrl(e, v); }
        plugin.navigate({ url }); closePanel();
    }
    // a horizontal row of engine icons shown while typing a search; tap to search there.
    function renderEngineRow(q) {
        const row = $('engineRow');
        const query = (q || '').trim();
        if (!query || isUrlLike(query)) { row.hidden = true; row.innerHTML = ''; return; }
        row.hidden = false; row.innerHTML = '';
        for (const e of local.engines) {
            const b = document.createElement('button'); b.className = 'eng' + (e.id === local.defaultEngine ? ' default' : ''); b.title = e.name;
            if (e.icon) { const img = document.createElement('img'); img.src = e.icon; img.alt = ''; img.addEventListener('error', () => { b.textContent = (e.name[0] || '?').toUpperCase(); }); b.appendChild(img); }
            else b.textContent = (e.name[0] || '?').toUpperCase();
            b.addEventListener('click', () => go($('urlInput').value, e.id));
            row.appendChild(b);
        }
    }

    // ---- find in page ----
    function primeFind() {
        const input = $('findInput'); input.value = ''; $('findCount').textContent = '';
        setTimeout(() => input.focus(), 30);
    }

    // ---- tabs ----
    function groupName(id) { const g = local.groups.find(x => x.id === id); return g ? g.name : ''; }
    function renderTabs() {
        const box = $('tabGroups'); box.innerHTML = '';
        const buckets = new Map();
        for (const t of ns.tabs) { const gid = local.tabGroups[t.id] || ''; if (!buckets.has(gid)) buckets.set(gid, []); buckets.get(gid).push(t); }
        const order = [...local.groups.map(g => g.id).filter(id => buckets.has(id)), ...(buckets.has('') ? [''] : [])];
        for (const gid of order) {
            const section = document.createElement('div'); section.className = 'group';
            if (gid) section.innerHTML = `<div class="group-head"><span>${esc(groupName(gid))}</span><span class="line"></span></div>`;
            const ul = document.createElement('ul'); ul.className = 'rows';
            for (const t of buckets.get(gid)) ul.appendChild(tabRow(t));
            section.appendChild(ul); box.appendChild(section);
        }
    }
    function tabRow(t) {
        const li = document.createElement('li');
        li.className = 'row' + (t.id === ns.activeId ? ' active' : '');
        const dom = domainOf(t.url);
        li.innerHTML = `<span class="ricon">${esc((dom[0] || '?').toUpperCase())}</span>` +
            `<span class="rtext"><b>${esc(t.title || dom || 'Neuer Tab')}</b><span>${esc(dom)}</span></span>`;
        const sel = document.createElement('select'); sel.className = 'mini-select';
        sel.innerHTML = `<option value="">—</option>` + local.groups.map(g => `<option value="${g.id}">${esc(g.name)}</option>`).join('');
        sel.value = local.tabGroups[t.id] || '';
        sel.addEventListener('click', e => e.stopPropagation());
        sel.addEventListener('change', () => { if (sel.value) local.tabGroups[t.id] = sel.value; else delete local.tabGroups[t.id]; saveLocal(); renderTabs(); });
        const close = document.createElement('button'); close.className = 'icon-btn'; close.textContent = '×'; close.setAttribute('aria-label', 'Tab schließen');
        close.addEventListener('click', e => { e.stopPropagation(); plugin.closeTab({ id: t.id }); });
        li.appendChild(sel); li.appendChild(close);
        li.addEventListener('click', () => { plugin.activateTab({ id: t.id }); closePanel(); });
        return li;
    }

    // ---- bookmarks ----
    const folderName = id => { const f = local.bookmarkFolders.find(x => x.id === id); return f ? f.name : ''; };
    function markRow(b) {
        const li = document.createElement('li'); li.className = 'row';
        const dom = domainOf(b.url);
        const tags = (b.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('');
        li.innerHTML =
            `<span class="ricon">${esc((dom[0] || '?').toUpperCase())}</span>` +
            `<span class="rtext"><b>${esc(b.title || dom)}</b><span>${esc(dom)}</span>${tags ? `<span class="tags">${tags}</span>` : ''}</span>`;
        const edit = document.createElement('button'); edit.className = 'icon-btn'; edit.innerHTML = svg('pencil'); edit.setAttribute('aria-label', 'Bearbeiten');
        edit.addEventListener('click', e => { e.stopPropagation(); openMarkEditor(b); });
        li.appendChild(edit);
        li.addEventListener('click', () => go(b.url));
        return li;
    }
    function renderMarks() {
        $('markEditor').hidden = true; $('markIO').hidden = true; $('markGroups').hidden = false;
        const box = $('markGroups'); box.innerHTML = '';
        $('marksEmpty').hidden = local.bookmarks.length > 0;
        // group by folder: known folders in order, then the ungrouped rest
        const buckets = new Map();
        for (const b of local.bookmarks) { const g = b.folder || ''; if (!buckets.has(g)) buckets.set(g, []); buckets.get(g).push(b); }
        const order = [...local.bookmarkFolders.map(f => f.id).filter(id => buckets.has(id)), ...(buckets.has('') ? [''] : [])];
        for (const gid of order) {
            const section = document.createElement('div'); section.className = 'group';
            const name = gid ? folderName(gid) : (local.bookmarkFolders.length ? 'Ohne Ordner' : '');
            if (name) section.innerHTML = `<div class="group-head"><span>${esc(name)}</span><span class="line"></span></div>`;
            const ul = document.createElement('ul'); ul.className = 'rows';
            for (const b of buckets.get(gid)) ul.appendChild(markRow(b));
            section.appendChild(ul); box.appendChild(section);
        }
    }
    function newFolder() {
        const name = prompt('Ordnername:', 'Ordner'); if (name == null) return;
        local.bookmarkFolders.push({ id: uid('f'), name: name.trim() || 'Ordner' }); saveLocal(); renderMarks();
    }

    // ---- bookmark editor (title / url / folder / tags) ----
    let editingMark = null;
    function openMarkEditor(b) {
        editingMark = b;
        $('markTitle').value = b.title || '';
        $('markUrl').value = b.url || '';
        $('markTags').value = (b.tags || []).join(' ');
        $('markFolder').innerHTML = `<option value="">Ohne Ordner</option>` + local.bookmarkFolders.map(f => `<option value="${f.id}">${esc(f.name)}</option>`).join('');
        $('markFolder').value = b.folder || '';
        $('markGroups').hidden = true; $('marksEmpty').hidden = true; $('markIO').hidden = true; $('markEditor').hidden = false;
    }
    function saveMark() {
        if (!editingMark) return;
        editingMark.title = $('markTitle').value.trim();
        editingMark.url = $('markUrl').value.trim();
        editingMark.folder = $('markFolder').value || undefined;
        editingMark.tags = $('markTags').value.split(/\s+/).filter(Boolean);
        saveLocal(); renderMarks();
    }
    function deleteMark() {
        if (!editingMark) return;
        local.bookmarks = local.bookmarks.filter(b => b !== editingMark);
        editingMark = null; saveLocal(); renderMarks();
    }

    // ---- import / export (json | netscape html): file (capacitor fs) or copy-paste ----
    let ioFmt = 'json';
    function drawIoSeg() { renderSeg('markIoFmt', [['json', 'JSON'], ['html', 'HTML']], ioFmt, v => { ioFmt = v; drawIoSeg(); }); }
    function ioStatus(msg) { const el = $('markIoStatus'); el.textContent = msg || ''; el.hidden = !msg; }
    function openMarkIO() {
        $('markGroups').hidden = true; $('marksEmpty').hidden = true; $('markEditor').hidden = true; $('markIO').hidden = false;
        drawIoSeg();
        $('markIoText').value = ''; ioStatus('');
    }
    const ioText = () => ioFmt === 'html'
        ? toNetscape()
        : JSON.stringify({ bookmarks: local.bookmarks, bookmarkFolders: local.bookmarkFolders }, null, 2);
    // the native @capacitor/filesystem plugin, exposed on Capacitor.Plugins once cap sync
    // registers it (same access path as the custom Browser plugin). null on web.
    const fsPlugin = () => { const c = window.Capacitor; return c && c.Plugins && c.Plugins.Filesystem ? c.Plugins.Filesystem : null; };
    // write text to a user-visible file. android: filesystem -> Documents, else app-external
    // (scoped storage can reject Documents on some api levels). web: blob download. returns
    // a short human location for the status line.
    async function saveTextFile(name, text) {
        const fs = fsPlugin();
        if (fs) {
            for (const dir of ['DOCUMENTS', 'EXTERNAL']) {
                try {
                    const res = await fs.writeFile({ path: name, data: text, directory: dir, encoding: 'utf8', recursive: true });
                    return (res && res.uri) ? res.uri.replace(/^file:\/\//, '') : (dir.toLowerCase() + '/' + name);
                } catch {}
            }
            return null; // both native writes failed
        }
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = name; a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        return name;
    }
    async function exportMarks() {
        const text = ioText(); $('markIoText').value = text;
        const name = 'bookmarks.' + (ioFmt === 'html' ? 'html' : 'json');
        const where = await saveTextFile(name, text);
        ioStatus(where ? ('gespeichert: ' + where) : 'speichern fehlgeschlagen — Inhalt kann kopiert werden');
    }
    // read a file the user picks (filesystem has no picker, so a file input drives import),
    // autodetect json vs netscape html, then import.
    function loadMarksFile() {
        const inp = $('markIoFile'); inp.value = '';
        inp.onchange = () => {
            const f = inp.files && inp.files[0]; if (!f) return;
            const r = new FileReader();
            r.onload = () => {
                const text = String(r.result || '');
                ioFmt = (/\.html?$/i.test(f.name) || /^\s*</.test(text)) ? 'html' : 'json';
                drawIoSeg(); $('markIoText').value = text;
                importMarks(f.name);
            };
            r.onerror = () => ioStatus('datei konnte nicht gelesen werden');
            r.readAsText(f);
        };
        inp.click();
    }
    function importMarks(fromName) {
        const text = $('markIoText').value.trim(); if (!text) { ioStatus('nichts zu importieren'); return; }
        const added = ioFmt === 'html' ? fromNetscape(text) : fromJSON(text);
        if (!added) { ioStatus('konnte nicht gelesen werden (' + ioFmt.toUpperCase() + '?)'); return; }
        const have = new Set(local.bookmarks.map(b => b.url));
        local.bookmarkFolders.push(...added.folders);
        let n = 0;
        for (const b of added.bookmarks) if (b.url && !have.has(b.url)) { local.bookmarks.push(b); have.add(b.url); n++; }
        saveLocal();
        ioStatus(n + ' importiert' + (n < added.bookmarks.length ? ' (' + (added.bookmarks.length - n) + ' schon vorhanden)' : '') + (fromName ? ' aus ' + fromName : ''));
    }
    function toNetscape() {
        const line = b => `    <DT><A HREF="${esc(b.url)}"${b.tags && b.tags.length ? ` TAGS="${esc(b.tags.join(','))}"` : ''}>${esc(b.title || domainOf(b.url))}</A>\n`;
        let out = '<!DOCTYPE NETSCAPE-Bookmark-file-1>\n<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n<TITLE>Bookmarks</TITLE>\n<H1>Bookmarks</H1>\n<DL><p>\n';
        for (const f of local.bookmarkFolders) {
            const items = local.bookmarks.filter(b => b.folder === f.id);
            if (!items.length) continue;
            out += `    <DT><H3>${esc(f.name)}</H3>\n    <DL><p>\n`;
            for (const b of items) out += '    ' + line(b);
            out += '    </DL><p>\n';
        }
        for (const b of local.bookmarks.filter(b => !b.folder)) out += line(b);
        return out + '</DL><p>\n';
    }
    // json keeps folders (ids remapped); html import is flat (folders as h3 are lost on re-import, standard interop tradeoff)
    function fromJSON(text) {
        let data; try { data = JSON.parse(text); } catch { return null; }
        const idMap = {}; const folders = [];
        for (const f of (Array.isArray(data.bookmarkFolders) ? data.bookmarkFolders : [])) {
            if (!f || !f.name) continue; const nf = { id: uid('f'), name: String(f.name) }; idMap[f.id] = nf.id; folders.push(nf);
        }
        const src = Array.isArray(data.bookmarks) ? data.bookmarks : Array.isArray(data) ? data : [];
        const bookmarks = src.filter(b => b && b.url).map(b => ({
            id: uid('b'), url: b.url, title: b.title || domainOf(b.url), folder: idMap[b.folder], tags: Array.isArray(b.tags) ? b.tags : [],
        }));
        return { bookmarks, folders };
    }
    function fromNetscape(html) {
        let doc; try { doc = new DOMParser().parseFromString(html, 'text/html'); } catch { return null; }
        const anchors = [...doc.querySelectorAll('a[href]')];
        if (!anchors.length) return null;
        const bookmarks = anchors.map(a => {
            const url = a.getAttribute('href'); if (!url || /^(javascript|place):/i.test(url)) return null;
            const tags = (a.getAttribute('tags') || '').split(',').map(t => t.trim()).filter(Boolean);
            return { id: uid('b'), url, title: (a.textContent || domainOf(url)).trim(), tags };
        }).filter(Boolean);
        return { bookmarks, folders: [] };
    }

    // ---- dashboard (new-tab start page: bookmarks grid) ----
    function renderDash() {
        const grid = $('dashGrid'); grid.innerHTML = '';
        $('dashEmpty').hidden = local.bookmarks.length > 0;
        for (const b of local.bookmarks) {
            const dom = domainOf(b.url);
            const tile = document.createElement('div'); tile.className = 'tile';
            tile.innerHTML = `<span class="fav">${esc((dom[0] || '?').toUpperCase())}</span><b>${esc(b.title || dom)}</b>`;
            tile.addEventListener('click', () => go(b.url));
            grid.appendChild(tile);
        }
    }
    function addCurrentBookmark() {
        const t = activeTab(); if (!t || !t.url) return;
        if (local.bookmarks.some(b => b.url === t.url)) return;
        local.bookmarks.unshift({ id: uid('b'), url: t.url, title: t.title || domainOf(t.url) });
        saveLocal(); renderMarks();
    }
    function toggleBookmark() {
        const t = activeTab(); if (!t || !t.url) return;
        const existing = local.bookmarks.find(b => b.url === t.url);
        if (existing) local.bookmarks = local.bookmarks.filter(b => b !== existing);
        else local.bookmarks.unshift({ id: uid('b'), url: t.url, title: t.title || domainOf(t.url) });
        saveLocal(); if (panel === 'marks') renderMarks();
    }

    // ---- context menu (reusable) ----
    // items: [{ label, icon?, danger?, run } | { sep: true }]. anchor: an element
    // (menu opens above/below the bar, horizontally centered on it) or {x}.
    async function openMenu(items, anchor) {
        const ul = $('menuList'); ul.innerHTML = '';
        for (const it of items) {
            const li = document.createElement('li');
            if (it.sep) { li.className = 'sep'; li.setAttribute('role', 'separator'); ul.appendChild(li); continue; }
            li.setAttribute('role', 'menuitem');
            if (it.danger) li.className = 'danger';
            li.innerHTML = `<span class="mi">${it.icon ? svg(it.icon) : ''}</span><span>${esc(it.label)}</span>`;
            li.addEventListener('click', () => { closePanel(); it.run(); });
            ul.appendChild(li);
        }
        await openPanel('menu');
        requestAnimationFrame(() => positionMenu(anchor));
    }
    function positionMenu(anchor) {
        const ul = $('menuList');
        const cx = anchor && anchor.getBoundingClientRect ? (r => r.left + r.width / 2)(anchor.getBoundingClientRect()) : (anchor && anchor.x) || window.innerWidth / 2;
        const left = Math.min(Math.max(8, cx - ul.offsetWidth / 2), window.innerWidth - ul.offsetWidth - 8);
        ul.style.left = left + 'px';
    }
    // fires handler on a long press (and on right-click, for the desktop mock);
    // suppresses the click that follows so a long-press does not also tap-through.
    function onLongPress(el, handler, ms = 450) {
        let timer = null, sx = 0, sy = 0, fired = false;
        const clear = () => { if (timer) { clearTimeout(timer); timer = null; } };
        el.addEventListener('pointerdown', e => { fired = false; sx = e.clientX; sy = e.clientY; clear(); timer = setTimeout(() => { fired = true; handler(e); }, ms); });
        el.addEventListener('pointermove', e => { if (timer && Math.hypot(e.clientX - sx, e.clientY - sy) > 10) clear(); });
        el.addEventListener('pointerup', clear);
        el.addEventListener('pointercancel', clear);
        el.addEventListener('click', e => { if (fired) { e.stopPropagation(); e.preventDefault(); fired = false; } }, true);
        el.addEventListener('contextmenu', e => { e.preventDefault(); clear(); handler(e); });
    }
    // the url-bar test menu: bookmark toggle, reload / hard reload, close tab.
    function openUrlBarMenu(anchor) {
        const t = activeTab();
        const marked = !!(t && local.bookmarks.some(b => b.url === t.url));
        openMenu([
            { label: marked ? 'Lesezeichen entfernen' : 'Zu Lesezeichen', icon: 'book', run: toggleBookmark },
            { sep: true },
            { label: 'Neu laden', icon: 'reload', run: () => plugin.reload({}) },
            { label: 'Hard Reload', icon: 'bolt', run: () => plugin.hardReload({}) },
            { sep: true },
            { label: 'Tab schließen', icon: 'x', danger: true, run: () => { if (t) plugin.closeTab({ id: t.id }); } },
        ], anchor);
    }

    // ---- userscripts ----
    function pushUserscripts() {
        try { plugin.setUserscripts({ scripts: local.userscripts.map(s => ({ name: s.name, code: s.code, matches: s.matches, enabled: s.enabled })) }); } catch {}
    }
    let editingScript = null;
    function renderScripts() {
        $('scriptEditor').hidden = true;
        const ul = $('scriptList'); ul.innerHTML = '';
        $('scriptsEmpty').hidden = local.userscripts.length > 0;
        for (const s of local.userscripts) {
            const li = document.createElement('li'); li.className = 'row';
            li.innerHTML = `<span class="rtext"><b>${esc(s.name || 'Script')}</b><span>${esc((s.matches || []).join(' ') || 'alle Seiten')}</span></span>`;
            const tog = document.createElement('input'); tog.type = 'checkbox'; tog.checked = s.enabled !== false;
            tog.addEventListener('click', e => e.stopPropagation());
            tog.addEventListener('change', () => { s.enabled = tog.checked; saveLocal(); pushUserscripts(); });
            const del = document.createElement('button'); del.className = 'icon-btn'; del.textContent = '×'; del.setAttribute('aria-label', 'Löschen');
            del.addEventListener('click', e => { e.stopPropagation(); local.userscripts = local.userscripts.filter(x => x.id !== s.id); saveLocal(); pushUserscripts(); renderScripts(); });
            li.appendChild(tog); li.appendChild(del);
            li.addEventListener('click', () => openScriptEditor(s));
            ul.appendChild(li);
        }
    }
    function openScriptEditor(s) {
        editingScript = s || { id: uid('u'), name: '', matches: [], code: '', enabled: true };
        $('scriptName').value = editingScript.name || '';
        $('scriptMatches').value = (editingScript.matches || []).join(' ');
        $('scriptCode').value = editingScript.code || '';
        $('scriptEnabled').checked = editingScript.enabled !== false;
        $('scriptEditor').hidden = false;
        $('scriptList').hidden = true; $('scriptsEmpty').hidden = true;
    }
    function saveScript() {
        editingScript.name = $('scriptName').value.trim() || 'Script';
        editingScript.matches = $('scriptMatches').value.split(/\s+/).filter(Boolean);
        editingScript.code = $('scriptCode').value;
        editingScript.enabled = $('scriptEnabled').checked;
        if (!local.userscripts.includes(editingScript)) local.userscripts.push(editingScript);
        saveLocal(); pushUserscripts();
        $('scriptList').hidden = false; renderScripts();
    }

    // ---- settings ----
    function renderSettings() {
        const s = local.settings;
        $('colBg').value = s.bg; $('colFg').value = s.fg; $('colAccent').value = s.accent;
        renderSeg('dockPosSeg', [['bottom', 'Unten'], ['top', 'Oben']], s.dockPos, v => { s.dockPos = v; saveLocal(); applyDock(); renderSettings(); });
        renderSeg('loaderPosSeg', [['bottom', 'Unten'], ['top', 'Oben']], s.loaderPos, v => { s.loaderPos = v; saveLocal(); applyLoader(); renderSettings(); });
        $('rangeDockSize').value = s.dockSize; $('valDockSize').textContent = s.dockSize + 'px';
        $('rangeDockGap').value = s.dockGap; $('valDockGap').textContent = s.dockGap + 'px';
        renderDockList();
    }
    function renderSeg(id, opts, cur, onPick) {
        const box = $(id); box.innerHTML = '';
        for (const [val, label] of opts) {
            const b = document.createElement('button');
            b.className = 'seg-btn' + (val === cur ? ' active' : '');
            b.textContent = label; b.addEventListener('click', () => onPick(val));
            box.appendChild(b);
        }
    }
    function renderDockList() {
        const ul = $('dockList'); ul.innerHTML = '';
        local.settings.dock.forEach((d, i) => {
            const li = document.createElement('li'); li.className = 'row';
            li.innerHTML = `<span class="ricon">${svg(DOCK[d.id].icon)}</span><span class="rtext"><b>${esc(DOCK[d.id].label)}</b></span>`;
            const up = document.createElement('button'); up.className = 'icon-btn'; up.textContent = '↑'; up.disabled = i === 0;
            up.addEventListener('click', () => moveDock(i, -1));
            const dn = document.createElement('button'); dn.className = 'icon-btn'; dn.textContent = '↓'; dn.disabled = i === local.settings.dock.length - 1;
            dn.addEventListener('click', () => moveDock(i, 1));
            const tog = document.createElement('input'); tog.type = 'checkbox'; tog.checked = !!d.on;
            tog.addEventListener('change', () => { d.on = tog.checked; saveLocal(); applyDock(); });
            li.appendChild(up); li.appendChild(dn); li.appendChild(tog);
            ul.appendChild(li);
        });
    }
    function moveDock(i, dir) {
        const arr = local.settings.dock; const j = i + dir;
        if (j < 0 || j >= arr.length) return;
        [arr[i], arr[j]] = [arr[j], arr[i]];
        saveLocal(); applyDock(); renderDockList();
    }

    // ---- search engines ----
    let editingEngine = null;
    function renderEngines() {
        $('engineEditor').hidden = true; $('engineList').hidden = false;
        const ul = $('engineList'); ul.innerHTML = '';
        $('enginesEmpty').hidden = local.engines.length > 0;
        for (const e of local.engines) {
            const li = document.createElement('li'); li.className = 'row';
            const badge = e.id === local.defaultEngine ? '<span class="tags"><span class="tag">Standard</span></span>' : '';
            li.innerHTML = `<span class="ricon">${esc((e.name[0] || '?').toUpperCase())}</span><span class="rtext"><b>${esc(e.name)}</b><span>${esc(e.url)}</span>${badge}</span>`;
            const edit = document.createElement('button'); edit.className = 'icon-btn'; edit.innerHTML = svg('pencil'); edit.setAttribute('aria-label', 'Bearbeiten');
            edit.addEventListener('click', e2 => { e2.stopPropagation(); openEngineEditor(e); });
            li.appendChild(edit);
            li.addEventListener('click', () => openEngineEditor(e));
            ul.appendChild(li);
        }
    }
    function openEngineEditor(e) {
        editingEngine = e || { id: uid('e'), name: '', url: '', icon: '' };
        $('engName').value = editingEngine.name || '';
        $('engUrl').value = editingEngine.url || '';
        $('engIcon').value = editingEngine.icon || '';
        $('engDefault').checked = editingEngine.id === local.defaultEngine;
        $('engDelete').hidden = !local.engines.includes(editingEngine);
        $('engineList').hidden = true; $('enginesEmpty').hidden = true; $('engineEditor').hidden = false;
    }
    function saveEngine() {
        if (!editingEngine) return;
        editingEngine.name = $('engName').value.trim() || 'Suche';
        editingEngine.url = $('engUrl').value.trim();
        editingEngine.icon = $('engIcon').value.trim();
        if (!editingEngine.url) { renderEngines(); return; }
        if (!local.engines.includes(editingEngine)) local.engines.push(editingEngine);
        if ($('engDefault').checked) local.defaultEngine = editingEngine.id;
        saveLocal(); renderEngines();
    }
    function deleteEngine() {
        if (!editingEngine) return;
        local.engines = local.engines.filter(e => e !== editingEngine);
        if (local.defaultEngine === editingEngine.id) local.defaultEngine = local.engines[0] && local.engines[0].id;
        editingEngine = null; saveLocal(); renderEngines();
    }

    // ---- wiring ----
    function wire() {
        $('urlGo').innerHTML = svg('go');
        $('pill').addEventListener('click', () => openPanel('url'));
        onLongPress($('pill'), () => openUrlBarMenu($('pill')));
        document.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closePanel));

        $('urlForm').addEventListener('submit', e => { e.preventDefault(); go($('urlInput').value); });
        $('urlInput').addEventListener('input', () => { const v = $('urlInput').value; renderSuggest(v); renderEngineRow(v); });
        $('suggest').addEventListener('click', e => { const li = e.target.closest('li'); if (!li) return; const it = ($('suggest')._items || [])[+li.dataset.i]; if (it) go(it.url); });

        $('findForm').addEventListener('submit', e => { e.preventDefault(); plugin.findNext({ forward: true }); });
        $('findInput').addEventListener('input', () => plugin.findInPage({ query: $('findInput').value }));
        $('findPrev').addEventListener('click', () => plugin.findNext({ forward: false }));

        $('newTabBtn').addEventListener('click', async () => { await plugin.newTab({}); openPanel('dash'); });
        $('newGroupBtn').addEventListener('click', () => { const name = prompt('Gruppenname:', 'Gruppe'); if (name == null) return; local.groups.push({ id: uid('g'), name: name.trim() || 'Gruppe' }); saveLocal(); renderTabs(); });
        $('addMarkBtn').addEventListener('click', addCurrentBookmark);
        $('newFolderBtn').addEventListener('click', newFolder);
        $('markIoBtn').addEventListener('click', openMarkIO);
        $('markSave').addEventListener('click', saveMark);
        $('markDelete').addEventListener('click', deleteMark);
        $('markCancel').addEventListener('click', renderMarks);
        $('markIoClose').addEventListener('click', renderMarks);
        $('markIoLoad').addEventListener('click', loadMarksFile);
        $('markIoExport').addEventListener('click', exportMarks);
        $('markIoImport').addEventListener('click', () => importMarks());
        $('dashSearch').addEventListener('click', () => openPanel('url'));
        $('openEngines').addEventListener('click', () => openPanel('engines'));
        $('newEngineBtn').addEventListener('click', () => openEngineEditor(null));
        $('engSave').addEventListener('click', saveEngine);
        $('engCancel').addEventListener('click', renderEngines);
        $('engDelete').addEventListener('click', deleteEngine);

        $('newScriptBtn').addEventListener('click', () => openScriptEditor(null));
        $('scriptSave').addEventListener('click', saveScript);
        $('scriptCancel').addEventListener('click', () => { $('scriptList').hidden = false; renderScripts(); });

        $('colBg').addEventListener('input', () => { local.settings.bg = $('colBg').value; saveLocal(); applyTheme(); });
        $('colFg').addEventListener('input', () => { local.settings.fg = $('colFg').value; saveLocal(); applyTheme(); });
        $('colAccent').addEventListener('input', () => { local.settings.accent = $('colAccent').value; saveLocal(); applyTheme(); });
        $('rangeDockSize').addEventListener('input', () => { local.settings.dockSize = Number($('rangeDockSize').value); $('valDockSize').textContent = local.settings.dockSize + 'px'; saveLocal(); applyTheme(); });
        $('rangeDockGap').addEventListener('input', () => { local.settings.dockGap = Number($('rangeDockGap').value); $('valDockGap').textContent = local.settings.dockGap + 'px'; saveLocal(); applyTheme(); });

        plugin.addListener('state', s => {
            const wasExpanded = ns.expanded;
            ns = s; renderBar();
            if (!s.expanded && panel) { panel = null; PANELS.forEach(id => { $(id).hidden = true; }); }
            if (panel === 'tabs') renderTabs();
            if (panel === 'url' && wasExpanded) renderSuggest($('urlInput').value);
        });
        plugin.addListener('find', e => {
            $('findCount').textContent = e && e.count ? ((e.index + 1) + '/' + e.count) : (e && e.done ? '0/0' : '');
        });
    }

    async function init() {
        wire();
        applyAll();
        pushUserscripts();
        try { ns = await plugin.ready(); } catch {}
        renderBar();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
