// tiny control panel, bound to 127.0.0.1 only (never exposed to the lan). shows
// this device's pairing address + qr, lets you set the target dir / alias /
// auto-accept, and lists received files, pending requests and discovered peers.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, normalize } from 'node:path';
import QRCode from 'qrcode';
import { saveConfig } from './device.js';

const publicDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const HISTORY_MAX = 100;

const json = (res, code, obj) => {
    res.writeHead(code, { 'content-type': 'application/json' });
    res.end(JSON.stringify(obj));
};

function readBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', c => chunks.push(c));
        req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch (e) { reject(e); } });
        req.on('error', reject);
    });
}

// the string a phone scans to pair without typing an ip.
export function pairingUri(ctx) {
    const { ip, port, protocol } = ctx.address();
    const q = new URLSearchParams({ fingerprint: ctx.config.fingerprint, protocol, alias: ctx.config.alias });
    return `filesync://${ip}:${port}?${q.toString()}`;
}

export function startWebUi(ctx) {
    // ctx: { config, address(), deviceInfo(), events, receiver, log, uiPort }
    const history = [];
    const pending = [];

    ctx.events.on('received', e => {
        history.unshift({ ...e.file, sender: e.session.sender, at: Date.now() });
        if (history.length > HISTORY_MAX) history.pop();
    });
    ctx.events.on('pending', s => { pending.push(s); });
    ctx.events.on('session', s => {
        const i = pending.findIndex(p => p.id === s.id);
        if (i >= 0) pending.splice(i, 1);
    });

    async function state() {
        return {
            device: ctx.deviceInfo(),
            address: ctx.address(),
            fingerprint: ctx.config.fingerprint,
            config: { alias: ctx.config.alias, targetDir: ctx.config.targetDir, autoAccept: ctx.config.autoAccept },
            pairingUri: pairingUri(ctx),
            qr: await QRCode.toDataURL(pairingUri(ctx), { margin: 1, width: 240 }),
            peers: [...ctx.receiver.peers.values()],
            pending,
            history,
        };
    }

    async function serveStatic(res, pathname) {
        const rel = pathname === '/' ? '/index.html' : pathname;
        const file = normalize(join(publicDir, rel));
        if (!file.startsWith(publicDir)) { res.writeHead(403); return res.end(); }
        try {
            const buf = await readFile(file);
            const ext = rel.slice(rel.lastIndexOf('.'));
            res.writeHead(200, { 'content-type': MIME[ext] || 'application/octet-stream' });
            res.end(buf);
        } catch { res.writeHead(404); res.end('not found'); }
    }

    const server = http.createServer(async (req, res) => {
        const url = new URL(req.url, 'http://localhost');
        try {
            if (req.method === 'GET' && url.pathname === '/ui/state') return json(res, 200, await state());
            if (req.method === 'POST' && url.pathname === '/ui/config') {
                const body = await readBody(req);
                if (typeof body.alias === 'string' && body.alias.trim()) ctx.config.alias = body.alias.trim();
                if (typeof body.targetDir === 'string' && body.targetDir.trim()) ctx.config.targetDir = body.targetDir.trim();
                if (typeof body.autoAccept === 'boolean') ctx.config.autoAccept = body.autoAccept;
                saveConfig(ctx.config);
                return json(res, 200, await state());
            }
            if (req.method === 'POST' && url.pathname === '/ui/respond') {
                const body = await readBody(req);
                const ok = ctx.receiver.respond(body.sessionId, body.accept);
                const i = pending.findIndex(p => p.id === body.sessionId);
                if (i >= 0) pending.splice(i, 1);
                return json(res, 200, { ok });
            }
            return serveStatic(res, url.pathname);
        } catch (e) {
            ctx.log(`webui error: ${e.message}`);
            json(res, 500, { message: 'error' });
        }
    });

    server.listen(ctx.uiPort, '127.0.0.1', () => ctx.log(`web ui on http://127.0.0.1:${ctx.uiPort}`));
    return server;
}
