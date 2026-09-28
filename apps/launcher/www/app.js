// launcher ui: home screen (pinned apps + folders) and a separate app drawer
// (all apps, filterable by category / first letter / search). plain js, bundler-free. talks to the native Launcher
// capacitor plugin (getApps/launchApp). in a plain browser (no capacitor) a
// mock keeps the ui usable for layout work. most appearance settings are driven
// by css custom properties + body classes so changes preview live without
// rebuilding the grid.
(function () {
    'use strict';

    // ---- plugin access ----

    function getPlugin() {
        const cap = window.Capacitor;
        if (cap && cap.Plugins && cap.Plugins.Launcher) {
            return cap.Plugins.Launcher;
        }
        // browser fallback: a fixed demo set, launch is a no-op toast.
        return {
            async getApps() {
                return {
                    apps: [
                        { packageName: 'com.android.chrome', label: 'Chrome' },
                        { packageName: 'com.google.android.gm', label: 'Gmail' },
                        { packageName: 'com.google.android.apps.maps', label: 'Maps' },
                        { packageName: 'com.android.camera', label: 'Kamera' },
                        { packageName: 'com.android.dialer', label: 'Telefon' },
                        { packageName: 'com.google.android.apps.messaging', label: 'Nachrichten' },
                        { packageName: 'com.spotify.music', label: 'Spotify' },
                        { packageName: 'com.android.gallery3d', label: 'Galerie' },
                        { packageName: 'com.android.deskclock', label: 'Uhr' },
                        { packageName: 'com.google.android.calendar', label: 'Kalender' },
                        { packageName: 'com.android.calculator2', label: 'Rechner' },
                        { packageName: 'com.android.vending', label: 'Play Store' },
                        { packageName: 'com.google.android.youtube', label: 'YouTube' },
                        { packageName: 'com.android.settings', label: 'Einstellungen' },
                        { packageName: 'com.example.notes', label: 'Notizen' },
                        { packageName: 'com.example.files', label: 'Dateien' }
                    ]
                };
            },
            async launchApp({ packageName }) { toast('nur im nativen build: startet ' + packageName); },
            async setShowWallpaper() {}
        };
    }

    const plugin = getPlugin();

    // ---- icon set (monochrome line icons, recolored via currentColor) ----
    const ICONS = {
        app: '<rect x="4" y="4" width="16" height="16" rx="4"/>',
        phone: '<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><line x1="10" y1="18.5" x2="14" y2="18.5"/>',
        message: '<path d="M4.5 5.5h15v10h-9l-6 4z"/>',
        mail: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3.6 7.2l8.4 6 8.4-6"/>',
        camera: '<rect x="3" y="7.5" width="18" height="11.5" rx="2"/><rect x="8.5" y="4.5" width="7" height="3" rx="1"/><circle cx="12" cy="13" r="3.2"/>',
        photos: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.7"/><path d="M4.5 18l5-5 4 4 2.5-2.5 3.5 3.5"/>',
        browser: '<circle cx="12" cy="12" r="8"/><ellipse cx="12" cy="12" rx="4" ry="8"/><line x1="4" y1="12" x2="20" y2="12"/>',
        music: '<circle cx="7.5" cy="17" r="2.5"/><circle cx="17" cy="15" r="2.5"/><path d="M10 17V6.5l9-2v9"/>',
        maps: '<path d="M12 21s6-5.6 6-11a6 6 0 10-12 0c0 5.4 6 11 6 11z"/><circle cx="12" cy="10" r="2.2"/>',
        clock: '<circle cx="12" cy="12" r="8"/><path d="M12 7.5v5l3.2 2"/>',
        calendar: '<rect x="4" y="5" width="16" height="16" rx="2"/><line x1="4" y1="9.5" x2="20" y2="9.5"/><line x1="8.5" y1="3" x2="8.5" y2="6.5"/><line x1="15.5" y1="3" x2="15.5" y2="6.5"/>',
        calculator: '<rect x="5" y="3" width="14" height="18" rx="2"/><line x1="8" y1="7.5" x2="16" y2="7.5"/><line x1="9" y1="12" x2="9" y2="12"/><line x1="12" y1="12" x2="12" y2="12"/><line x1="15" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="9" y2="16"/><line x1="12" y1="16" x2="12" y2="16"/><line x1="15" y1="16" x2="15" y2="16"/>',
        store: '<path d="M6 8.5h12l-1 11.5H7z"/><path d="M9 8.5a3 3 0 016 0"/>',
        video: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M10.5 9.5l4.5 2.5-4.5 2.5z"/>',
        game: '<rect x="3" y="8" width="18" height="8.5" rx="4.2"/><line x1="7.5" y1="10.5" x2="7.5" y2="14"/><line x1="5.8" y1="12.2" x2="9.2" y2="12.2"/><circle cx="16" cy="11.5" r="1"/><circle cx="18" cy="13.5" r="1"/>',
        bank: '<rect x="3" y="6" width="18" height="12" rx="2"/><line x1="3.5" y1="10.5" x2="20.5" y2="10.5"/><line x1="6.5" y1="14.5" x2="10.5" y2="14.5"/>',
        notes: '<rect x="5" y="3" width="14" height="18" rx="2"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="13" y2="16"/>',
        files: '<path d="M3 7.5a2 2 0 012-2h4l2 2h8a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>',
        weather: '<path d="M7.5 18a4 4 0 01-.3-8 5 5 0 019.6-1 3.5 3.5 0 01.2 9z"/>',
        settings: '<circle cx="12" cy="12" r="3.2"/><path d="M12 3.5v2.4M12 18.1v2.4M20.5 12h-2.4M5.9 12H3.5M18 6l-1.7 1.7M7.7 16.3L6 18M18 18l-1.7-1.7M7.7 7.7L6 6"/>',
        folder: '<path d="M3 7.5a2 2 0 012-2h4l2 2h8a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>',
        add: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
        up: '<path d="M6 15l6-6 6 6"/>',
        down: '<path d="M6 9l6 6 6-6"/>',
        close: '<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>',
        back: '<path d="M15 5l-7 7 7 7"/>',
        trash: '<path d="M6 7.5h12l-1 12.5H7z"/><line x1="4.5" y1="7.5" x2="19.5" y2="7.5"/><path d="M9.5 7.5V4.5h5v3"/>',
        edit: '<path d="M4 20h4L18 10l-4-4L4 16z"/><line x1="13" y1="7" x2="17" y2="11"/>',
        grid: '<rect x="4.5" y="4.5" width="6" height="6" rx="1.5"/><rect x="13.5" y="4.5" width="6" height="6" rx="1.5"/><rect x="4.5" y="13.5" width="6" height="6" rx="1.5"/><rect x="13.5" y="13.5" width="6" height="6" rx="1.5"/>',
        pin: '<path d="M9 4h6l-1 6 3 3H7l3-3z"/><line x1="12" y1="13" x2="12" y2="20"/>',
        open: '<path d="M14 4h6v6"/><line x1="20" y1="4" x2="11" y2="13"/><path d="M18 14v4a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h4"/>'
    };
    function svg(name, cls) {
        const inner = ICONS[name] || ICONS.app;
        return '<svg class="' + (cls || 'icon') + '" viewBox="0 0 24 24" fill="none" ' +
            'stroke="currentColor" stroke-width="1.7" stroke-linecap="round" ' +
            'stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>';
    }
    const ICON_RULES = [
        [/dial|phone|call|contact|telefon|anruf/, 'phone'],
        [/messag|sms|chat|whatsapp|telegram|signal|nachricht/, 'message'],
        [/mail|gmail|email|outlook|posteingang/, 'mail'],
        [/camera|kamera/, 'camera'],
        [/photo|gallery|galerie|image|bilder|fotos/, 'photos'],
        [/music|spotify|deezer|tidal|audio|musik/, 'music'],
        [/video|youtube|netflix|movie|film|kino/, 'video'],
        [/map|maps|karte|navigation|waze|gps/, 'maps'],
        [/clock|alarm|timer|uhr|wecker/, 'clock'],
        [/calendar|kalender|agenda|termin/, 'calendar'],
        [/calc|rechner/, 'calculator'],
        [/store|market|shop|vending|play|amazon/, 'store'],
        [/game|spiel|arcade/, 'game'],
        [/bank|wallet|pay|finance|geld|karte|card/, 'bank'],
        [/note|memo|keep|todo|task|notiz/, 'notes'],
        [/file|explorer|manager|drive|dokument|datei/, 'files'],
        [/browser|chrome|firefox|brave|opera|vivaldi|internet/, 'browser'],
        [/weather|wetter|climate/, 'weather'],
        [/setting|config|einstell/, 'settings']
    ];
    function guessIcon(app) {
        if (app._icon) return app._icon;
        const hay = ((app.label || '') + ' ' + (app.packageName || '')).toLowerCase();
        for (const [re, name] of ICON_RULES) if (re.test(hay)) return (app._icon = name);
        return (app._icon = 'app');
    }

    // drawer categories derive from the guessed glyph (same keyword rules), so
    // there is no second classifier to keep in sync. order = chip order.
    const CATEGORIES = [
        ['comm', 'Kommunikation', ['phone', 'message', 'mail', 'browser']],
        ['media', 'Medien', ['camera', 'photos', 'music', 'video']],
        ['org', 'Organisation', ['clock', 'calendar', 'notes', 'calculator', 'files']],
        ['travel', 'Unterwegs', ['maps', 'weather']],
        ['money', 'Shop & Geld', ['store', 'bank']],
        ['games', 'Spiele', ['game']],
        ['system', 'System', ['settings']],
        ['other', 'Sonstige', ['app']]
    ];
    const CAT_OF_ICON = new Map(CATEGORIES.flatMap(([id, , icons]) => icons.map(i => [i, id])));
    const categoryOf = app => CAT_OF_ICON.get(guessIcon(app)) || 'other';

    // diacritic-insensitive lowercase, used for search and first-letter bucketing
    const norm = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('');
    function letterOf(app) {
        const c = norm(app.label).trim().charAt(0).toUpperCase();
        return c >= 'A' && c <= 'Z' ? c : '#';
    }

    // ---- state ----

    const STORE_KEY = 'launcher';
    const COLS_MIN = 3, COLS_MAX = 10;
    const COLOR_PRESETS = ['#e6e6e6', '#111111', '#4f8cff', '#22c55e', '#f97316', '#ec4899'];

    const defaults = () => ({
        cols: 4,
        iconColor: '#e6e6e6',
        gap: 8,            // px between cells
        cellPad: 12,       // px inside each cell (around the glyph)
        shape: 'squircle', // circle | square | squircle
        borderSize: 0,     // px cell border
        borderColor: '#ffffff',
        cellBg: '#ffffff',
        cellBgAlpha: 0.05,
        showLabel: true,
        uppercase: false,
        cutLabel: true,    // false = wrap to multiple lines
        customCss: '',
        pageBg: '#0d0d10',
        pageBgAlpha: 1,    // < 1 lets the system wallpaper show through
        folders: [],       // [{ id, name, apps: [packageName] }]
        home: null,        // [packageName] pinned to the home screen; null = not seeded yet
        barsPos: 'bottom', // drawer filter bars: top | bottom
        barsOrder: ['cat', 'letter', 'search'] // top-to-bottom order of the drawer bars
    });

    // drawer filter bars: state key -> element id + settings label
    const BARS = { cat: ['catBar', 'Kategorien'], letter: ['letterBar', 'Anfangsbuchstaben'], search: ['searchBar', 'Suchfeld'] };

    // first-run home: a few everyday apps, so the home screen is not empty
    const SEED_ICONS = ['phone', 'message', 'browser', 'camera', 'mail', 'photos'];

    let state = load();
    let apps = [];
    let appByPkg = new Map();

    function load() {
        try {
            const s = Object.assign(defaults(), JSON.parse(localStorage.getItem(STORE_KEY) || '{}'));
            s.cols = clamp(s.cols | 0 || 4, COLS_MIN, COLS_MAX);
            if (!Array.isArray(s.folders)) s.folders = [];
            if (s.home != null && !Array.isArray(s.home)) s.home = null;
            if (s.barsPos !== 'top') s.barsPos = 'bottom';
            // keep barsOrder a permutation of the known bars, whatever was stored
            const order = Array.isArray(s.barsOrder) ? s.barsOrder.filter((k, i, a) => BARS[k] && a.indexOf(k) === i) : [];
            s.barsOrder = order.concat(Object.keys(BARS).filter(k => !order.includes(k)));
            return s;
        } catch (e) { return defaults(); }
    }
    function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {} }

    // ---- folder helpers ----

    const uid = () => 'f' + Math.random().toString(36).slice(2, 9);
    const folderOf = pkg => state.folders.find(f => f.apps.includes(pkg)) || null;
    function createFolder(name) { const f = { id: uid(), name: name || 'Ordner', apps: [] }; state.folders.push(f); save(); return f; }
    // deleting a folder keeps its apps on the home screen as plain pins
    function deleteFolder(id) {
        const f = state.folders.find(x => x.id === id);
        if (f && state.home) for (const p of f.apps) if (!state.home.includes(p)) state.home.push(p);
        state.folders = state.folders.filter(x => x.id !== id); save();
    }
    function renameFolder(id, name) { const f = state.folders.find(x => x.id === id); if (f) { f.name = name || f.name; save(); } }
    function moveToFolder(pkg, folderId) { removeFromFolder(pkg); const f = state.folders.find(x => x.id === folderId); if (f && !f.apps.includes(pkg)) f.apps.push(pkg); save(); }
    function removeFromFolder(pkg) { for (const f of state.folders) { const i = f.apps.indexOf(pkg); if (i >= 0) f.apps.splice(i, 1); } save(); }
    function folderApps(folder) { return folder.apps.map(p => appByPkg.get(p)).filter(Boolean); }

    // ---- home pins ----
    // an app is on the home screen when it is pinned OR inside a folder (folders
    // live on the home screen). a foldered app is not also listed as a pin.

    const isPinned = pkg => state.home.includes(pkg);
    function pin(pkg) { if (!isPinned(pkg)) state.home.push(pkg); save(); }
    function unpin(pkg) { state.home = state.home.filter(p => p !== pkg); save(); }
    function homeApps() {
        const inFolder = new Set(state.folders.flatMap(f => f.apps));
        return state.home.filter(p => !inFolder.has(p)).map(p => appByPkg.get(p)).filter(Boolean);
    }
    function seedHome() {
        if (state.home) return;
        const picked = [];
        for (const icon of SEED_ICONS) {
            const a = apps.find(x => guessIcon(x) === icon && !picked.includes(x.packageName));
            if (a) picked.push(a.packageName);
        }
        state.home = picked; save();
    }

    // ---- dom helpers ----

    const $ = id => document.getElementById(id);
    function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
    function hexToRgba(hex, alpha) {
        const m = /^#?([0-9a-f]{6})$/i.exec((hex || '').trim());
        if (!m) return hex;
        const n = parseInt(m[1], 16);
        return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
    }

    let toastTimer = 0;
    function toast(msg) {
        const el = $('status');
        el.textContent = msg; el.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
    }

    // tap vs scroll vs long-press. the earlier version launched on any touchend
    // that was not a long-press, so a scroll that started on a tile fired a
    // launch. now a move past the threshold marks the gesture as a scroll and
    // suppresses both the tap and the hold.
    function bindTile(el, onTap, onHold) {
        let timer = 0, held = false, moved = false, sx = 0, sy = 0;
        const THRESH = 12;
        const clearTimer = () => { clearTimeout(timer); timer = 0; };
        const start = e => {
            held = false; moved = false;
            const p = e.touches ? e.touches[0] : e;
            sx = p.clientX; sy = p.clientY;
            clearTimer();
            timer = setTimeout(() => { if (!moved) { held = true; vibrate(); onHold && onHold(); } }, 480);
        };
        const move = e => {
            const p = e.touches ? e.touches[0] : e;
            if (Math.abs(p.clientX - sx) > THRESH || Math.abs(p.clientY - sy) > THRESH) { moved = true; clearTimer(); }
        };
        const end = () => { clearTimer(); if (!held && !moved) onTap && onTap(); };
        el.addEventListener('touchstart', start, { passive: true });
        el.addEventListener('touchmove', move, { passive: true });
        el.addEventListener('touchend', end);
        el.addEventListener('touchcancel', () => { clearTimer(); moved = true; });
        // mouse (browser dev): plain click launches, right-click holds.
        el.addEventListener('click', () => { if (!('ontouchstart' in window)) onTap && onTap(); });
        el.addEventListener('contextmenu', e => { e.preventDefault(); onHold && onHold(); });
    }
    function vibrate() { try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) {} }

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    // ---- tiles ----

    function appTile(app) {
        const el = document.createElement('button');
        el.className = 'tile';
        el.innerHTML = '<span class="tile-icon">' + svg(guessIcon(app)) + '</span>' +
            '<span class="tile-label">' + escapeHtml(app.label) + '</span>';
        bindTile(el, () => { launch(app.packageName); closeDrawer(); }, () => openAppActions(app));
        return el;
    }
    function folderTile(folder) {
        const el = document.createElement('button');
        el.className = 'tile';
        const preview = folderApps(folder).slice(0, 4)
            .map(a => '<span class="mini">' + svg(guessIcon(a), 'icon-mini') + '</span>').join('');
        el.innerHTML = '<span class="tile-icon folder-icon">' + (preview || svg('folder')) + '</span>' +
            '<span class="tile-label">' + escapeHtml(folder.name) + '</span>';
        bindTile(el, () => openFolder(folder), () => openFolderActions(folder));
        return el;
    }

    // ---- appearance (css vars + body classes, applied live) ----

    function applyStyleVars() {
        const b = document.body.style;
        b.setProperty('--cols', state.cols);
        b.setProperty('--icon-color', state.iconColor);
        b.setProperty('--gap', state.gap + 'px');
        b.setProperty('--cell-pad', state.cellPad + 'px');
        b.setProperty('--cell-radius', state.shape === 'circle' ? '50%' : state.shape === 'square' ? '14px' : '32%');
        b.setProperty('--cell-border', state.borderSize + 'px');
        b.setProperty('--cell-border-color', state.borderColor);
        b.setProperty('--cell-bg', hexToRgba(state.cellBg, state.cellBgAlpha));
        b.setProperty('--page-bg', hexToRgba(state.pageBg, state.pageBgAlpha));
        document.body.classList.toggle('no-label', !state.showLabel);
        document.body.classList.toggle('uppercase', state.uppercase);
        document.body.classList.toggle('multiline', !state.cutLabel);
        $('customCssStyle').textContent = state.customCss || '';
        document.body.classList.toggle('drawer-bars-top', state.barsPos === 'top');
        state.barsOrder.forEach((k, i) => { $(BARS[k][0]).style.order = i; });
        // when the page bg is not fully opaque, ask native to show the wallpaper behind
        try { plugin.setShowWallpaper({ show: state.pageBgAlpha < 1 }); } catch (e) {}
    }

    function renderHome() {
        const grid = $('grid');
        grid.innerHTML = '';
        for (const f of state.folders) grid.appendChild(folderTile(f));
        for (const a of homeApps()) grid.appendChild(appTile(a));
        if (!grid.children.length) {
            grid.innerHTML = '<p class="empty">' + (apps.length
                ? 'homescreen ist leer. im app-drawer eine app lange drücken und anheften.'
                : 'keine apps gefunden') + '</p>';
        }
    }
    function renderAll() { renderHome(); if (!$('drawer').hidden) renderDrawer(); }

    // ---- app drawer ----
    // three stacked bars at the bottom (categories, first letters, search). all
    // three filters combine (and). they reset whenever the drawer opens.

    const drawerFilter = { cat: null, letter: null, query: '' };

    function matchesQuery(app, q) {
        return !q || norm(app.label).includes(q) || app.packageName.toLowerCase().includes(q);
    }
    function drawerApps(skipLetter) {
        const q = norm(drawerFilter.query).trim();
        return apps.filter(a =>
            (!drawerFilter.cat || categoryOf(a) === drawerFilter.cat) &&
            (skipLetter || !drawerFilter.letter || letterOf(a) === drawerFilter.letter) &&
            matchesQuery(a, q));
    }

    function renderCatBar() {
        const bar = $('catBar');
        bar.innerHTML = '';
        const present = new Set(apps.map(categoryOf));
        const chips = [[null, 'Alle']].concat(CATEGORIES.filter(c => present.has(c[0])).map(c => [c[0], c[1]]));
        for (const [id, label] of chips) {
            const b = document.createElement('button');
            b.className = 'cat-chip' + (drawerFilter.cat === id ? ' active' : '');
            b.textContent = label;
            b.addEventListener('click', () => { drawerFilter.cat = id; renderDrawer(); });
            bar.appendChild(b);
        }
    }

    function renderLetterBar() {
        const bar = $('letterBar');
        bar.innerHTML = '';
        // letters are enabled relative to the other two filters
        const present = new Set(drawerApps(true).map(letterOf));
        if (drawerFilter.letter && !present.has(drawerFilter.letter)) drawerFilter.letter = null;
        for (const l of LETTERS) {
            const b = document.createElement('button');
            b.className = 'letter' + (drawerFilter.letter === l ? ' active' : '');
            b.textContent = l;
            b.dataset.letter = l;
            b.disabled = !present.has(l);
            bar.appendChild(b);
        }
    }

    function renderDrawerGrid() {
        const grid = $('drawerGrid');
        grid.innerHTML = '';
        const list = drawerApps(false);
        if (!list.length) grid.innerHTML = '<p class="empty">keine treffer</p>';
        else for (const a of list) grid.appendChild(appTile(a));
    }

    function renderDrawer() {
        renderCatBar();
        renderLetterBar();
        renderDrawerGrid();
        $('searchClear').hidden = !drawerFilter.query;
    }

    function openDrawer() {
        drawerFilter.cat = null; drawerFilter.letter = null; drawerFilter.query = '';
        $('drawerSearch').value = '';
        renderDrawer();
        $('drawer').hidden = false;
        $('drawerScroll').scrollTop = 0;
        const cat = $('catBar').querySelector('.active');
        if (cat) cat.scrollIntoView({ inline: 'nearest', block: 'nearest' });
    }
    function closeDrawer() {
        if ($('drawer').hidden) return;
        $('drawerSearch').blur();
        $('drawer').hidden = true;
    }

    function setLetter(l, toggle) {
        const next = toggle && drawerFilter.letter === l ? null : l;
        if (next === drawerFilter.letter) return;
        drawerFilter.letter = next;
        renderLetterBar();
        renderDrawerGrid();
        $('drawerScroll').scrollTop = 0;
    }

    function wireDrawer() {
        $('drawerToggle').addEventListener('click', openDrawer);
        $('drawerHandle').addEventListener('click', closeDrawer);

        // letter bar: tap toggles a letter, dragging a finger along the bar scrubs.
        const bar = $('letterBar');
        bar.addEventListener('click', e => {
            const b = e.target.closest('.letter');
            if (b && !b.disabled) setLetter(b.dataset.letter, true);
        });
        bar.addEventListener('touchmove', e => {
            const t = e.touches[0];
            const b = document.elementFromPoint(t.clientX, t.clientY);
            if (b && b.classList && b.classList.contains('letter') && !b.disabled) { setLetter(b.dataset.letter, false); }
            e.preventDefault();
        }, { passive: false });

        const input = $('drawerSearch');
        input.addEventListener('input', () => {
            drawerFilter.query = input.value;
            renderLetterBar();
            renderDrawerGrid();
            $('searchClear').hidden = !input.value;
            $('drawerScroll').scrollTop = 0;
        });
        input.addEventListener('keydown', e => {
            if (e.key !== 'Enter') return;
            const first = drawerApps(false)[0];
            if (first) { launch(first.packageName); closeDrawer(); }
        });
        $('searchClear').addEventListener('click', () => {
            input.value = ''; input.dispatchEvent(new Event('input')); input.focus();
        });

        // swipe up on the home screen opens the drawer, swipe down at the top of
        // the drawer list closes it.
        swipe($('home'), dy => dy < -70, openDrawer);
        swipe($('drawerScroll'), dy => dy > 90, closeDrawer);
    }

    function atBottom(el) { return el.scrollTop + el.clientHeight >= el.scrollHeight - 2; }
    // vertical swipe detector. `accept(dy)` is checked on touchend. the scroll
    // edge is captured at touchstart, so a scroll that merely ends at an edge
    // is not a swipe; only a gesture that starts there counts.
    function swipe(el, accept, onSwipe) {
        let sx = 0, sy = 0, edge = null, active = false;
        el.addEventListener('touchstart', e => {
            const t = e.touches[0]; sx = t.clientX; sy = t.clientY; active = true;
            edge = { top: el.scrollTop <= 0, bottom: atBottom(el) };
        }, { passive: true });
        el.addEventListener('touchend', e => {
            if (!active) return; active = false;
            const t = e.changedTouches[0];
            const dx = t.clientX - sx, dy = t.clientY - sy;
            if (Math.abs(dy) < Math.abs(dx) * 1.5) return;
            if ((dy < 0 && !edge.bottom) || (dy > 0 && !edge.top)) return;
            if (accept(dy)) onSwipe();
        });
    }

    // ---- launch ----

    async function launch(pkg) {
        try { await plugin.launchApp({ packageName: pkg }); }
        catch (e) { toast('konnte app nicht starten'); }
    }

    // ---- overlays ----

    function openOverlay(id, withBackdrop) {
        if (withBackdrop !== false) $('backdrop').hidden = false;
        $(id).hidden = false;
    }
    function closeOverlay(id) {
        $(id).hidden = true;
        const anyOpen = ['folderView'].some(x => !$(x).hidden);
        if (!anyOpen) $('backdrop').hidden = true;
    }
    // back closes the top-most layer: sheets/overlays first, then the drawer
    function goBack() {
        const anySheet = ['folderView', 'settingsPanel', 'actionSheet'].some(x => !$(x).hidden);
        if (anySheet) closeAll(); else closeDrawer();
    }
    function closeAll() {
        ['folderView', 'settingsPanel', 'actionSheet'].forEach(x => { $(x).hidden = true; });
        $('backdrop').hidden = true;
    }

    // ---- folder overlay ----

    let openFolderId = null;
    function openFolder(folder) {
        openFolderId = folder.id;
        $('folderTitle').textContent = folder.name;
        const grid = $('folderGrid');
        grid.innerHTML = '';
        const items = folderApps(folder);
        if (!items.length) grid.innerHTML = '<p class="empty">ordner ist leer</p>';
        else for (const a of items) grid.appendChild(appTile(a));
        openOverlay('folderView');
    }

    // ---- action sheet ----

    function sheetButton(iconName, label, onClick, danger) {
        const b = document.createElement('button');
        b.className = 'sheet-btn' + (danger ? ' danger' : '');
        b.innerHTML = svg(iconName, 'icon-sm') + '<span>' + escapeHtml(label) + '</span>';
        b.addEventListener('click', () => { closeAll(); onClick(); });
        return b;
    }
    function openAppActions(app) {
        $('sheetTitle').textContent = app.label;
        const box = $('sheetActions');
        box.innerHTML = '';
        const pkg = app.packageName;
        box.appendChild(sheetButton('open', 'Öffnen', () => { launch(pkg); closeDrawer(); }));
        const current = folderOf(pkg);
        const pinned = isPinned(pkg);
        if (!current && !pinned) {
            box.appendChild(sheetButton('pin', 'Zum Homescreen hinzufügen', () => { pin(pkg); renderAll(); toast('zum homescreen hinzugefügt'); }));
        }
        // moving into a folder puts the app on the home screen via that folder
        for (const f of state.folders) {
            if (current && f.id === current.id) continue;
            box.appendChild(sheetButton('folder', 'In "' + f.name + '" verschieben', () => {
                moveToFolder(pkg, f.id); unpin(pkg); renderAll(); toast('in ' + f.name + ' verschoben');
            }));
        }
        box.appendChild(sheetButton('add', 'Neuer Ordner mit App', () => {
            const name = prompt('Ordnername:', 'Ordner'); if (name == null) return;
            const f = createFolder(name.trim() || 'Ordner'); moveToFolder(pkg, f.id); unpin(pkg); renderAll();
        }));
        if (current) {
            // leaving a folder keeps the app on the home screen as a plain pin
            box.appendChild(sheetButton('back', 'Aus "' + current.name + '" entfernen', () => {
                removeFromFolder(pkg); pin(pkg); renderAll();
            }));
        }
        if (current || pinned) {
            box.appendChild(sheetButton('close', 'Vom Homescreen entfernen', () => {
                removeFromFolder(pkg); unpin(pkg); renderAll(); toast('vom homescreen entfernt');
            }, true));
        }
        $('actionSheet').hidden = false;
        $('backdrop').hidden = false;
    }
    function openFolderActions(folder) {
        $('sheetTitle').textContent = folder.name;
        const box = $('sheetActions');
        box.innerHTML = '';
        box.appendChild(sheetButton('open', 'Öffnen', () => openFolder(folder)));
        box.appendChild(sheetButton('edit', 'Umbenennen', () => {
            const name = prompt('Ordnername:', folder.name); if (name == null) return;
            renameFolder(folder.id, name.trim()); renderHome();
        }));
        box.appendChild(sheetButton('trash', 'Ordner löschen', () => { deleteFolder(folder.id); renderHome(); }, true));
        $('actionSheet').hidden = false;
        $('backdrop').hidden = false;
    }

    // ---- settings ----

    function renderColorPresets() {
        const box = $('colorPresets');
        box.innerHTML = '';
        for (const c of COLOR_PRESETS) {
            const b = document.createElement('button');
            b.className = 'swatch' + (c.toLowerCase() === state.iconColor.toLowerCase() ? ' active' : '');
            b.style.background = c;
            b.setAttribute('aria-label', c);
            b.addEventListener('click', () => { state.iconColor = c; save(); $('iconColor').value = c; renderColorPresets(); applyStyleVars(); });
            box.appendChild(b);
        }
    }

    // segmented control bound to a string state key
    function renderSeg(boxId, key, options) {
        const box = $(boxId);
        box.innerHTML = '';
        for (const [value, label] of options) {
            const b = document.createElement('button');
            b.className = 'seg-btn' + (state[key] === value ? ' active' : '');
            b.textContent = label;
            b.addEventListener('click', () => { state[key] = value; save(); renderSeg(boxId, key, options); applyStyleVars(); });
            box.appendChild(b);
        }
    }
    const renderShapeSeg = () => renderSeg('shapeSeg', 'shape', [['circle', 'Kreis'], ['squircle', 'Squircle'], ['square', 'Eckig']]);
    const renderBarsPosSeg = () => renderSeg('barsPosSeg', 'barsPos', [['top', 'Oben'], ['bottom', 'Unten']]);

    function moveBar(i, dir) {
        const j = i + dir, o = state.barsOrder;
        if (j < 0 || j >= o.length) return;
        [o[i], o[j]] = [o[j], o[i]];
        save(); applyStyleVars(); renderBarsOrder();
    }
    function renderBarsOrder() {
        const ul = $('barsOrderList');
        ul.innerHTML = '';
        state.barsOrder.forEach((k, i) => {
            const li = document.createElement('li');
            li.className = 'order-row';
            li.innerHTML = '<span>' + BARS[k][1] + '</span>';
            const actions = document.createElement('span');
            actions.className = 'folder-row-actions';
            for (const [icon, dir, label] of [['up', -1, 'Nach oben'], ['down', 1, 'Nach unten']]) {
                const b = document.createElement('button');
                b.className = 'icon-btn'; b.innerHTML = svg(icon, 'icon-sm'); b.setAttribute('aria-label', label);
                b.disabled = i + dir < 0 || i + dir >= state.barsOrder.length;
                b.addEventListener('click', () => moveBar(i, dir));
                actions.appendChild(b);
            }
            li.appendChild(actions);
            ul.appendChild(li);
        });
    }

    // wire a range input to a numeric state key, live-applying + showing its value
    function wireRange(id, key, valId, suffix) {
        const el = $(id);
        el.value = state[key];
        if (valId) $(valId).textContent = state[key] + (suffix || '');
        el.addEventListener('input', () => {
            state[key] = Number(el.value); save();
            if (valId) $(valId).textContent = state[key] + (suffix || '');
            applyStyleVars();
        });
    }
    function wireColor(id, key) {
        const el = $(id); el.value = state[key];
        el.addEventListener('input', () => { state[key] = el.value; save(); applyStyleVars(); if (id === 'iconColor') renderColorPresets(); });
    }
    function wireToggle(id, key) {
        const el = $(id); el.checked = !!state[key];
        el.addEventListener('change', () => { state[key] = el.checked; save(); applyStyleVars(); });
    }

    function renderFolderList() {
        const ul = $('folderList');
        ul.innerHTML = '';
        if (!state.folders.length) { ul.innerHTML = '<li class="muted">noch keine ordner</li>'; return; }
        for (const f of state.folders) {
            const li = document.createElement('li');
            li.className = 'folder-row';
            li.innerHTML = '<span class="folder-row-name">' + svg('folder', 'icon-sm') +
                '<span>' + escapeHtml(f.name) + '</span><em>' + folderApps(f).length + '</em></span>';
            const actions = document.createElement('span');
            actions.className = 'folder-row-actions';
            const rn = document.createElement('button');
            rn.className = 'icon-btn'; rn.innerHTML = svg('edit', 'icon-sm'); rn.setAttribute('aria-label', 'Umbenennen');
            rn.addEventListener('click', () => { const name = prompt('Ordnername:', f.name); if (name == null) return; renameFolder(f.id, name.trim()); renderFolderList(); renderHome(); });
            const del = document.createElement('button');
            del.className = 'icon-btn danger'; del.innerHTML = svg('trash', 'icon-sm'); del.setAttribute('aria-label', 'Löschen');
            del.addEventListener('click', () => { deleteFolder(f.id); renderFolderList(); renderHome(); });
            actions.appendChild(rn); actions.appendChild(del);
            li.appendChild(actions);
            ul.appendChild(li);
        }
    }

    // settings shows WITHOUT the dimming/blur backdrop so the grid stays readable
    // and previews changes live while you adjust.
    function openSettings() {
        renderColorPresets();
        renderShapeSeg();
        renderBarsPosSeg();
        renderBarsOrder();
        renderFolderList();
        openOverlay('settingsPanel', false);
    }

    // ---- wiring ----

    function wire() {
        $('settingsToggle').addEventListener('click', openSettings);
        $('backdrop').addEventListener('click', closeAll);
        document.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', () => closeOverlay(el.getAttribute('data-close'))));
        document.querySelector('.sheet-cancel').addEventListener('click', closeAll);

        wireRange('rangeCols', 'cols', 'valCols');
        wireRange('rangeGap', 'gap', 'valGap', 'px');
        wireRange('rangePad', 'cellPad', 'valPad', 'px');
        wireRange('rangeBorder', 'borderSize', 'valBorder', 'px');
        wireRange('rangeCellAlpha', 'cellBgAlpha', 'valCellAlpha');
        wireRange('rangePageAlpha', 'pageBgAlpha', 'valPageAlpha');
        wireColor('iconColor', 'iconColor');
        wireColor('borderColor', 'borderColor');
        wireColor('cellBg', 'cellBg');
        wireColor('pageBg', 'pageBg');
        wireToggle('toggleLabel', 'showLabel');
        wireToggle('toggleUppercase', 'uppercase');
        wireToggle('toggleMultiline', 'cutLabel'); // note: checked = cut (single line)

        const css = $('customCss');
        css.value = state.customCss || '';
        css.addEventListener('input', () => { state.customCss = css.value; save(); applyStyleVars(); });

        $('addFolderBtn').addEventListener('click', () => {
            const name = prompt('Ordnername:', 'Ordner'); if (name == null) return;
            createFolder(name.trim() || 'Ordner'); renderFolderList(); renderHome();
        });
        document.addEventListener('keydown', e => { if (e.key === 'Escape') goBack(); });
        // native events from MainActivity: hardware back, and home pressed while
        // already on the launcher (singleTask -> onNewIntent).
        window.addEventListener('launcherback', goBack);
        window.addEventListener('launcherhome', () => { closeAll(); closeDrawer(); });
        wireDrawer();
    }

    function renderStaticIcons() {
        document.querySelectorAll('[data-icon]').forEach(el => el.insertAdjacentHTML('afterbegin', svg(el.getAttribute('data-icon'), 'icon-sm')));
    }

    async function init() {
        renderStaticIcons();
        wire();
        applyStyleVars();
        try { const res = await plugin.getApps(); apps = (res && res.apps) || []; }
        catch (e) { apps = []; toast('konnte apps nicht laden'); }
        appByPkg = new Map(apps.map(a => [a.packageName, a]));
        if (apps.length) seedHome(); else if (!state.home) state.home = [];
        renderHome();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
