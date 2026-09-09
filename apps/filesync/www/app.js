// filesync sender ui. plain js, talks to the native FileSync capacitor plugin
// (getIdentity/pickFiles/send + "progress" events). manual pairing: the user
// enters the desktop ip:port (or pastes a filesync:// uri) shown by the desktop
// app. in a plain browser (no capacitor) a mock keeps the ui usable.
(function () {
    'use strict';

    function getPlugin() {
        const cap = window.Capacitor;
        if (cap && cap.Plugins && cap.Plugins.FileSync) return cap.Plugins.FileSync;
        // browser fallback: fake identity/pick, simulate a transfer with progress.
        const listeners = {};
        const emit = (ev, data) => (listeners[ev] || []).forEach(fn => fn(data));
        let mockAuto = { enabled: false, tree: '', host: '', port: 53317, protocol: 'https', ssid: '', lastSync: 0 };
        return {
            async getIdentity() { return { alias: 'Browser', fingerprint: 'dev' }; },
            async pickFiles() {
                return { files: [
                    { uri: 'mock://a', name: 'foto.jpg', size: 2_400_000, mime: 'image/jpeg' },
                    { uri: 'mock://b', name: 'notiz.txt', size: 1200, mime: 'text/plain' },
                ] };
            },
            addListener(ev, fn) {
                (listeners[ev] = listeners[ev] || []).push(fn);
                return { remove() { listeners[ev] = (listeners[ev] || []).filter(f => f !== fn); } };
            },
            async startDiscovery() {
                setTimeout(() => {
                    emit('device', { alias: 'Wohnzimmer-PC', ip: '192.168.1.50', port: 53317, protocol: 'https', fingerprint: 'desk-1', deviceType: 'desktop' });
                    emit('device', { alias: 'Laptop', ip: '192.168.1.77', port: 53317, protocol: 'https', fingerprint: 'desk-2', deviceType: 'desktop' });
                }, 300);
            },
            async stopDiscovery() {},
            async pickFolder() { mockAuto.tree = 'tree://mock'; return { uri: mockAuto.tree, name: 'Kamera' }; },
            async startAutoSync(cfg) { mockAuto = Object.assign(mockAuto, cfg, { enabled: true }); },
            async stopAutoSync() { mockAuto.enabled = false; },
            async syncNow() {},
            async getAutoSyncState() { return Object.assign({ lastSync: 0 }, mockAuto); },
            async send({ files }) {
                const total = files.reduce((s, f) => s + Math.max(0, f.size), 0);
                let sent = 0;
                for (let i = 0; i < files.length; i++) {
                    const t = Math.max(0, files[i].size);
                    for (let s = 0; s <= t; s += Math.max(1, Math.floor(t / 4))) {
                        sent = Math.min(total, sent + Math.max(1, Math.floor(t / 4)));
                        emit('progress', { index: i, count: files.length, name: files[i].name, fileSent: Math.min(s, t), fileTotal: t, sent, total });
                        await new Promise(r => setTimeout(r, 120));
                    }
                }
                return { sent: files.length };
            },
        };
    }

    const plugin = getPlugin();
    const PROTOCOLS = ['https', 'http'];
    const STORE_KEY = 'filesync';

    const $ = id => document.getElementById(id);
    let picked = [];
    let sending = false;
    let state = load();

    function load() {
        try {
            const s = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
            return { targets: Array.isArray(s.targets) ? s.targets : [], protocol: PROTOCOLS.includes(s.protocol) ? s.protocol : 'https' };
        } catch { return { targets: [], protocol: 'https' }; }
    }
    function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch {} }

    // ---- helpers ----

    const fmtSize = n => {
        if (n == null || n < 0) return '';
        if (n < 1024) return n + ' B';
        if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
        if (n < 1073741824) return (n / 1048576).toFixed(1) + ' MB';
        return (n / 1073741824).toFixed(2) + ' GB';
    };
    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    let toastTimer = 0;
    function toast(msg) {
        const el = $('status');
        el.textContent = msg; el.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
    }

    // fingerprint of the currently selected target (from a discovered device or a
    // filesync:// uri). enables tls cert pinning. cleared when the host is edited
    // by hand, since a typed ip has no known fingerprint to pin.
    let targetFingerprint = '';

    // parse whatever the user typed: a filesync:// uri, an ip:port, or a bare host.
    function parseTarget() {
        let raw = $('host').value.trim();
        let port = parseInt($('port').value, 10) || 53317;
        let protocol = state.protocol;
        if (!raw) return null;
        if (raw.startsWith('filesync://') || raw.includes('://')) {
            try {
                const u = new URL(raw.replace('filesync://', 'http://'));
                const host = u.hostname;
                if (u.port) port = parseInt(u.port, 10);
                const pp = u.searchParams.get('protocol');
                if (PROTOCOLS.includes(pp)) protocol = pp;
                const fp = u.searchParams.get('fingerprint') || targetFingerprint;
                return { host, port, protocol, fingerprint: fp };
            } catch { return null; }
        }
        if (raw.includes(':') && !raw.includes(']')) {
            const [h, p] = raw.split(':');
            raw = h; if (p) port = parseInt(p, 10) || port;
        }
        return { host: raw, port, protocol, fingerprint: targetFingerprint };
    }

    function rememberTarget(t) {
        state.targets = state.targets.filter(x => !(x.host === t.host && x.port === t.port));
        state.targets.unshift({ host: t.host, port: t.port, protocol: t.protocol });
        state.targets = state.targets.slice(0, 6);
        state.protocol = t.protocol;
        save();
        renderRecents();
    }

    // ---- render ----

    function renderProtoSeg() {
        const box = $('protoSeg');
        box.innerHTML = '';
        for (const p of PROTOCOLS) {
            const b = document.createElement('button');
            b.className = 'seg-btn' + (p === state.protocol ? ' active' : '');
            b.textContent = p;
            b.addEventListener('click', () => { state.protocol = p; save(); renderProtoSeg(); });
            box.appendChild(b);
        }
    }

    function renderRecents() {
        const box = $('recents');
        box.innerHTML = '';
        for (const t of state.targets) {
            const b = document.createElement('button');
            b.className = 'recent-chip';
            b.innerHTML = `<b>${esc(t.host)}</b><span class="muted">:${t.port} · ${t.protocol}</span>`;
            b.addEventListener('click', () => {
                $('host').value = t.host; $('port').value = t.port;
                state.protocol = t.protocol; save(); renderProtoSeg(); updateSendable();
            });
            box.appendChild(b);
        }
    }

    // discovered devices (multicast). keyed by fingerprint, newest info wins.
    const devices = new Map();

    function onDevice(d) {
        if (!d || !d.ip) return;
        devices.set(d.fingerprint || d.ip, d);
        renderDevices();
    }

    function selectDevice(d) {
        $('host').value = d.ip;
        $('port').value = d.port || 53317;
        targetFingerprint = d.fingerprint || ''; // enables cert pinning for this target
        if (PROTOCOLS.includes(d.protocol)) { state.protocol = d.protocol; save(); renderProtoSeg(); }
        updateSendable();
        toast('gewählt: ' + (d.alias || d.ip));
    }

    function renderDevices() {
        const ul = $('deviceList');
        const list = [...devices.values()];
        $('devicesEmpty').hidden = list.length > 0;
        ul.innerHTML = '';
        for (const d of list) {
            const li = document.createElement('li');
            li.className = 'device-row';
            li.innerHTML = `<div class="file-info"><b>${esc(d.alias || 'Gerät')}</b>` +
                `<span class="muted small">${esc(d.ip)}:${d.port || 53317} · ${esc(d.protocol || 'http')}</span></div>` +
                `<span class="pick-hint">wählen ›</span>`;
            li.addEventListener('click', () => selectDevice(d));
            ul.appendChild(li);
        }
    }

    // auto-sync state (mirrors the native SyncService prefs)
    let autoState = { enabled: false, tree: '', host: '', port: 53317, protocol: 'https', ssid: '', lastSync: 0 };
    let folderName = '';

    function renderAutoSync() {
        $('folderBtn').textContent = folderName ? ('Ordner: ' + folderName)
            : (autoState.tree ? 'Ordner gewählt' : 'Ordner wählen');
        if (!document.activeElement || document.activeElement.id !== 'ssid') $('ssid').value = autoState.ssid || '';
        $('autoToggle').textContent = autoState.enabled ? 'Deaktivieren' : 'Aktivieren';
        $('syncNowBtn').hidden = !autoState.enabled;
        let status = 'aus';
        if (autoState.enabled) {
            status = 'aktiv';
            if (autoState.lastSync) status += ' · zuletzt ' + new Date(autoState.lastSync).toLocaleTimeString();
        }
        $('autoStatus').textContent = status;
    }

    async function pickFolder() {
        try {
            const res = await plugin.pickFolder();
            if (res && res.uri) { autoState.tree = res.uri; folderName = res.name || ''; renderAutoSync(); }
        } catch (e) { toast('ordner-auswahl abgebrochen'); }
    }

    async function toggleAutoSync() {
        if (autoState.enabled) {
            await plugin.stopAutoSync();
            autoState.enabled = false;
            renderAutoSync();
            return;
        }
        const target = parseTarget();
        if (!target) { toast('erst ein ziel oben eintragen/wählen'); return; }
        if (!autoState.tree) { toast('erst einen ordner wählen'); return; }
        try {
            await plugin.startAutoSync({
                tree: autoState.tree, host: target.host, port: target.port,
                protocol: target.protocol, pin: $('pin').value.trim(),
                fingerprint: target.fingerprint || '', ssid: $('ssid').value.trim(),
            });
            await refreshAutoState();
            toast('auto-sync aktiv');
        } catch (e) { toast(e && e.message ? e.message : 'auto-sync fehlgeschlagen'); }
    }

    async function refreshAutoState() {
        try { autoState = Object.assign(autoState, await plugin.getAutoSyncState()); } catch {}
        renderAutoSync();
    }

    function renderFiles() {
        const ul = $('fileList');
        ul.innerHTML = '';
        $('filesEmpty').hidden = picked.length > 0;
        picked.forEach((f, i) => {
            const li = document.createElement('li');
            li.innerHTML = `<div class="file-info"><b>${esc(f.name)}</b><span class="muted small">${fmtSize(f.size)}</span></div>`;
            const rm = document.createElement('button');
            rm.className = 'icon-btn'; rm.setAttribute('aria-label', 'Entfernen'); rm.textContent = '×';
            rm.addEventListener('click', () => { picked.splice(i, 1); renderFiles(); updateSendable(); });
            li.appendChild(rm);
            ul.appendChild(li);
        });
    }

    function updateSendable() {
        $('sendBtn').disabled = sending || picked.length === 0 || !$('host').value.trim();
    }

    // ---- actions ----

    async function pick() {
        try {
            const res = await plugin.pickFiles();
            const files = (res && res.files) || [];
            // append, de-dupe by uri
            const seen = new Set(picked.map(f => f.uri));
            for (const f of files) if (!seen.has(f.uri)) picked.push(f);
            renderFiles(); updateSendable();
        } catch (e) { toast('auswahl abgebrochen'); }
    }

    function showProgress(p) {
        $('progress').hidden = false;
        const pct = p.total > 0 ? Math.round((p.sent / p.total) * 100) : 0;
        $('progressFill').style.width = pct + '%';
        $('progressText').textContent = `${p.name} (${p.index + 1}/${p.count}) · ${pct}%`;
    }

    async function send() {
        const target = parseTarget();
        if (!target) { toast('ziel-adresse fehlt'); return; }
        if (!picked.length) return;
        const pin = $('pin').value.trim();
        sending = true; updateSendable();
        $('sendBtn').textContent = 'Sende…';
        $('progressFill').style.width = '0%';
        try {
            await plugin.send({ host: target.host, port: target.port, protocol: target.protocol, pin, fingerprint: target.fingerprint || '', files: picked });
            rememberTarget(target);
            toast(`${picked.length} datei(en) gesendet`);
            picked = []; renderFiles();
            $('progress').hidden = true;
        } catch (e) {
            if (e && (e.code === 'PIN_REQUIRED' || /(^|\b)pin\b/i.test(e.message || ''))) {
                toast('PIN erforderlich oder falsch');
                $('pin').focus();
            } else {
                toast(e && e.message ? e.message : 'senden fehlgeschlagen');
            }
        } finally {
            sending = false; $('sendBtn').textContent = 'Senden'; updateSendable();
        }
    }

    // ---- init ----

    async function rescan() {
        try { await plugin.startDiscovery(); toast('suche im netzwerk…'); }
        catch (e) { toast('discovery nicht verfügbar'); }
    }

    async function init() {
        renderProtoSeg();
        renderRecents();
        renderDevices();
        renderFiles();
        renderAutoSync();
        plugin.addListener('progress', showProgress);
        plugin.addListener('device', onDevice);
        $('pickBtn').addEventListener('click', pick);
        $('sendBtn').addEventListener('click', send);
        $('rescanBtn').addEventListener('click', rescan);
        $('folderBtn').addEventListener('click', pickFolder);
        $('autoToggle').addEventListener('click', toggleAutoSync);
        $('syncNowBtn').addEventListener('click', async () => { try { await plugin.syncNow(); toast('synchronisiere…'); } catch {} });
        $('host').addEventListener('input', () => {
            // a hand-typed host has no known fingerprint to pin (unless it's a
            // filesync:// uri, where parseTarget reads it from the uri itself).
            if (!$('host').value.trim().startsWith('filesync://')) targetFingerprint = '';
            updateSendable();
        });
        try {
            const id = await plugin.getIdentity();
            if (id && id.alias) $('identity').textContent = 'dieses Gerät: ' + id.alias;
        } catch {}
        try { await plugin.startDiscovery(); } catch {}
        await refreshAutoState();
        updateSendable();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
