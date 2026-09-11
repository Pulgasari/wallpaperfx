// launcher home ui. plain js, bundler-free. talks to the native Launcher
// capacitor plugin (getApps/launchApp). in a plain browser (no capacitor) a
// mock keeps the ui usable for layout work.
(function () {
    'use strict';

    // ---- plugin access ----

    function getPlugin() {
        const cap = window.Capacitor;
        if (cap && cap.Plugins && cap.Plugins.Launcher) {
            return cap.Plugins.Launcher;
        }
        // browser fallback: a fixed demo set, launch is a no-op alert.
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
            async launchApp({ packageName }) {
                toast('nur im nativen build: startet ' + packageName);
            }
        };
    }

    const plugin = getPlugin();

    // ---- icon set ----
    // monochrome line icons, viewbox 0 0 24 24, drawn from basic shapes so they
    // stay valid and recolor via `currentColor`. inner markup only; svg() wraps.

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
        close: '<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>',
        back: '<path d="M15 5l-7 7 7 7"/>',
        trash: '<path d="M6 7.5h12l-1 12.5H7z"/><line x1="4.5" y1="7.5" x2="19.5" y2="7.5"/><path d="M9.5 7.5V4.5h5v3"/>',
        edit: '<path d="M4 20h4L18 10l-4-4L4 16z"/><line x1="13" y1="7" x2="17" y2="11"/>',
        open: '<path d="M14 4h6v6"/><line x1="20" y1="4" x2="11" y2="13"/><path d="M18 14v4a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h4"/>'
    };

    // returns an <svg> string for the named icon (falls back to the app glyph).
    function svg(name, cls) {
        const inner = ICONS[name] || ICONS.app;
        return '<svg class="' + (cls || 'icon') + '" viewBox="0 0 24 24" fill="none" ' +
            'stroke="currentColor" stroke-width="1.7" stroke-linecap="round" ' +
            'stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>';
    }

    // keyword -> icon guess. order matters (first match wins). tested against the
    // lowercased "label packagename" so both the visible name and the package id
    // can trigger a match. unknown apps get the generic app glyph.
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
        [/weather|wetter|climate/, 'weather'],
        [/setting|config|einstell/, 'settings']
    ];

    function guessIcon(app) {
        const hay = ((app.label || '') + ' ' + (app.packageName || '')).toLowerCase();
        for (const [re, name] of ICON_RULES) {
            if (re.test(hay)) return name;
        }
        return 'app';
    }

    // ---- state ----
    // persisted in localStorage. apps themselves are queried live from the device;
    // only preferences and folder membership (by package name) are stored.

    const STORE_KEY = 'launcher';
    const COLS_MIN = 3, COLS_MAX = 6;
    const COLOR_PRESETS = ['#e6e6e6', '#111111', '#4f8cff', '#22c55e', '#f97316', '#ec4899'];

    const defaults = () => ({
        cols: 4,
        iconColor: '#e6e6e6',
        folders: [] // [{ id, name, apps: [packageName, ...] }]
    });

    let state = load();
    let apps = [];               // live [{ packageName, label }]
    let appByPkg = new Map();    // packageName -> app

    function load() {
        try {
            const raw = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
            const s = Object.assign(defaults(), raw);
            s.cols = clamp(s.cols | 0 || 4, COLS_MIN, COLS_MAX);
            if (!Array.isArray(s.folders)) s.folders = [];
            return s;
        } catch (e) {
            return defaults();
        }
    }

    function save() {
        try {
            localStorage.setItem(STORE_KEY, JSON.stringify(state));
        } catch (e) { /* private mode etc. */ }
    }

    // ---- folder helpers ----

    const uid = () => 'f' + Math.random().toString(36).slice(2, 9);

    function folderOf(pkg) {
        return state.folders.find(f => f.apps.includes(pkg)) || null;
    }

    function createFolder(name) {
        const f = { id: uid(), name: name || 'Ordner', apps: [] };
        state.folders.push(f);
        save();
        return f;
    }

    function deleteFolder(id) {
        // apps in a deleted folder fall back to the top-level grid automatically.
        state.folders = state.folders.filter(f => f.id !== id);
        save();
    }

    function renameFolder(id, name) {
        const f = state.folders.find(x => x.id === id);
        if (f) { f.name = name || f.name; save(); }
    }

    function moveToFolder(pkg, folderId) {
        removeFromFolder(pkg);
        const f = state.folders.find(x => x.id === folderId);
        if (f && !f.apps.includes(pkg)) f.apps.push(pkg);
        save();
    }

    function removeFromFolder(pkg) {
        for (const f of state.folders) {
            const i = f.apps.indexOf(pkg);
            if (i >= 0) f.apps.splice(i, 1);
        }
        save();
    }

    // apps that live in a folder are hidden from the top-level grid.
    function topLevelApps() {
        const inFolder = new Set(state.folders.flatMap(f => f.apps));
        return apps.filter(a => !inFolder.has(a.packageName));
    }

    // known packages only, in stored order (drops uninstalled apps silently).
    function folderApps(folder) {
        return folder.apps.map(p => appByPkg.get(p)).filter(Boolean);
    }

    // ---- dom helpers ----

    const $ = id => document.getElementById(id);
    // function declaration (hoisted): load() calls this before this line runs.
    function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

    let toastTimer = 0;
    function toast(msg) {
        const el = $('status');
        el.textContent = msg;
        el.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
    }

    // tap vs long-press on a tile without firing a launch after a hold.
    function bindTile(el, onTap, onHold) {
        let timer = 0, held = false, sx = 0, sy = 0;
        const start = e => {
            held = false;
            const p = e.touches ? e.touches[0] : e;
            sx = p.clientX; sy = p.clientY;
            timer = setTimeout(() => { held = true; navigatorVibrate(); onHold && onHold(); }, 480);
        };
        const move = e => {
            const p = e.touches ? e.touches[0] : e;
            if (Math.abs(p.clientX - sx) > 10 || Math.abs(p.clientY - sy) > 10) cancel();
        };
        const cancel = () => { clearTimeout(timer); };
        const end = () => { clearTimeout(timer); if (!held) onTap && onTap(); };
        el.addEventListener('touchstart', start, { passive: true });
        el.addEventListener('touchmove', move, { passive: true });
        el.addEventListener('touchend', end);
        el.addEventListener('touchcancel', cancel);
        // mouse (browser dev): plain click launches, contextmenu holds.
        el.addEventListener('click', e => { if (!('ontouchstart' in window)) onTap && onTap(); });
        el.addEventListener('contextmenu', e => { e.preventDefault(); onHold && onHold(); });
    }

    function navigatorVibrate() {
        try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) {}
    }

    // ---- tile builders ----

    function appTile(app) {
        const el = document.createElement('button');
        el.className = 'tile';
        el.innerHTML = '<span class="tile-icon">' + svg(guessIcon(app)) + '</span>' +
            '<span class="tile-label">' + escapeHtml(app.label) + '</span>';
        bindTile(el, () => launch(app.packageName), () => openAppActions(app));
        return el;
    }

    function folderTile(folder) {
        const el = document.createElement('button');
        el.className = 'tile';
        const preview = folderApps(folder).slice(0, 4)
            .map(a => '<span class="mini">' + svg(guessIcon(a), 'icon-mini') + '</span>').join('');
        el.innerHTML = '<span class="tile-icon folder-icon">' +
            (preview || svg('folder')) + '</span>' +
            '<span class="tile-label">' + escapeHtml(folder.name) + '</span>';
        bindTile(el, () => openFolder(folder), () => openFolderActions(folder));
        return el;
    }

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, c => (
            { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
        ));
    }

    // ---- render ----

    function applyGridVars() {
        document.body.style.setProperty('--cols', state.cols);
        document.body.style.setProperty('--icon-color', state.iconColor);
    }

    function renderHome() {
        applyGridVars();
        const grid = $('grid');
        grid.innerHTML = '';
        for (const f of state.folders) grid.appendChild(folderTile(f));
        for (const a of topLevelApps()) grid.appendChild(appTile(a));
        if (!state.folders.length && !apps.length) {
            grid.innerHTML = '<p class="empty">keine apps gefunden</p>';
        }
    }

    // ---- actions: launch ----

    async function launch(pkg) {
        try {
            await plugin.launchApp({ packageName: pkg });
        } catch (e) {
            toast('konnte app nicht starten');
        }
    }

    // ---- overlays ----

    function openOverlay(id) {
        $('backdrop').hidden = false;
        $(id).hidden = false;
    }

    function closeOverlay(id) {
        $(id).hidden = true;
        // hide the backdrop only when nothing else is open.
        const anyOpen = ['folderView', 'settingsPanel'].some(x => !$(x).hidden);
        if (!anyOpen) $('backdrop').hidden = true;
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
        if (!items.length) {
            grid.innerHTML = '<p class="empty">ordner ist leer</p>';
        } else {
            for (const a of items) grid.appendChild(appTile(a));
        }
        openOverlay('folderView');
    }

    // ---- action sheet (per-app) ----

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
        box.appendChild(sheetButton('open', 'Öffnen', () => launch(app.packageName)));

        const current = folderOf(app.packageName);
        // move-to-folder entries: existing folders (minus the current one).
        for (const f of state.folders) {
            if (current && f.id === current.id) continue;
            box.appendChild(sheetButton('folder', 'In "' + f.name + '" verschieben', () => {
                moveToFolder(app.packageName, f.id);
                renderHome();
                toast('in ' + f.name + ' verschoben');
            }));
        }
        box.appendChild(sheetButton('add', 'Neuer Ordner mit App', () => {
            const name = prompt('Ordnername:', 'Ordner');
            if (name == null) return;
            const f = createFolder(name.trim() || 'Ordner');
            moveToFolder(app.packageName, f.id);
            renderHome();
        }));
        if (current) {
            box.appendChild(sheetButton('back', 'Aus "' + current.name + '" entfernen', () => {
                removeFromFolder(app.packageName);
                renderHome();
                if (!$('folderView').hidden) {
                    const f = state.folders.find(x => x.id === openFolderId);
                    if (f) openFolder(f);
                }
            }));
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
            const name = prompt('Ordnername:', folder.name);
            if (name == null) return;
            renameFolder(folder.id, name.trim());
            renderHome();
        }));
        box.appendChild(sheetButton('trash', 'Ordner löschen', () => {
            deleteFolder(folder.id);
            renderHome();
        }, true));
        $('actionSheet').hidden = false;
        $('backdrop').hidden = false;
    }

    // ---- settings ----

    function renderColsChoice() {
        const box = $('colsChoice');
        box.innerHTML = '';
        for (let c = COLS_MIN; c <= COLS_MAX; c++) {
            const b = document.createElement('button');
            b.className = 'seg-btn' + (c === state.cols ? ' active' : '');
            b.textContent = c;
            b.addEventListener('click', () => {
                state.cols = c; save();
                renderColsChoice(); renderHome();
            });
            box.appendChild(b);
        }
    }

    function renderColorPresets() {
        const box = $('colorPresets');
        box.innerHTML = '';
        for (const c of COLOR_PRESETS) {
            const b = document.createElement('button');
            b.className = 'swatch' + (c.toLowerCase() === state.iconColor.toLowerCase() ? ' active' : '');
            b.style.background = c;
            b.setAttribute('aria-label', c);
            b.addEventListener('click', () => setIconColor(c));
            box.appendChild(b);
        }
    }

    function setIconColor(c) {
        state.iconColor = c; save();
        $('iconColor').value = c;
        renderColorPresets();
        applyGridVars();
        renderHome();
    }

    function renderFolderList() {
        const ul = $('folderList');
        ul.innerHTML = '';
        if (!state.folders.length) {
            ul.innerHTML = '<li class="muted">noch keine ordner</li>';
            return;
        }
        for (const f of state.folders) {
            const li = document.createElement('li');
            li.className = 'folder-row';
            li.innerHTML = '<span class="folder-row-name">' + svg('folder', 'icon-sm') +
                '<span>' + escapeHtml(f.name) + '</span>' +
                '<em>' + folderApps(f).length + '</em></span>';
            const actions = document.createElement('span');
            actions.className = 'folder-row-actions';
            const rn = document.createElement('button');
            rn.className = 'icon-btn'; rn.innerHTML = svg('edit', 'icon-sm');
            rn.setAttribute('aria-label', 'Umbenennen');
            rn.addEventListener('click', () => {
                const name = prompt('Ordnername:', f.name);
                if (name == null) return;
                renameFolder(f.id, name.trim());
                renderFolderList(); renderHome();
            });
            const del = document.createElement('button');
            del.className = 'icon-btn danger'; del.innerHTML = svg('trash', 'icon-sm');
            del.setAttribute('aria-label', 'Löschen');
            del.addEventListener('click', () => {
                deleteFolder(f.id);
                renderFolderList(); renderHome();
            });
            actions.appendChild(rn); actions.appendChild(del);
            li.appendChild(actions);
            ul.appendChild(li);
        }
    }

    function openSettings() {
        renderColsChoice();
        renderColorPresets();
        renderFolderList();
        $('iconColor').value = state.iconColor;
        openOverlay('settingsPanel');
    }

    // ---- wiring ----

    function wire() {
        $('settingsToggle').addEventListener('click', openSettings);
        $('backdrop').addEventListener('click', closeAll);

        // any [data-close] closes its named overlay.
        document.querySelectorAll('[data-close]').forEach(el => {
            el.addEventListener('click', () => closeOverlay(el.getAttribute('data-close')));
        });
        // the action sheet cancel closes everything (backdrop included).
        document.querySelector('.sheet-cancel').addEventListener('click', closeAll);

        $('iconColor').addEventListener('input', e => setIconColor(e.target.value));
        $('addFolderBtn').addEventListener('click', () => {
            const name = prompt('Ordnername:', 'Ordner');
            if (name == null) return;
            createFolder(name.trim() || 'Ordner');
            renderFolderList(); renderHome();
        });

        // esc closes overlays (browser dev convenience).
        document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAll(); });
    }

    // ---- init ----

    // fill static chrome buttons (fab, overlay-close, chips) with their glyph.
    function renderStaticIcons() {
        document.querySelectorAll('[data-icon]').forEach(el => {
            el.insertAdjacentHTML('afterbegin', svg(el.getAttribute('data-icon'), 'icon-sm'));
        });
    }

    async function init() {
        renderStaticIcons();
        wire();
        applyGridVars();
        try {
            const res = await plugin.getApps();
            apps = (res && res.apps) || [];
        } catch (e) {
            apps = [];
            toast('konnte apps nicht laden');
        }
        appByPkg = new Map(apps.map(a => [a.packageName, a]));
        renderHome();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
