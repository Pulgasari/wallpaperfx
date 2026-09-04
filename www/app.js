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
    videoPath: null,
    videoScale: 'cover',
    videoOffsetX: 0,
    videoOffsetY: 0,
    imagePaths: [],
    imageOrder: 'normal',
    imageDurationMs: 8000,
    imageTransitionMs: 800,
    imageScale: 'cover',
    imageOffsetX: 0,
    imageOffsetY: 0,
    filterType: 'none',
    duotoneShadow: [18, 20, 42],
    duotoneHighlight: [240, 186, 72],
    gradientMid: [120, 84, 168],
    scanCount: 320,
    scanStrength: 0.35,
    crtMask: 0.3,
    grayAmount: 1,
    sepiaAmount: 1,
    posterizeLevels: 6,
    pixelSize: 12,
    halftoneScale: 90,
    vignetteStrength: 0.6,
    vignetteRadius: 0.6,
    chromaticAmount: 0.006,
    parallaxEnabled: false,
    parallaxAmount: 0.15
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

function hasMedia() {
    return (state.mode === 'video' && !!state.videoPath) ||
        (state.mode === 'images' && state.imagePaths.length > 0);
}

// refresh the preview source and toggle the "no media" hint
function syncPreview() {
    if (typeof Preview !== 'undefined') Preview.refreshMedia();
    const card = document.querySelector('.preview-card');
    if (card) card.classList.toggle('has-media', hasMedia());
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

function renderFilterParams() {
    // data-filter may list several filters (space separated) that share a group
    $$('.filter-params').forEach((g) => {
        g.hidden = !g.dataset.filter.split(' ').includes(state.filterType);
    });
}

function renderImageList() {
    const ul = $('#imageList');
    ul.innerHTML = '';
    state.imagePaths.forEach((path, i) => {
        const li = document.createElement('li');
        const span = document.createElement('span');
        span.textContent = basename(path);
        const rm = document.createElement('button');
        rm.textContent = '×';
        rm.setAttribute('aria-label', 'entfernen');
        rm.addEventListener('click', () => {
            state.imagePaths.splice(i, 1);
            renderImageList();
            syncPreview();
        });
        li.append(span, rm);
        ul.append(li);
    });
}

function setOut(key, value) {
    const el = document.querySelector(`[data-out="${key}"]`);
    if (el) el.textContent = value;
}

function renderAll() {
    renderMode();
    renderFilterParams();
    renderImageList();

    $('#videoName').textContent = state.videoPath ? basename(state.videoPath) : 'kein video gewählt';
    $('#videoScale').value = state.videoScale;
    $('#videoOffsetX').value = state.videoOffsetX;
    $('#videoOffsetY').value = state.videoOffsetY;
    setOut('videoOffsetX', state.videoOffsetX.toFixed(2));
    setOut('videoOffsetY', state.videoOffsetY.toFixed(2));

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

    $('#filterType').value = state.filterType;
    $('#duotoneShadow').value = rgbToHex(state.duotoneShadow);
    $('#duotoneHighlight').value = rgbToHex(state.duotoneHighlight);
    $('#gradientMid').value = rgbToHex(state.gradientMid);
    $('#scanCount').value = state.scanCount;
    $('#scanStrength').value = state.scanStrength;
    $('#crtMask').value = state.crtMask;
    $('#grayAmount').value = state.grayAmount;
    $('#sepiaAmount').value = state.sepiaAmount;
    $('#posterizeLevels').value = state.posterizeLevels;
    $('#pixelSize').value = state.pixelSize;
    $('#halftoneScale').value = state.halftoneScale;
    $('#vignetteStrength').value = state.vignetteStrength;
    $('#vignetteRadius').value = state.vignetteRadius;
    $('#chromaticAmount').value = state.chromaticAmount;
    setOut('scanCount', String(state.scanCount));
    setOut('scanStrength', state.scanStrength.toFixed(2));
    setOut('crtMask', state.crtMask.toFixed(2));
    setOut('grayAmount', state.grayAmount.toFixed(2));
    setOut('sepiaAmount', state.sepiaAmount.toFixed(2));
    setOut('posterizeLevels', String(state.posterizeLevels));
    setOut('pixelSize', String(state.pixelSize));
    setOut('halftoneScale', String(state.halftoneScale));
    setOut('vignetteStrength', state.vignetteStrength.toFixed(2));
    setOut('vignetteRadius', state.vignetteRadius.toFixed(2));
    setOut('chromaticAmount', state.chromaticAmount.toFixed(3));

    $('#parallaxEnabled').checked = state.parallaxEnabled;
    $('#parallaxAmount').value = state.parallaxAmount;
    setOut('parallaxAmount', state.parallaxAmount.toFixed(2));
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

    $('#pickVideo').addEventListener('click', async () => {
        try {
            const res = await plugin.pickMedia({ type: 'video' });
            if (res.paths && res.paths.length) {
                state.videoPath = res.paths[0];
                $('#videoName').textContent = basename(state.videoPath);
                syncPreview();
            }
        } catch (e) {
            setStatus('auswahl abgebrochen');
        }
    });

    $('#pickImages').addEventListener('click', async () => {
        try {
            const res = await plugin.pickMedia({ type: 'image' });
            if (res.paths && res.paths.length) {
                state.imagePaths.push(...res.paths);
                renderImageList();
                syncPreview();
            }
        } catch (e) {
            setStatus('auswahl abgebrochen');
        }
    });

    const num = (id, key, out, div) =>
        $(id).addEventListener('input', (e) => {
            state[key] = Number(e.target.value);
            if (out) setOut(out, div ? (state[key] / div).toFixed(1) : state[key].toFixed(2));
        });

    $('#videoScale').addEventListener('change', (e) => (state.videoScale = e.target.value));
    num('#videoOffsetX', 'videoOffsetX', 'videoOffsetX');
    num('#videoOffsetY', 'videoOffsetY', 'videoOffsetY');

    $('#imageOrder').addEventListener('change', (e) => (state.imageOrder = e.target.value));
    $('#imageScale').addEventListener('change', (e) => (state.imageScale = e.target.value));
    num('#imageDurationMs', 'imageDurationMs', 'imageDurationMs', 1000);
    num('#imageTransitionMs', 'imageTransitionMs', 'imageTransitionMs', 1000);
    num('#imageOffsetX', 'imageOffsetX', 'imageOffsetX');
    num('#imageOffsetY', 'imageOffsetY', 'imageOffsetY');

    $('#filterType').addEventListener('change', (e) => {
        state.filterType = e.target.value;
        renderFilterParams();
    });
    $('#duotoneShadow').addEventListener('input', (e) => (state.duotoneShadow = hexToRgb(e.target.value)));
    $('#duotoneHighlight').addEventListener('input', (e) => (state.duotoneHighlight = hexToRgb(e.target.value)));
    $('#scanCount').addEventListener('input', (e) => {
        state.scanCount = Number(e.target.value);
        setOut('scanCount', String(state.scanCount));
    });
    $('#scanStrength').addEventListener('input', (e) => {
        state.scanStrength = Number(e.target.value);
        setOut('scanStrength', state.scanStrength.toFixed(2));
    });

    // generic range + color binders; data-out id matches the input id
    const rng = (id, key, digits) =>
        $(id).addEventListener('input', (e) => {
            state[key] = Number(e.target.value);
            setOut(id.slice(1), digits === undefined ? String(state[key]) : state[key].toFixed(digits));
        });
    const colr = (id, key) => $(id).addEventListener('input', (e) => (state[key] = hexToRgb(e.target.value)));

    colr('#gradientMid', 'gradientMid');
    rng('#crtMask', 'crtMask', 2);
    rng('#grayAmount', 'grayAmount', 2);
    rng('#sepiaAmount', 'sepiaAmount', 2);
    rng('#posterizeLevels', 'posterizeLevels');
    rng('#pixelSize', 'pixelSize');
    rng('#halftoneScale', 'halftoneScale');
    rng('#vignetteStrength', 'vignetteStrength', 2);
    rng('#vignetteRadius', 'vignetteRadius', 2);
    rng('#chromaticAmount', 'chromaticAmount', 3);

    $('#parallaxEnabled').addEventListener('change', (e) => (state.parallaxEnabled = e.target.checked));
    $('#parallaxAmount').addEventListener('input', (e) => {
        state.parallaxAmount = Number(e.target.value);
        setOut('parallaxAmount', state.parallaxAmount.toFixed(2));
    });

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
    if (state.mode === 'video' && !state.videoPath) {
        setStatus('erst ein video wählen');
        return;
    }
    if (state.mode === 'images' && state.imagePaths.length === 0) {
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
    } catch (e) {
        // keep defaults
    }
    bind();
    renderAll();

    // live preview mirrors the same shaders on the selected media
    if (typeof Preview !== 'undefined' && Preview.init()) {
        Preview.attach(state);
        syncPreview();
    }
}

document.addEventListener('DOMContentLoaded', init);
