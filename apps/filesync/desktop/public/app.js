// desktop web ui. polls /ui/state and renders address/qr, settings, pending
// requests, receive history and discovered peers. localhost-only, plain js.
(function () {
    'use strict';
    const $ = id => document.getElementById(id);
    const fmtSize = n => {
        if (n < 1024) return n + ' B';
        if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
        if (n < 1073741824) return (n / 1048576).toFixed(1) + ' MB';
        return (n / 1073741824).toFixed(2) + ' GB';
    };
    const fmtTime = t => new Date(t).toLocaleTimeString();
    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    let editing = false; // pause input overwrites while the user types

    async function api(path, body) {
        const opt = body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : {};
        const r = await fetch(path, opt);
        return r.json();
    }

    function render(s) {
        $('alias').textContent = s.config.alias;
        $('addr').textContent = `${s.address.ip}:${s.address.port}`;
        $('proto').textContent = s.address.protocol;
        $('pairAddr').textContent = `${s.address.ip}:${s.address.port}`;
        $('fingerprint').textContent = 'fingerprint ' + s.fingerprint;
        $('qr').src = s.qr;
        if (!editing) {
            $('targetDir').value = s.config.targetDir;
            $('aliasInput').value = s.config.alias;
            $('autoAccept').checked = s.config.autoAccept;
            $('pin').value = s.config.pin || '';
        }

        // pending requests (only meaningful when auto-accept is off)
        const pc = $('pendingCard'), pl = $('pending');
        pc.hidden = !s.pending.length;
        pl.innerHTML = s.pending.map(p => {
            const files = p.files.map(f => esc(f.name)).join(', ');
            return `<li><div><b>${esc(p.sender)}</b><span class="muted"> ${esc(files)}</span></div>` +
                `<div class="btns"><button data-accept="${p.id}">Annehmen</button>` +
                `<button class="ghost" data-decline="${p.id}">Ablehnen</button></div></li>`;
        }).join('');

        const hl = $('history');
        $('historyEmpty').hidden = s.history.length > 0;
        hl.innerHTML = s.history.map(h =>
            `<li><div><b>${esc(h.name)}</b> <span class="muted">${fmtSize(h.size)}</span></div>` +
            `<span class="muted small">${esc(h.sender)} · ${fmtTime(h.at)}</span></li>`).join('');

        const pe = $('peers');
        $('peersEmpty').hidden = s.peers.length > 0;
        pe.innerHTML = s.peers.map(p =>
            `<li><b>${esc(p.alias || 'unknown')}</b> <span class="muted small">${esc(p.deviceType || '')}</span></li>`).join('');
    }

    async function tick() {
        try { render(await api('/ui/state')); } catch (e) { /* daemon restarting */ }
    }

    function wire() {
        ['targetDir', 'aliasInput', 'pin'].forEach(id => {
            $(id).addEventListener('focus', () => { editing = true; });
            $(id).addEventListener('blur', () => { editing = false; });
        });
        $('saveBtn').addEventListener('click', async () => {
            editing = false;
            await api('/ui/config', {
                targetDir: $('targetDir').value,
                alias: $('aliasInput').value,
                autoAccept: $('autoAccept').checked,
                pin: $('pin').value,
            });
            $('saveMsg').textContent = 'gespeichert';
            setTimeout(() => { $('saveMsg').textContent = ''; }, 1500);
            tick();
        });
        document.body.addEventListener('click', async e => {
            const acc = e.target.getAttribute('data-accept');
            const dec = e.target.getAttribute('data-decline');
            if (acc) { await api('/ui/respond', { sessionId: acc, accept: true }); tick(); }
            if (dec) { await api('/ui/respond', { sessionId: dec, accept: false }); tick(); }
        });
    }

    wire();
    tick();
    setInterval(tick, 1500);
})();
