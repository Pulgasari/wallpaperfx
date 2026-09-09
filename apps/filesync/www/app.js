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
        let cb = null;
        return {
            async getIdentity() { return { alias: 'Browser', fingerprint: 'dev' }; },
            async pickFiles() {
                return { files: [
                    { uri: 'mock://a', name: 'foto.jpg', size: 2_400_000, mime: 'image/jpeg' },
                    { uri: 'mock://b', name: 'notiz.txt', size: 1200, mime: 'text/plain' },
                ] };
            },
            addListener(_ev, fn) { cb = fn; return { remove() { cb = null; } }; },
            async send({ files }) {
                const total = files.reduce((s, f) => s + Math.max(0, f.size), 0);
                let sent = 0;
                for (let i = 0; i < files.length; i++) {
                    const t = Math.max(0, files[i].size);
                    for (let s = 0; s <= t; s += Math.max(1, Math.floor(t / 4))) {
                        sent = Math.min(total, sent + Math.max(1, Math.floor(t / 4)));
                        cb && cb({ index: i, count: files.length, name: files[i].name, fileSent: Math.min(s, t), fileTotal: t, sent, total });
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
                return { host, port, protocol };
            } catch { return null; }
        }
        if (raw.includes(':') && !raw.includes(']')) {
            const [h, p] = raw.split(':');
            raw = h; if (p) port = parseInt(p, 10) || port;
        }
        return { host: raw, port, protocol };
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
        sending = true; updateSendable();
        $('sendBtn').textContent = 'Sende…';
        $('progressFill').style.width = '0%';
        try {
            await plugin.send({ host: target.host, port: target.port, protocol: target.protocol, files: picked });
            rememberTarget(target);
            toast(`${picked.length} datei(en) gesendet`);
            picked = []; renderFiles();
            $('progress').hidden = true;
        } catch (e) {
            toast(e && e.message ? e.message : 'senden fehlgeschlagen');
        } finally {
            sending = false; $('sendBtn').textContent = 'Senden'; updateSendable();
        }
    }

    // ---- init ----

    async function init() {
        renderProtoSeg();
        renderRecents();
        renderFiles();
        plugin.addListener('progress', showProgress);
        $('pickBtn').addEventListener('click', pick);
        $('sendBtn').addEventListener('click', send);
        $('host').addEventListener('input', updateSendable);
        try {
            const id = await plugin.getIdentity();
            if (id && id.alias) $('identity').textContent = 'dieses Gerät: ' + id.alias;
        } catch {}
        updateSendable();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
