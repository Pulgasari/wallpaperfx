// launcher home ui. plain js, bundler-free. talks to the native Launcher
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
        close: '<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>',
        back: '<path d="M15 5l-7 7 7 7"/>',
        trash: '<path d="M6 7.5h12l-1 12.5H7z"/><line x1="4.5" y1="7.5" x2="19.5" y2="7.5"/><path d="M9.5 7.5V4.5h5v3"/>',
        edit: '<path d="M4 20h4L18 10l-4-4L4 16z"/><line x1="13" y1="7" x2="17" y2="11"/>',
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
        [/weather|wetter|climate/, 'weather'],
        [/setting|config|einstell/, 'settings']
    ];
    function guessIcon(app) {
        const hay = ((app.label || '') + ' ' + (app.packageName || '')).toLowerCase();
        for (const [re, name] of ICON_RULES) if (re.test(hay)) return name;
        return 'app';
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
        folders: []        // [{ id, name, apps: [packageName] }]
    });

    let state = load();
    let apps = [];
    let appByPkg = new Map();

    function load() {
        try {
            const s = Object.assign(defaults(), JSON.parse(localStorage.getItem(STORE_KEY) || '{}'));
            s.cols = clamp(s.cols | 0 || 4, COLS_MIN, COLS_MAX);
            if (!Array.isArray(s.folders)) s.folders = [];
            return s;
        } catch (e) { return defaults(); }
    }
    function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {} }

    // ---- folder helpers ----

    const uid = () => 'f' + Math.random().toString(36).slice(2, 9);
    const folderOf = pkg => state.folders.find(f => f.apps.includes(pkg)) || null;
    function createFolder(name) { const f = { id: uid(), name: name || 'Ordner', apps: [] }; state.folders.push(f); save(); return f; }
    function deleteFolder(id) { state.folders = state.folders.filter(f => f.id !== id); save(); }
    function renameFolder(id, name) { const f = state.folders.find(x => x.id === id); if (f) { f.name = name || f.name; save(); } }
    function moveToFolder(pkg, folderId) { removeFromFolder(pkg); const f = state.folders.find(x => x.id === folderId); if (f && !f.apps.includes(pkg)) f.apps.push(pkg); save(); }
    function removeFromFolder(pkg) { for (const f of state.folders) { const i = f.apps.indexOf(pkg); if (i >= 0) f.apps.splice(i, 1); } save(); }
    function topLevelApps() { const inFolder = new Set(state.folders.flatMap(f => f.apps)); return apps.filter(a => !inFolder.has(a.packageName)); }
    function folderApps(folder) { return folder.apps.map(p => appByPkg.get(p)).filter(Boolean); }

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
        bindTile(el, () => launch(app.packageName), () => openAppActions(app));
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
        // when the page bg is not fully opaque, ask native to show the wallpaper behind
        try { plugin.setShowWallpaper({ show: state.pageBgAlpha < 1 }); } catch (e) {}
    }

    function renderHome() {
        const grid = $('grid');
        grid.innerHTML = '';
        for (const f of state.folders) grid.appendChild(folderTile(f));
        for (const a of topLevelApps()) grid.appendChild(appTile(a));
        if (!state.folders.length && !apps.length) grid.innerHTML = '<p class="empty">keine apps gefunden</p>';
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
        box.appendChild(sheetButton('open', 'Öffnen', () => launch(app.packageName)));
        const current = folderOf(app.packageName);
        for (const f of state.folders) {
            if (current && f.id === current.id) continue;
            box.appendChild(sheetButton('folder', 'In "' + f.name + '" verschieben', () => {
                moveToFolder(app.packageName, f.id); renderHome(); toast('in ' + f.name + ' verschoben');
            }));
        }
        box.appendChild(sheetButton('add', 'Neuer Ordner mit App', () => {
            const name = prompt('Ordnername:', 'Ordner'); if (name == null) return;
            const f = createFolder(name.trim() || 'Ordner'); moveToFolder(app.packageName, f.id); renderHome();
        }));
        if (current) {
            box.appendChild(sheetButton('back', 'Aus "' + current.name + '" entfernen', () => {
                removeFromFolder(app.packageName); renderHome();
                if (!$('folderView').hidden) { const f = state.folders.find(x => x.id === openFolderId); if (f) openFolder(f); }
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

    function renderShapeSeg() {
        const box = $('shapeSeg');
        box.innerHTML = '';
        for (const s of [['circle', 'Kreis'], ['squircle', 'Squircle'], ['square', 'Eckig']]) {
            const b = document.createElement('button');
            b.className = 'seg-btn' + (state.shape === s[0] ? ' active' : '');
            b.textContent = s[1];
            b.addEventListener('click', () => { state.shape = s[0]; save(); renderShapeSeg(); applyStyleVars(); });
            box.appendChild(b);
        }
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
        document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAll(); });
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
        renderHome();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
