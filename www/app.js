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
function enableTileDrag(grid, list, onTap, commit) {
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
                list.splice(0, list.length, ...order);
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
    $('#status').textContent = text;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => ($('#status').textContent = ''), 2500);
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
            renderImageGrid();
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
            renderVideoGrid();
            syncPreview();
        }
    } catch (e) {
        setStatus('auswahl abgebrochen');
    }
}

function renderVideoGrid() {
    const grid = $('#videoGrid');
    if (!grid) return;
    grid.innerHTML = '';
    state.videos.forEach((v) => grid.append(buildVideoTile(v)));
    grid.append(addTile('videos hinzufügen', pickVideos));
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
        renderVideoGrid();
        syncPreview();
    }));
    return tile;
}

function renderImageGrid() {
    const grid = $('#imageGrid');
    if (!grid) return;
    grid.innerHTML = '';
    state.images.forEach((img) => grid.append(buildImageTile(img)));
    grid.append(addTile('bilder hinzufügen', pickImages));
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
        renderImageGrid();
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
    renderImageGrid();
    renderVideoGrid();

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
            syncPreview();
        })
    );

    // filter tiles: tap selects for editing; image/video tiles: tap toggles enabled.
    // all three drag-reorder.
    enableTileDrag($('#filterGrid'), state.filters,
        (f) => { selectedFilter = f; renderFilterGrid(); },
        () => renderFilterGrid());
    enableTileDrag($('#imageGrid'), state.images, null,
        () => { renderImageGrid(); syncPreview(); });
    enableTileDrag($('#videoGrid'), state.videos, null,
        () => { renderVideoGrid(); syncPreview(); });

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

    $('#save').addEventListener('click', save);
    $('#apply').addEventListener('click', apply);
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
    bind();
    renderAll();
    initTheme();
    initSheet();
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
        pause.textContent = now ? '▶' : '⏸';
        pause.setAttribute('aria-label', now ? 'Vorschau fortsetzen' : 'Vorschau pausieren');
    });
}

// bottom-sheet: drag the top edge to resize, collapse button hides it, and
// tapping the preview background (or the pill) brings it back.
function initSheet() {
    const sheet = $('#sheet');
    const handle = $('#sheetHandle');
    const collapseBtn = $('#collapseUi');
    const showBtn = $('#showUi');
    const canvas = $('#preview');
    if (!sheet || !handle) return;

    const MIN = 84;
    const maxH = () => Math.round(window.innerHeight * 0.94);

    let stored = null;
    try {
        stored = parseInt(localStorage.getItem('wpfx_sheet_h'), 10);
    } catch (e) {}
    if (stored && stored > MIN) sheet.style.height = Math.min(stored, maxH()) + 'px';

    let dragging = false;
    let startY = 0;
    let startH = 0;
    handle.addEventListener('pointerdown', (e) => {
        // let the buttons in the header work without starting a resize
        if (e.target.closest('button, input, select')) return;
        dragging = true;
        startY = e.clientY;
        startH = sheet.getBoundingClientRect().height;
        handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        const h = Math.max(MIN, Math.min(maxH(), startH + (startY - e.clientY)));
        sheet.style.height = h + 'px';
    });
    const endDrag = () => {
        if (!dragging) return;
        dragging = false;
        try {
            localStorage.setItem('wpfx_sheet_h', String(Math.round(sheet.getBoundingClientRect().height)));
        } catch (e) {}
    };
    handle.addEventListener('pointerup', endDrag);
    handle.addEventListener('pointercancel', endDrag);

    const collapse = () => {
        sheet.classList.add('collapsed');
        showBtn.hidden = false;
    };
    const expand = () => {
        sheet.classList.remove('collapsed');
        showBtn.hidden = true;
    };
    collapseBtn.addEventListener('click', collapse);
    showBtn.addEventListener('click', expand);
    if (canvas) canvas.addEventListener('click', () => {
        if (sheet.classList.contains('collapsed')) expand();
    });
}

document.addEventListener('DOMContentLoaded', init);
