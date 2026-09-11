// minimalist browser chrome. plain js. drives the native Browser plugin (tabs =
// native content webviews) and re-renders on "state" events. grouping + bookmarks
// are chrome-side (localStorage). in a plain browser (no capacitor) a mock keeps
// the ui usable for layout/screenshots. see ../ARCHITECTURE.md.
(function () {
    'use strict';

    const domainOf = url => {
        try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url || ''; }
    };

    function getPlugin() {
        const cap = window.Capacitor;
        if (cap && cap.Plugins && cap.Plugins.Browser) return cap.Plugins.Browser;
        // ---- browser dev mock ----
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
            async newTab({ url }) { const id = 't' + (++n + 0); tabs.push({ id, url: url || 'https://duckduckgo.com/', title: 'Neuer Tab', loading: false, progress: 100, canGoBack: false }); activeId = id; push(); return state(); },
            async closeTab({ id }) { tabs = tabs.filter(t => t.id !== id); if (activeId === id) activeId = tabs.length ? tabs[tabs.length - 1].id : ''; push(); return state(); },
            async activateTab({ id }) { activeId = id; push(); return state(); },
            async goBack() { return state(); },
            async goForward() { return state(); },
            async reload() { return state(); },
            async setChromeExpanded({ expanded: e }) { expanded = e; push(); return state(); },
            addListener(ev, fn) { (listeners[ev] = listeners[ev] || []).push(fn); return { remove() { listeners[ev] = (listeners[ev] || []).filter(f => f !== fn); } }; },
        };
    }

    const plugin = getPlugin();

    // ---- icons (inline, currentColor) ----
    const ICONS = {
        tabs: '<rect x="4" y="4" width="16" height="16" rx="3"/><line x1="4" y1="9" x2="20" y2="9"/>',
        book: '<path d="M7 4h10a1 1 0 0 1 1 1v15l-6-4-6 4V5a1 1 0 0 1 1-1z"/>',
        go: '<line x1="5" y1="12" x2="18" y2="12"/><path d="M13 7l5 5-5 5"/>',
    };
    const svg = (name) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
        'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';

    // ---- state ----
    const $ = id => document.getElementById(id);
    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const STORE = 'browser';

    let ns = { tabs: [], activeId: '', expanded: false };  // native state
    let local = loadLocal();                                // bookmarks + groups
    let panel = null;                                       // 'url' | 'tabs' | 'marks' | null

    function loadLocal() {
        try {
            const s = JSON.parse(localStorage.getItem(STORE) || '{}');
            return {
                bookmarks: Array.isArray(s.bookmarks) ? s.bookmarks : [],
                groups: Array.isArray(s.groups) ? s.groups : [],
                tabGroups: s.tabGroups && typeof s.tabGroups === 'object' ? s.tabGroups : {},
            };
        } catch { return { bookmarks: [], groups: [], tabGroups: {} }; }
    }
    function saveLocal() { try { localStorage.setItem(STORE, JSON.stringify(local)); } catch {} }

    const uid = p => p + Math.random().toString(36).slice(2, 8);
    const activeTab = () => ns.tabs.find(t => t.id === ns.activeId) || null;

    // ---- bar ----
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
        ['panelUrl', 'panelTabs', 'panelMarks'].forEach(id => { $(id).hidden = true; });
        try { await plugin.setChromeExpanded({ expanded: true }); } catch {}
        $({ url: 'panelUrl', tabs: 'panelTabs', marks: 'panelMarks' }[name]).hidden = false;
        if (name === 'url') primeUrl();
        if (name === 'tabs') renderTabs();
        if (name === 'marks') renderMarks();
    }
    async function closePanel() {
        panel = null;
        ['panelUrl', 'panelTabs', 'panelMarks'].forEach(id => { $(id).hidden = true; });
        try { await plugin.setChromeExpanded({ expanded: false }); } catch {}
    }

    // ---- url / search ----
    function primeUrl() {
        const t = activeTab();
        const v = t && t.url ? t.url : '';
        const input = $('urlInput');
        input.value = v;
        renderSuggest(v);
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
        for (const it of pool) {
            if (!query || (it.title + ' ' + it.url).toLowerCase().includes(query)) items.push(it);
            if (items.length >= 12) break;
        }
        const ul = $('suggest');
        ul.innerHTML = items.map((it, i) =>
            `<li data-i="${i}"><b>${esc(it.title)}</b><span>${esc(it.sub)}</span></li>`).join('');
        ul._items = items;
    }

    function go(url) {
        const v = (url || '').trim();
        if (!v) return;
        plugin.navigate({ url: v });
        closePanel();
    }

    // ---- tabs overview ----
    function groupName(id) { const g = local.groups.find(x => x.id === id); return g ? g.name : ''; }

    function renderTabs() {
        const box = $('tabGroups');
        box.innerHTML = '';
        // bucket tabs by group (localStorage), ungrouped last
        const buckets = new Map(); // groupId('' = none) -> tabs[]
        for (const t of ns.tabs) {
            const gid = local.tabGroups[t.id] || '';
            if (!buckets.has(gid)) buckets.set(gid, []);
            buckets.get(gid).push(t);
        }
        const order = [...local.groups.map(g => g.id).filter(id => buckets.has(id)), ...(buckets.has('') ? [''] : [])];
        for (const gid of order) {
            const section = document.createElement('div');
            section.className = 'group';
            if (gid) section.innerHTML = `<div class="group-head"><span>${esc(groupName(gid))}</span><span class="line"></span></div>`;
            const ul = document.createElement('ul');
            ul.className = 'rows';
            for (const t of buckets.get(gid)) ul.appendChild(tabRow(t));
            section.appendChild(ul);
            box.appendChild(section);
        }
    }

    function tabRow(t) {
        const li = document.createElement('li');
        li.className = 'row' + (t.id === ns.activeId ? ' active' : '');
        const dom = domainOf(t.url);
        li.innerHTML =
            `<span class="ricon">${esc((dom[0] || '?').toUpperCase())}</span>` +
            `<span class="rtext"><b>${esc(t.title || dom || 'Neuer Tab')}</b><span>${esc(dom)}</span></span>`;
        // group picker
        const sel = document.createElement('select');
        sel.className = 'mini-select';
        sel.innerHTML = `<option value="">—</option>` +
            local.groups.map(g => `<option value="${g.id}">${esc(g.name)}</option>`).join('');
        sel.value = local.tabGroups[t.id] || '';
        sel.addEventListener('click', e => e.stopPropagation());
        sel.addEventListener('change', () => {
            if (sel.value) local.tabGroups[t.id] = sel.value; else delete local.tabGroups[t.id];
            saveLocal(); renderTabs();
        });
        const close = document.createElement('button');
        close.className = 'icon-btn'; close.textContent = '×'; close.setAttribute('aria-label', 'Tab schließen');
        close.addEventListener('click', e => { e.stopPropagation(); plugin.closeTab({ id: t.id }); });
        li.appendChild(sel);
        li.appendChild(close);
        li.addEventListener('click', () => { plugin.activateTab({ id: t.id }); closePanel(); });
        return li;
    }

    // ---- bookmarks ----
    function renderMarks() {
        const ul = $('markList');
        ul.innerHTML = '';
        $('marksEmpty').hidden = local.bookmarks.length > 0;
        for (const b of local.bookmarks) {
            const li = document.createElement('li');
            li.className = 'row';
            const dom = domainOf(b.url);
            li.innerHTML = `<span class="ricon">${esc((dom[0] || '?').toUpperCase())}</span>` +
                `<span class="rtext"><b>${esc(b.title || dom)}</b><span>${esc(dom)}</span></span>`;
            const del = document.createElement('button');
            del.className = 'icon-btn'; del.textContent = '×'; del.setAttribute('aria-label', 'Löschen');
            del.addEventListener('click', e => { e.stopPropagation(); local.bookmarks = local.bookmarks.filter(x => x.id !== b.id); saveLocal(); renderMarks(); });
            li.appendChild(del);
            li.addEventListener('click', () => go(b.url));
            ul.appendChild(li);
        }
    }

    function addCurrentBookmark() {
        const t = activeTab();
        if (!t || !t.url) return;
        if (local.bookmarks.some(b => b.url === t.url)) return;
        local.bookmarks.unshift({ id: uid('b'), url: t.url, title: t.title || domainOf(t.url) });
        saveLocal(); renderMarks();
    }

    // ---- wiring ----
    function wire() {
        $('tLeft').innerHTML = svg('tabs');
        $('tRight').innerHTML = svg('book');
        $('urlGo').innerHTML = svg('go');

        $('pill').addEventListener('click', () => openPanel('url'));
        $('tLeft').addEventListener('click', () => openPanel('tabs'));
        $('tRight').addEventListener('click', () => openPanel('marks'));

        document.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closePanel));

        $('urlForm').addEventListener('submit', e => { e.preventDefault(); go($('urlInput').value); });
        $('urlInput').addEventListener('input', () => renderSuggest($('urlInput').value));
        $('suggest').addEventListener('click', e => {
            const li = e.target.closest('li'); if (!li) return;
            const it = ($('suggest')._items || [])[+li.dataset.i]; if (it) go(it.url);
        });

        $('newTabBtn').addEventListener('click', async () => { await plugin.newTab({}); openPanel('url'); });
        $('newGroupBtn').addEventListener('click', () => {
            const name = prompt('Gruppenname:', 'Gruppe'); if (name == null) return;
            local.groups.push({ id: uid('g'), name: name.trim() || 'Gruppe' }); saveLocal(); renderTabs();
        });
        $('addMarkBtn').addEventListener('click', addCurrentBookmark);

        // native back / any external collapse: reconcile panels with expanded state
        plugin.addListener('state', s => {
            const wasExpanded = ns.expanded;
            ns = s;
            renderBar();
            if (!s.expanded && panel) { panel = null; ['panelUrl', 'panelTabs', 'panelMarks'].forEach(id => { $(id).hidden = true; }); }
            if (panel === 'tabs') renderTabs();
            if (panel === 'url' && wasExpanded) renderSuggest($('urlInput').value);
        });
    }

    async function init() {
        wire();
        try { ns = await plugin.ready(); } catch {}
        renderBar();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
