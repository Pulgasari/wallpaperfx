// wallpaperfx config ui. plain js, talks to the native WallpaperFx capacitor
// plugin. when running in a plain browser (no capacitor) a mock keeps the ui usable.

// ---- plugin access ----

function getPlugin() {
    const cap = window.Capacitor;
    if (cap && cap.Plugins && cap.Plugins.WallpaperFx) {
        return cap.Plugins.WallpaperFx;
    }
    // browser fallback: log calls, pretend media picks
    return {
        async getConfig() {
            return JSON.parse(localStorage.getItem('wallpaperfx') || '{}');
        },
        async setConfig({ config }) {
            localStorage.setItem('wallpaperfx', JSON.stringify(config));
        },
        async pickMedia({ type }) {
            const name = type === 'image' ? 'demo_image.jpg' : 'demo_video.mp4';
            return { paths: ['/mock/' + Date.now() + '_' + name] };
        },
        async applyWallpaper() {
            alert('nur im nativen build: live-wallpaper-auswahl wird geöffnet');
        }
    };
}

const plugin = getPlugin();

// ---- state (mirrors WpConfig.java keys) ----

const state = {
    mode: 'video',
    videos: [], // [{ path, enabled }]
    videoOrder: 'loop', // loop | loop-random | single
    videoScale: 'cover',
    videoOffsetX: 0,
    videoOffsetY: 0,
    videoSpeed: 1,
    resumeVideo: true,
    images: [], // [{ path, enabled }]
    imageOrder: 'loop', // loop | loop-random | single
    imageDurationMs: 8000,
    imageTransitionMs: 800,
    imageScale: 'cover',
    imageOffsetX: 0,
    imageOffsetY: 0,
    flipX: false,
    flipY: false,
    filters: [], // ordered chain of filter entries (see newFilter)
    parallaxEnabled: false,
    parallaxAmount: 0.15,
    motionType: 'none',
    motionAmount: 0.5,
    motionSpeed: 0.5
};

// ---- helpers ----

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

// monochrome inline icons (feather-style, currentColor). filled into any element
// carrying data-icon="name" via applyIcons(). no emojis, themeable, scale with font.
const ICONS = {
    settings: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
    presets: '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
    sources: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
    wallpaper: '<rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>',
    save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>',
    add: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    clear: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    expand: '<path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/>',
    collapse: '<path d="M4 14h6v6"/><path d="M20 10h-6V4"/><path d="M14 10l7-7"/><path d="M3 21l7-7"/>',
    close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    pause: '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
    play: '<polygon points="6 4 20 12 6 20 6 4"/>'
};

function svgIcon(name) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
}

function applyIcons(root) {
    (root || document).querySelectorAll('[data-icon]').forEach((el) => {
        el.innerHTML = svgIcon(el.getAttribute('data-icon'));
    });
}

function basename(path) {
    if (!path) return '';
    const parts = path.split('/');
    let name = parts[parts.length - 1];
    // strip the timestamp prefix added by the native copy step
    const us = name.indexOf('_');
    if (us > 0 && /^\d+$/.test(name.slice(0, us))) name = name.slice(us + 1);
    return name;
}

function rgbToHex(rgb) {
    return '#' + rgb.map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
}

function hexToRgb(hex) {
    const m = hex.replace('#', '');
    return [parseInt(m.slice(0, 2), 16), parseInt(m.slice(2, 4), 16), parseInt(m.slice(4, 6), 16)];
}

// ---- filter chain model + list ui ----

// filter list, sorted alphabetically by label (drives the dropdown/order only;
// the shader index mapping lives in preview.js FILTER_INDEX and is independent).
const FILTER_TYPES = [
    ['bloom', 'Bloom'], ['blur', 'Blur'], ['chromatic', 'Chromatic'], ['crt', 'CRT'],
    ['duotone', 'Duotone'], ['duotone2', 'Duotone Cycle'], ['filmgrain', 'Film Grain'],
    ['fisheye', 'Fisheye'], ['glitch', 'Glitch'], ['gradientmap', 'Gradient Map'],
    ['grain', 'Grain'], ['grayscale', 'Graustufen'], ['halftone', 'Halftone'],
    ['invert', 'Invertieren'], ['noise', 'Noise'], ['pixelate', 'Pixelate'],
    ['posterize', 'Posterize'], ['scanlines', 'Scanlines'], ['sepia', 'Sepia'],
    ['vhs', 'VHS'], ['vignette', 'Vignette']
];
const FILTER_LABEL = Object.fromEntries(FILTER_TYPES);
const ANIMATED_FILTERS = ['filmgrain', 'glitch', 'vhs', 'duotone2'];

// per-type editable params. color rows: [key, label, 'color'].
// range rows: [key, label, min, max, step, decimals].
const FILTER_PARAMS = {
    duotone: [['colorA', 'Schatten', 'color'], ['colorB', 'Lichter', 'color']],
    duotone2: [['colorA', 'Schatten', 'color'], ['colorB', 'Licht A', 'color'], ['colorC', 'Licht B', 'color'], ['cycleSec', 'Dauer', 0.5, 20, 0.5, 1]],
    gradientmap: [['colorA', 'Dunkel', 'color'], ['colorC', 'Mitte', 'color'], ['colorB', 'Hell', 'color']],
    grayscale: [['amount', 'Stärke', 0, 1, 0.01, 2]],
    sepia: [['amount', 'Stärke', 0, 1, 0.01, 2]],
    posterize: [['levels', 'Stufen', 2, 16, 1, 0]],
    invert: [],
    pixelate: [['pixelSize', 'Blockgröße', 2, 64, 1, 0]],
    halftone: [['colorA', 'Ink', 'color'], ['colorB', 'Paper', 'color'], ['halftone', 'Raster', 20, 240, 5, 0]],
    scanlines: [['scanCount', 'Linien', 60, 900, 10, 0], ['scanStrength', 'Stärke', 0, 1, 0.01, 2]],
    crt: [['scanCount', 'Linien', 60, 900, 10, 0], ['scanStrength', 'Stärke', 0, 1, 0.01, 2], ['crtMask', 'Maske', 0, 1, 0.01, 2]],
    vignette: [['vignette', 'Stärke', 0, 1, 0.01, 2], ['vignetteRadius', 'Radius', 0, 1, 0.01, 2], ['vignetteColor', 'Farbe', 'color']],
    chromatic: [['chromatic', 'Versatz', 0, 0.03, 0.001, 3]],
    filmgrain: [['grain', 'Körnung', 0, 0.6, 0.01, 2]],
    glitch: [['glitch', 'Stärke', 0, 1, 0.01, 2]],
    vhs: [['vhs', 'Stärke', 0, 1, 0.01, 2]],
    bloom: [['bloom', 'Stärke', 0, 2, 0.01, 2], ['bloomThreshold', 'Schwelle', 0, 1, 0.01, 2]],
    blur: [['blurRadius', 'Radius', 0.5, 8, 0.1, 1]],
    fisheye: [['fisheye', 'Stärke', -1, 1, 0.01, 2]],
    grain: [['grain', 'Körnung', 0, 0.6, 0.01, 2]],
    noise: [['noise', 'Stärke', 0, 0.6, 0.01, 2]]
};

// a filter entry with the full param superset (mirrors WpConfig.FilterEntry)
function newFilter(type) {
    return {
        type: type, enabled: true,
        colorA: [18, 20, 42], colorB: [240, 186, 72], colorC: [120, 84, 168],
        scanCount: 320, scanStrength: 0.35, crtMask: 0.3,
        amount: 1, levels: 6, pixelSize: 12, halftone: 90,
        vignette: 0.6, vignetteRadius: 0.6, vignetteColor: [0, 0, 0], chromatic: 0.006,
        grain: 0.15, glitch: 0.5, vhs: 0.6,
        bloom: 0.6, bloomThreshold: 0.7, blurRadius: 2, fisheye: 0.5, noise: 0.15, cycleSec: 6
    };
}

// ---- shared tile helpers (used by filter + image grids) ----

function addTile(title, onClick) {
    const t = document.createElement('button');
    t.type = 'button';
    t.className = 'tile tile-add';
    t.title = title;
    t.textContent = '+';
    t.addEventListener('click', onClick);
    return t;
}

function tileX(onClick) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tile-x';
    b.textContent = '✕';
    b.title = 'entfernen';
    b.addEventListener('click', (e) => { e.stopPropagation(); onClick(); });
    return b;
}

function tileToggle(on, onChange) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tile-toggle' + (on ? ' on' : '');
    b.title = 'aktiv';
    b.addEventListener('click', (e) => {
        e.stopPropagation();
        const now = !b.classList.contains('on');
        b.classList.toggle('on', now);
        onChange(now);
    });
    return b;
}

// pointer drag-to-reorder within a tile grid. tiles carry __item; the "+" tile
// (.tile-add) always stays last. a tap without movement triggers onTap.
// list may be an array or a function returning the array (sources depend on mode).
function enableTileDrag(grid, list, onTap, commit) {
    const resolveList = () => (typeof list === 'function' ? list() : list);
    grid.addEventListener('pointerdown', (e) => {
        const tile = e.target.closest('.tile');
        if (!tile || tile.classList.contains('tile-add')) return;
        if (e.target.closest('.tile-x, .tile-toggle')) return;
        const item = tile.__item;
        const startX = e.clientX;
        const startY = e.clientY;
        let active = false;
        const addEl = grid.querySelector('.tile-add');

        const move = (ev) => {
            if (!active) {
                if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < 8) return;
                active = true;
                tile.classList.add('dragging');
                try { tile.setPointerCapture(ev.pointerId); } catch (err) {}
            }
            const after = tileAfter(grid, ev.clientX, ev.clientY);
            grid.insertBefore(tile, after || addEl);
        };
        const up = (ev) => {
            grid.removeEventListener('pointermove', move);
            grid.removeEventListener('pointerup', up);
            grid.removeEventListener('pointercancel', up);
            try { if (ev) tile.releasePointerCapture(ev.pointerId); } catch (err) {}
            if (active) {
                tile.classList.remove('dragging');
                const order = Array.from(grid.querySelectorAll('.tile:not(.tile-add)')).map((t) => t.__item);
                const arr = resolveList();
                arr.splice(0, arr.length, ...order);
                commit();
            } else if (onTap) {
                onTap(item);
            }
        };
        grid.addEventListener('pointermove', move);
        grid.addEventListener('pointerup', up);
        grid.addEventListener('pointercancel', up);
    });
}

function tileAfter(grid, x, y) {
    const tiles = Array.from(grid.querySelectorAll('.tile:not(.tile-add):not(.dragging)'));
    let best = null;
    let bestD = Infinity;
    for (const t of tiles) {
        const r = t.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        // insert before the tile the pointer sits left of / above (row-major)
        if (y < cy - 1 || (y < cy + r.height / 2 && x < cx)) {
            const d = Math.hypot(x - cx, y - cy);
            if (d < bestD) { bestD = d; best = t; }
        }
    }
    return best;
}

// ---- filter chain grid + editor ----

let selectedFilter = null;

function renderFilterGrid() {
    const grid = $('#filterGrid');
    if (!grid) return;
    grid.innerHTML = '';
    state.filters.forEach((f) => grid.append(buildFilterTile(f)));
    grid.append(addTile('filter hinzufügen', () => {
        const f = newFilter('duotone');
        state.filters.push(f);
        selectedFilter = f;
        renderFilterGrid();
    }));
    renderFilterEditor();
}

function buildFilterTile(f) {
    const tile = document.createElement('div');
    tile.className = 'tile filter-tile' + (f.enabled ? '' : ' disabled') + (f === selectedFilter ? ' selected' : '');
    tile.__item = f;

    const label = document.createElement('span');
    label.className = 'tile-label';
    label.textContent = FILTER_LABEL[f.type] || f.type;
    tile.append(label);

    tile.append(tileToggle(f.enabled, (on) => { f.enabled = on; tile.classList.toggle('disabled', !on); }));
    tile.append(tileX(() => {
        const i = state.filters.indexOf(f);
        if (i > -1) state.filters.splice(i, 1);
        if (selectedFilter === f) selectedFilter = null;
        renderFilterGrid();
    }));
    return tile;
}

function renderFilterEditor() {
    const box = $('#filterEditor');
    if (!box) return;
    box.innerHTML = '';
    if (!selectedFilter || state.filters.indexOf(selectedFilter) === -1) {
        box.hidden = true;
        return;
    }
    box.hidden = false;
    const f = selectedFilter;

    const typeLabel = document.createElement('label');
    typeLabel.className = 'field';
    const ts = document.createElement('span');
    ts.textContent = 'Typ';
    const sel = document.createElement('select');
    FILTER_TYPES.forEach(([v, label]) => {
        const o = document.createElement('option');
        o.value = v;
        o.textContent = label;
        if (v === f.type) o.selected = true;
        sel.append(o);
    });
    sel.addEventListener('change', (e) => { f.type = e.target.value; renderFilterGrid(); });
    typeLabel.append(ts, sel);
    box.append(typeLabel);

    (FILTER_PARAMS[f.type] || []).forEach((p) => box.append(buildParamControl(f, p)));
    if (ANIMATED_FILTERS.includes(f.type)) {
        const note = document.createElement('p');
        note.className = 'muted';
        note.textContent = 'animiert: läuft kontinuierlich, mehr akku.';
        box.append(note);
    }
}

function buildParamControl(f, p) {
    const label = document.createElement('label');
    label.className = 'field';
    const span = document.createElement('span');

    if (p[2] === 'color') {
        span.textContent = p[1];
        const input = document.createElement('input');
        input.type = 'color';
        input.value = rgbToHex(f[p[0]]);
        input.addEventListener('input', (e) => (f[p[0]] = hexToRgb(e.target.value)));
        label.append(span, input);
        return label;
    }

    const [key, name, min, max, step, dec] = p;
    const out = document.createElement('em');
    const fmt = (v) => (dec ? Number(v).toFixed(dec) : String(v));
    span.textContent = name + ' ';
    span.append(out);
    out.textContent = fmt(f[key]);
    const input = document.createElement('input');
    input.type = 'range';
    input.min = min;
    input.max = max;
    input.step = step;
    input.value = f[key];
    input.addEventListener('input', (e) => {
        f[key] = Number(e.target.value);
        out.textContent = fmt(f[key]);
    });
    label.append(span, input);
    return label;
}

// ---- theme engine: derive every shade from bg / fg / accent ----

const themeSettings = {
    mode: 'system', accent: '#f0ba48', rounded: true, gridSize: 84,
    uiScale: 1, spaceScale: 1
};

function mixHex(a, b, t) {
    const x = hexToRgb(a);
    const y = hexToRgb(b);
    return rgbToHex(x.map((v, i) => Math.round(v + (y[i] - v) * t)));
}

function rgbaOf(hex, alpha) {
    const [r, g, b] = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function readableInk(hex) {
    const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
    // perceived luminance; dark ink on bright accents, light ink on dark ones
    return 0.299 * r + 0.587 * g + 0.114 * b > 0.6 ? '#1a1508' : '#ffffff';
}

function resolvedThemeMode() {
    if (themeSettings.mode === 'dark' || themeSettings.mode === 'light') return themeSettings.mode;
    return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme() {
    const dark = resolvedThemeMode() === 'dark';
    const bg = dark ? '#0d0f16' : '#eef0f5';
    const fg = dark ? '#e9ecf5' : '#14161d';
    const accent = themeSettings.accent;
    const rounded = themeSettings.rounded;
    const r = document.documentElement.style;
    r.setProperty('--text', fg);
    r.setProperty('--muted', mixHex(bg, fg, 0.62));
    // nested surfaces are translucent fg overlays, so depth stacks in both themes
    r.setProperty('--card', rgbaOf(fg, 0.05));
    r.setProperty('--card-2', rgbaOf(fg, 0.09));
    r.setProperty('--line', rgbaOf(fg, 0.15));
    r.setProperty('--accent', accent);
    r.setProperty('--accent-ink', readableInk(accent));
    r.setProperty('--sheet-bg', rgbaOf(bg, 0.82));
    r.setProperty('--radius', rounded ? '14px' : '3px');
    r.setProperty('--radius-lg', rounded ? '18px' : '4px');
    r.setProperty('--tile', (themeSettings.gridSize || 84) + 'px');
    // general size scaler (zoom on the sheet body) + separate spacing multiplier
    r.setProperty('--ui-scale', String(themeSettings.uiScale || 1));
    r.setProperty('--space-scale', String(themeSettings.spaceScale || 1));
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
}

function initTheme() {
    try {
        Object.assign(themeSettings, JSON.parse(localStorage.getItem('wpfx_theme') || '{}'));
    } catch (e) {}
    applyTheme();

    const save = () => {
        try {
            localStorage.setItem('wpfx_theme', JSON.stringify(themeSettings));
        } catch (e) {}
    };
    const mode = $('#themeMode');
    const accent = $('#accentColor');
    const rounded = $('#rounded');
    const grid = $('#gridSize');
    const uiScale = $('#uiScale');
    const spaceScale = $('#spaceScale');
    const pct = (v) => Math.round(v * 100) + '%';
    if (mode) mode.value = themeSettings.mode;
    if (accent) accent.value = themeSettings.accent;
    if (rounded) rounded.checked = themeSettings.rounded;
    if (grid) {
        grid.value = themeSettings.gridSize;
        setOut('gridSize', String(themeSettings.gridSize));
    }
    if (uiScale) {
        uiScale.value = themeSettings.uiScale;
        setOut('uiScale', pct(themeSettings.uiScale));
    }
    if (spaceScale) {
        spaceScale.value = themeSettings.spaceScale;
        setOut('spaceScale', pct(themeSettings.spaceScale));
    }

    if (mode) mode.addEventListener('change', (e) => { themeSettings.mode = e.target.value; applyTheme(); save(); });
    if (accent) accent.addEventListener('input', (e) => { themeSettings.accent = e.target.value; applyTheme(); save(); });
    if (rounded) rounded.addEventListener('change', (e) => { themeSettings.rounded = e.target.checked; applyTheme(); save(); });
    if (grid) grid.addEventListener('input', (e) => {
        themeSettings.gridSize = Number(e.target.value);
        setOut('gridSize', String(themeSettings.gridSize));
        applyTheme();
        save();
    });
    if (uiScale) uiScale.addEventListener('input', (e) => {
        themeSettings.uiScale = Number(e.target.value);
        setOut('uiScale', pct(themeSettings.uiScale));
        applyTheme();
        save();
    });
    if (spaceScale) spaceScale.addEventListener('input', (e) => {
        themeSettings.spaceScale = Number(e.target.value);
        setOut('spaceScale', pct(themeSettings.spaceScale));
        applyTheme();
        save();
    });

    // follow the system theme live while in system mode
    if (window.matchMedia) {
        matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (themeSettings.mode === 'system') applyTheme();
        });
    }
}

// ---- presets: source / config / wallpaper (localStorage) ----

const SOURCE_KEYS = ['mode', 'videos', 'images'];
const CONFIG_KEYS = ['videoOrder', 'videoScale', 'videoOffsetX', 'videoOffsetY', 'videoSpeed', 'resumeVideo',
    'imageOrder', 'imageDurationMs', 'imageTransitionMs', 'imageScale', 'imageOffsetX', 'imageOffsetY',
    'flipX', 'flipY',
    'filters', 'parallaxEnabled', 'parallaxAmount', 'motionType', 'motionAmount', 'motionSpeed'];
const PRESET_KEYS = { source: SOURCE_KEYS, config: CONFIG_KEYS, wallpaper: SOURCE_KEYS.concat(CONFIG_KEYS) };

const clone = (v) => JSON.parse(JSON.stringify(v));

function presetsLoad(kind) {
    try {
        return JSON.parse(localStorage.getItem('wpfx_presets_' + kind) || '[]');
    } catch (e) {
        return [];
    }
}

function presetsStore(kind, arr) {
    try {
        localStorage.setItem('wpfx_presets_' + kind, JSON.stringify(arr));
    } catch (e) {}
}

function collectPreset(kind) {
    const data = {};
    PRESET_KEYS[kind].forEach((k) => (data[k] = clone(state[k])));
    return data;
}

function applyPreset(kind, data) {
    PRESET_KEYS[kind].forEach((k) => {
        if (data[k] === undefined) return;
        const v = clone(data[k]);
        // mutate arrays in place so the drag utilities keep their list reference
        if (Array.isArray(state[k]) && Array.isArray(v)) {
            state[k].splice(0, state[k].length, ...v);
        } else {
            state[k] = v;
        }
    });
    selectedFilter = null;
    renderAll();
    syncPreview();
}

function renderPresets(kind) {
    const group = document.querySelector(`.preset-group[data-kind="${kind}"]`);
    if (!group) return;
    const ul = group.querySelector('.preset-list');
    ul.innerHTML = '';
    const list = presetsLoad(kind);
    if (list.length === 0) {
        const li = document.createElement('li');
        li.className = 'preset-empty';
        li.textContent = 'keine';
        ul.append(li);
        return;
    }
    list.forEach((p, i) => {
        const li = document.createElement('li');
        const load = document.createElement('button');
        load.type = 'button';
        load.className = 'preset-load';
        load.textContent = p.name;
        load.addEventListener('click', () => { applyPreset(kind, p.data); setStatus('geladen: ' + p.name); });
        const del = document.createElement('button');
        del.type = 'button';
        del.className = 'preset-del';
        del.textContent = '✕';
        del.title = 'löschen';
        del.addEventListener('click', () => {
            const arr = presetsLoad(kind);
            arr.splice(i, 1);
            presetsStore(kind, arr);
            renderPresets(kind);
        });
        li.append(load, del);
        ul.append(li);
    });
}

function initPresets() {
    $$('.preset-group').forEach((group) => {
        const kind = group.dataset.kind;
        group.querySelector('.preset-save').addEventListener('click', () => {
            const input = group.querySelector('.preset-name');
            const arr = presetsLoad(kind);
            const name = (input.value || '').trim() || 'preset ' + (arr.length + 1);
            const existing = arr.find((p) => p.name === name);
            const data = collectPreset(kind);
            if (existing) existing.data = data;
            else arr.push({ name, data });
            presetsStore(kind, arr);
            input.value = '';
            renderPresets(kind);
            setStatus('gespeichert: ' + name);
        });
        renderPresets(kind);
    });
}

function hasMedia() {
    return (state.mode === 'video' && state.videos.some((v) => v.enabled)) ||
        (state.mode === 'images' && state.images.some((i) => i.enabled));
}

// refresh the preview source and toggle the "no media" hint over the background
function syncPreview() {
    if (typeof Preview !== 'undefined') Preview.refreshMedia();
    const hint = document.getElementById('previewHint');
    if (hint) hint.hidden = hasMedia();
}

let statusTimer = null;
function setStatus(text) {
    const el = $('#status');
    if (!el) return;
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

// ---- rendering state -> controls ----

function renderMode() {
    $$('.seg-btn').forEach((b) => b.classList.toggle('active', b.dataset.mode === state.mode));
    $$('.panel').forEach((p) => (p.hidden = p.dataset.panel !== state.mode));
}

function renderMotionParams() {
    const on = state.motionType !== 'none';
    $$('[data-motion]').forEach((el) => (el.hidden = !on));
}

function toSrcApp(path) {
    if (window.Capacitor && typeof window.Capacitor.convertFileSrc === 'function') {
        return window.Capacitor.convertFileSrc(path);
    }
    return path;
}

async function pickImages() {
    try {
        const res = await plugin.pickMedia({ type: 'image' });
        if (res.paths && res.paths.length) {
            res.paths.forEach((p) => state.images.push({ path: p, enabled: true }));
            renderSources();
            syncPreview();
        }
    } catch (e) {
        setStatus('auswahl abgebrochen');
    }
}

async function pickVideos() {
    try {
        const res = await plugin.pickMedia({ type: 'video' });
        if (res.paths && res.paths.length) {
            res.paths.forEach((p) => state.videos.push({ path: p, enabled: true }));
            renderSources();
            syncPreview();
        }
    } catch (e) {
        setStatus('auswahl abgebrochen');
    }
}

// video tiles are label-based (filename + play glyph); no cheap thumbnail without
// decoding, and reorder/toggle/remove mirror the image tiles.
function buildVideoTile(vid) {
    const tile = document.createElement('div');
    tile.className = 'tile video-tile' + (vid.enabled ? '' : ' disabled');
    tile.__item = vid;

    const label = document.createElement('span');
    label.className = 'tile-label';
    label.textContent = '▶ ' + basename(vid.path);
    tile.append(label);

    tile.append(tileToggle(vid.enabled, (on) => {
        vid.enabled = on;
        tile.classList.toggle('disabled', !on);
        syncPreview();
    }));
    tile.append(tileX(() => {
        const i = state.videos.indexOf(vid);
        if (i > -1) state.videos.splice(i, 1);
        renderSources();
        syncPreview();
    }));
    return tile;
}

// the active mode's media list; the sources strip shows this set
function activeMediaList() {
    return state.mode === 'video' ? state.videos : state.images;
}

// renders the source strip (bottom bar 2 / fullscreen) for the active mode
function renderSources() {
    const grid = $('#sourceStrip');
    if (!grid) return;
    const isVideo = state.mode === 'video';
    grid.innerHTML = '';
    activeMediaList().forEach((it) => grid.append(isVideo ? buildVideoTile(it) : buildImageTile(it)));
    grid.append(addTile(isVideo ? 'videos hinzufügen' : 'bilder hinzufügen', isVideo ? pickVideos : pickImages));
}

function buildImageTile(img) {
    const tile = document.createElement('div');
    tile.className = 'tile image-tile' + (img.enabled ? '' : ' disabled');
    tile.__item = img;

    const el = document.createElement('img');
    el.src = toSrcApp(img.path);
    el.alt = '';
    el.loading = 'lazy';
    tile.append(el);

    tile.append(tileToggle(img.enabled, (on) => {
        img.enabled = on;
        tile.classList.toggle('disabled', !on);
        syncPreview();
    }));
    tile.append(tileX(() => {
        const i = state.images.indexOf(img);
        if (i > -1) state.images.splice(i, 1);
        renderSources();
        syncPreview();
    }));
    return tile;
}

function setOut(key, value) {
    const el = document.querySelector(`[data-out="${key}"]`);
    if (el) el.textContent = value;
}

function renderAll() {
    renderMode();
    renderFilterGrid();
    renderSources();

    $('#videoOrder').value = state.videoOrder;
    $('#resumeVideo').checked = state.resumeVideo;
    $('#videoScale').value = state.videoScale;
    $('#videoOffsetX').value = state.videoOffsetX;
    $('#videoOffsetY').value = state.videoOffsetY;
    $('#videoSpeed').value = state.videoSpeed;
    setOut('videoOffsetX', state.videoOffsetX.toFixed(2));
    setOut('videoOffsetY', state.videoOffsetY.toFixed(2));
    setOut('videoSpeed', state.videoSpeed.toFixed(2));

    $('#imageOrder').value = state.imageOrder;
    $('#imageDurationMs').value = state.imageDurationMs;
    $('#imageTransitionMs').value = state.imageTransitionMs;
    $('#imageScale').value = state.imageScale;
    $('#imageOffsetX').value = state.imageOffsetX;
    $('#imageOffsetY').value = state.imageOffsetY;
    setOut('imageDurationMs', (state.imageDurationMs / 1000).toFixed(1));
    setOut('imageTransitionMs', (state.imageTransitionMs / 1000).toFixed(1));
    setOut('imageOffsetX', state.imageOffsetX.toFixed(2));
    setOut('imageOffsetY', state.imageOffsetY.toFixed(2));

    $('#flipX').checked = state.flipX;
    $('#flipY').checked = state.flipY;

    $('#parallaxEnabled').checked = state.parallaxEnabled;
    $('#parallaxAmount').value = state.parallaxAmount;
    setOut('parallaxAmount', state.parallaxAmount.toFixed(2));

    $('#motionType').value = state.motionType;
    $('#motionAmount').value = state.motionAmount;
    $('#motionSpeed').value = state.motionSpeed;
    setOut('motionAmount', state.motionAmount.toFixed(2));
    setOut('motionSpeed', state.motionSpeed.toFixed(2));
    renderMotionParams();
}

// ---- wiring controls -> state ----

function bind() {
    $$('.seg-btn').forEach((b) =>
        b.addEventListener('click', () => {
            state.mode = b.dataset.mode;
            renderMode();
            renderSources();
            syncPreview();
        })
    );

    // filter tiles: tap selects for editing; source tiles: tap toggles enabled.
    // both drag-reorder; the source strip commits to whichever mode's list is active.
    enableTileDrag($('#filterGrid'), state.filters,
        (f) => { selectedFilter = f; renderFilterGrid(); },
        () => renderFilterGrid());
    enableTileDrag($('#sourceStrip'), activeMediaList, null,
        () => { renderSources(); syncPreview(); });

    const num = (id, key, out, div) =>
        $(id).addEventListener('input', (e) => {
            state[key] = Number(e.target.value);
            if (out) setOut(out, div ? (state[key] / div).toFixed(1) : state[key].toFixed(2));
        });

    $('#videoOrder').addEventListener('change', (e) => (state.videoOrder = e.target.value));
    $('#resumeVideo').addEventListener('change', (e) => (state.resumeVideo = e.target.checked));
    $('#videoScale').addEventListener('change', (e) => (state.videoScale = e.target.value));
    num('#videoOffsetX', 'videoOffsetX', 'videoOffsetX');
    num('#videoOffsetY', 'videoOffsetY', 'videoOffsetY');
    num('#videoSpeed', 'videoSpeed', 'videoSpeed');

    $('#imageOrder').addEventListener('change', (e) => (state.imageOrder = e.target.value));
    $('#imageScale').addEventListener('change', (e) => (state.imageScale = e.target.value));
    num('#imageDurationMs', 'imageDurationMs', 'imageDurationMs', 1000);
    num('#imageTransitionMs', 'imageTransitionMs', 'imageTransitionMs', 1000);
    num('#imageOffsetX', 'imageOffsetX', 'imageOffsetX');
    num('#imageOffsetY', 'imageOffsetY', 'imageOffsetY');

    // generic range binder for the remaining single controls (parallax, motion)
    const rng = (id, key, digits) =>
        $(id).addEventListener('input', (e) => {
            state[key] = Number(e.target.value);
            setOut(id.slice(1), digits === undefined ? String(state[key]) : state[key].toFixed(digits));
        });

    $('#flipX').addEventListener('change', (e) => { state.flipX = e.target.checked; syncPreview(); });
    $('#flipY').addEventListener('change', (e) => { state.flipY = e.target.checked; syncPreview(); });

    $('#parallaxEnabled').addEventListener('change', (e) => (state.parallaxEnabled = e.target.checked));
    $('#parallaxAmount').addEventListener('input', (e) => {
        state.parallaxAmount = Number(e.target.value);
        setOut('parallaxAmount', state.parallaxAmount.toFixed(2));
    });

    $('#motionType').addEventListener('change', (e) => {
        state.motionType = e.target.value;
        renderMotionParams();
    });
    rng('#motionAmount', 'motionAmount', 2);
    rng('#motionSpeed', 'motionSpeed', 2);

    $('#saveBtn').addEventListener('click', save);
    $('#applyBtn').addEventListener('click', apply);
}

async function save() {
    try {
        await plugin.setConfig({ config: state });
        setStatus('gespeichert');
        return true;
    } catch (e) {
        setStatus('fehler beim speichern');
        return false;
    }
}

async function apply() {
    if (state.mode === 'video' && !state.videos.some((v) => v.enabled)) {
        setStatus('erst ein video wählen');
        return;
    }
    if (state.mode === 'images' && !state.images.some((i) => i.enabled)) {
        setStatus('erst bilder wählen');
        return;
    }
    if (!(await save())) return;
    try {
        await plugin.applyWallpaper();
    } catch (e) {
        setStatus('konnte wallpaper-auswahl nicht öffnen');
    }
}

// ---- init ----

async function init() {
    try {
        const saved = await plugin.getConfig();
        Object.keys(state).forEach((k) => {
            if (saved && saved[k] !== undefined && saved[k] !== null) state[k] = saved[k];
        });
        // migrate the pre-tiles config (imagePaths: array of strings)
        if (saved && Array.isArray(saved.imagePaths) && state.images.length === 0) {
            state.images = saved.imagePaths.map((p) => ({ path: p, enabled: true }));
        }
        // migrate the single-video config (videoPath) into the videos list
        if (saved && saved.videoPath && state.videos.length === 0) {
            state.videos = [{ path: saved.videoPath, enabled: true }];
        }
        // migrate the legacy image order names to the mode enum
        if (state.imageOrder === 'normal') state.imageOrder = 'loop';
        else if (state.imageOrder === 'random') state.imageOrder = 'loop-random';
    } catch (e) {
        // keep defaults
    }
    applyIcons();
    bind();
    renderAll();
    initTheme();
    initDock();
    initOverlays();
    initPresets();

    // live preview mirrors the same shaders on the selected media
    if (typeof Preview !== 'undefined' && Preview.init()) {
        Preview.attach(state);
        syncPreview();
    }
    initPreviewControls();
}

// pause toggle + quality select for the live preview. quality persists; pause
// is transient (starts running each time the ui opens).
function initPreviewControls() {
    if (typeof Preview === 'undefined') return;
    const pause = $('#previewPause');
    const quality = $('#previewQuality');

    let storedQuality = '1.5';
    try {
        storedQuality = localStorage.getItem('wpfx_preview_quality') || '1.5';
    } catch (e) {}
    if (quality) {
        quality.value = storedQuality;
        quality.addEventListener('change', (e) => {
            Preview.setQuality(Number(e.target.value));
            try { localStorage.setItem('wpfx_preview_quality', e.target.value); } catch (err) {}
        });
    }
    Preview.setQuality(Number(storedQuality));

    if (pause) pause.addEventListener('click', () => {
        const now = Preview.togglePaused();
        pause.classList.toggle('paused', now);
        pause.innerHTML = svgIcon(now ? 'play' : 'pause');
        pause.setAttribute('aria-label', now ? 'Vorschau fortsetzen' : 'Vorschau pausieren');
    });
}

// bottom dock: the tab bar opens a panel above it. tapping a tab opens its page,
// tapping the same tab closes it; while open, tabs slide and can be swiped between.
// a top handle resizes the panel height.
const TABS = ['config', 'filters', 'motion', 'parallax'];

function initDock() {
    const panel = $('#tabPanel');
    const track = $('#tabTrack');
    const handle = $('#tabHandle');
    const btns = $$('.tab-btn');
    if (!panel || !track) return;

    let active = null; // active tab index, or null when the panel is closed

    // restore stored panel height
    const maxH = () => Math.round(window.innerHeight * 0.78);
    let storedH = null;
    try {
        storedH = parseInt(localStorage.getItem('wpfx_panel_h'), 10);
    } catch (e) {}
    if (storedH && storedH > 130) panel.style.height = Math.min(storedH, maxH()) + 'px';

    const pageWidth = () => {
        const p = track.querySelector('.tab-page');
        return p ? p.getBoundingClientRect().width : panel.getBoundingClientRect().width;
    };

    // position the track on the active page (px so it is exact at any font scale)
    function applyIndex(animate) {
        if (active === null) return;
        track.style.transition = animate ? 'transform 0.25s ease' : 'none';
        track.style.transform = 'translateX(' + (-active * pageWidth()) + 'px)';
        if (!animate) {
            track.getBoundingClientRect(); // reflow so the next transition animates
            track.style.transition = '';
        }
    }

    function highlight() {
        btns.forEach((b, i) => b.classList.toggle('active', i === active));
    }

    function openTab(i) {
        active = i;
        panel.hidden = false;
        highlight();
        requestAnimationFrame(() => applyIndex(false));
    }

    function closeTab() {
        active = null;
        panel.hidden = true;
        highlight();
    }

    function selectTab(i) {
        active = i;
        highlight();
        applyIndex(true);
    }

    btns.forEach((b, i) => b.addEventListener('click', () => {
        if (active === i) closeTab();
        else if (active === null) openTab(i);
        else selectTab(i);
    }));

    // height handle (drag the top edge)
    let rz = null;
    handle.addEventListener('pointerdown', (e) => {
        rz = { y: e.clientY, h: panel.getBoundingClientRect().height };
        handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener('pointermove', (e) => {
        if (!rz) return;
        const h = Math.max(130, Math.min(maxH(), rz.h + (rz.y - e.clientY)));
        panel.style.height = h + 'px';
    });
    const endResize = () => {
        if (!rz) return;
        rz = null;
        applyIndex(false);
        try {
            localStorage.setItem('wpfx_panel_h', String(Math.round(panel.getBoundingClientRect().height)));
        } catch (e) {}
    };
    handle.addEventListener('pointerup', endResize);
    handle.addEventListener('pointercancel', endResize);

    // horizontal swipe between tabs. only starts on empty page area (not on
    // controls/tiles, which own their gestures); vertical scroll stays native.
    let sw = null;
    track.addEventListener('pointerdown', (e) => {
        if (active === null) return;
        if (e.target.closest('input, select, textarea, button, a, .tile, .tile-editor')) return;
        sw = { x: e.clientX, y: e.clientY, base: -active * pageWidth(), horiz: false, decided: false };
    });
    track.addEventListener('pointermove', (e) => {
        if (!sw) return;
        const dx = e.clientX - sw.x;
        const dy = e.clientY - sw.y;
        if (!sw.decided) {
            if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
            sw.horiz = Math.abs(dx) > Math.abs(dy);
            sw.decided = true;
            if (sw.horiz) track.classList.add('dragging');
        }
        if (!sw.horiz) return;
        const pw = pageWidth();
        const minX = -(TABS.length - 1) * pw;
        let x = sw.base + dx;
        if (x > 0) x *= 0.3; // rubber-band past the ends
        else if (x < minX) x = minX + (x - minX) * 0.3;
        track.style.transition = 'none';
        track.style.transform = 'translateX(' + x + 'px)';
    });
    const endSwipe = (e) => {
        if (!sw) return;
        const horiz = sw.horiz;
        const dx = (e ? e.clientX : sw.x) - sw.x;
        sw = null;
        track.classList.remove('dragging');
        if (!horiz) return;
        const pw = pageWidth();
        let i = active;
        if (dx < -pw * 0.25) i = Math.min(TABS.length - 1, active + 1);
        else if (dx > pw * 0.25) i = Math.max(0, active - 1);
        selectTab(i);
    };
    track.addEventListener('pointerup', endSwipe);
    track.addEventListener('pointercancel', endSwipe);

    window.addEventListener('resize', () => applyIndex(false));
}

// overlay sheets (settings / presets) and the sources fullscreen mode; only one
// open at a time, dimmed by the backdrop. also wires the source-action square.
function initOverlays() {
    const backdrop = $('#backdrop');
    const settings = $('#settingsPanel');
    const presets = $('#presetsPanel');
    const sourcesBar = $('#sourcesBar');
    let openEl = null;

    const fsBtn = () => $('.source-actions [data-act="fullscreen"]');
    function setFsIcon(on) {
        const b = fsBtn();
        if (b) b.innerHTML = svgIcon(on ? 'collapse' : 'expand');
    }

    const pauseBtn = $('#previewPause');
    const showPause = (show) => { if (pauseBtn) pauseBtn.hidden = !show; };

    function closeAll() {
        if (settings) settings.hidden = true;
        if (presets) presets.hidden = true;
        sourcesBar.classList.remove('fullscreen');
        setFsIcon(false);
        backdrop.hidden = true;
        showPause(true);
        openEl = null;
    }

    function openOverlay(el) {
        closeAll();
        el.hidden = false;
        backdrop.hidden = false;
        showPause(false);
        openEl = el;
    }

    function toggleSourcesFs() {
        const turnOn = !sourcesBar.classList.contains('fullscreen');
        closeAll();
        if (turnOn) {
            sourcesBar.classList.add('fullscreen');
            setFsIcon(true);
            backdrop.hidden = false;
            showPause(false);
            openEl = sourcesBar;
        }
    }

    $('#settingsToggle').addEventListener('click', () => (openEl === settings ? closeAll() : openOverlay(settings)));
    $('#presetsToggle').addEventListener('click', () => (openEl === presets ? closeAll() : openOverlay(presets)));
    $('#sourcesToggle').addEventListener('click', toggleSourcesFs);
    backdrop.addEventListener('click', closeAll);
    $$('[data-close]').forEach((b) => b.addEventListener('click', closeAll));

    // the 4-icon source-actions square: add / clear / fullscreen / save
    $$('.source-actions [data-act]').forEach((b) => b.addEventListener('click', () => {
        switch (b.dataset.act) {
            case 'add': state.mode === 'video' ? pickVideos() : pickImages(); break;
            case 'clear': activeMediaList().length = 0; renderSources(); syncPreview(); break;
            case 'fullscreen': toggleSourcesFs(); break;
            case 'save': save(); break;
        }
    }));
}

document.addEventListener('DOMContentLoaded', init);
