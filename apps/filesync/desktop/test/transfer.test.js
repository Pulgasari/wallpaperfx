// end-to-end test of the receiver: prepare-upload -> upload -> file on disk.
// also checks filename sanitation (a traversal name must stay inside targetDir)
// and the auto-accept=false approve/decline path. run: node test/transfer.test.js
import { EventEmitter } from 'node:events';
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert';
import { createReceiver } from '../src/server.js';

const API = '/api/localsend/v2';
let passed = 0;
const ok = (name) => { console.log(`  ok - ${name}`); passed++; };

function start(config) {
    const events = new EventEmitter();
    const receiver = createReceiver({
        config,
        deviceInfo: () => ({ alias: 'test-desktop', fingerprint: 'self', port: 0, protocol: 'http', announce: false }),
        events, log: () => {}, tls: null,
    });
    return new Promise(resolve => {
        receiver.server.listen(0, '127.0.0.1', () => {
            resolve({ receiver, events, base: `http://127.0.0.1:${receiver.server.address().port}` });
        });
    });
}

async function prepare(base, files, info = { alias: 'phone', fingerprint: 'p1' }, pin) {
    const q = pin != null ? `?pin=${encodeURIComponent(pin)}` : '';
    const r = await fetch(`${base}${API}/prepare-upload${q}`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ info, files }),
    });
    return { status: r.status, body: r.status === 200 ? await r.json() : null };
}

async function upload(base, sessionId, fileId, token, bytes) {
    const q = new URLSearchParams({ sessionId, fileId, token });
    return fetch(`${base}${API}/upload?${q}`, { method: 'POST', body: bytes });
}

async function main() {
    // --- 1: happy path, auto-accept ---
    {
        const dir = mkdtempSync(join(tmpdir(), 'fsx-'));
        const { base } = await start({ targetDir: dir, autoAccept: true });
        const data = Buffer.from('hello filesync\n');
        const files = { f1: { id: 'f1', fileName: 'note.txt', size: data.length, fileType: 'text/plain' } };
        const prep = await prepare(base, files);
        assert.equal(prep.status, 200, 'prepare-upload 200');
        assert.ok(prep.body.sessionId, 'has sessionId');
        assert.ok(prep.body.files.f1, 'has token for f1');
        ok('prepare-upload returns session + token');

        const up = await upload(base, prep.body.sessionId, 'f1', prep.body.files.f1, data);
        assert.equal(up.status, 200, 'upload 200');
        const saved = join(dir, 'note.txt');
        assert.ok(existsSync(saved), 'file written');
        assert.equal(readFileSync(saved, 'utf8'), 'hello filesync\n', 'content matches');
        ok('upload writes file with correct content');

        // wrong token is rejected
        const bad = await upload(base, prep.body.sessionId, 'f1', 'wrong', data);
        assert.equal(bad.status, 403, 'bad token 403');
        ok('upload rejects invalid token');
    }

    // --- 2: filename traversal stays inside targetDir ---
    {
        const dir = mkdtempSync(join(tmpdir(), 'fsx-'));
        const { base } = await start({ targetDir: dir, autoAccept: true });
        const data = Buffer.from('x');
        const files = { f1: { id: 'f1', fileName: '../../evil.txt', size: 1, fileType: 'text/plain' } };
        const prep = await prepare(base, files);
        await upload(base, prep.body.sessionId, 'f1', prep.body.files.f1, data);
        assert.ok(!existsSync(join(dir, '..', '..', 'evil.txt')), 'no file escaped targetDir');
        assert.ok(existsSync(join(dir, 'evil.txt')), 'landed as sanitized basename');
        ok('filename traversal is sanitized');
    }

    // --- 3: auto-accept=false -> decline yields 403 ---
    {
        const dir = mkdtempSync(join(tmpdir(), 'fsx-'));
        const { base, receiver, events } = await start({ targetDir: dir, autoAccept: false });
        events.on('pending', s => setTimeout(() => receiver.respond(s.id, false), 10));
        const files = { f1: { id: 'f1', fileName: 'x.txt', size: 1, fileType: 'text/plain' } };
        const prep = await prepare(base, files);
        assert.equal(prep.status, 403, 'declined prepare-upload 403');
        ok('auto-accept off + decline returns 403');
    }

    // --- 4: auto-accept=false -> accept proceeds ---
    {
        const dir = mkdtempSync(join(tmpdir(), 'fsx-'));
        const { base, receiver, events } = await start({ targetDir: dir, autoAccept: false });
        events.on('pending', s => setTimeout(() => receiver.respond(s.id, true), 10));
        const data = Buffer.from('yes');
        const files = { f1: { id: 'f1', fileName: 'y.txt', size: 3, fileType: 'text/plain' } };
        const prep = await prepare(base, files);
        assert.equal(prep.status, 200, 'accepted prepare-upload 200');
        const up = await upload(base, prep.body.sessionId, 'f1', prep.body.files.f1, data);
        assert.equal(up.status, 200, 'upload 200');
        assert.equal(readFileSync(join(dir, 'y.txt'), 'utf8'), 'yes', 'content matches');
        ok('auto-accept off + accept completes transfer');
    }

    // --- 5: pin gate ---
    {
        const dir = mkdtempSync(join(tmpdir(), 'fsx-'));
        const { base } = await start({ targetDir: dir, autoAccept: true, pin: '2468' });
        const data = Buffer.from('secret');
        const files = { f1: { id: 'f1', fileName: 'p.txt', size: 6, fileType: 'text/plain' } };

        const noPin = await prepare(base, files);
        assert.equal(noPin.status, 401, 'missing pin 401');
        const wrong = await prepare(base, files, undefined, '0000');
        assert.equal(wrong.status, 401, 'wrong pin 401');
        ok('pin gate rejects missing/wrong pin with 401');

        const good = await prepare(base, files, undefined, '2468');
        assert.equal(good.status, 200, 'correct pin 200');
        const up = await upload(base, good.body.sessionId, 'f1', good.body.files.f1, data);
        assert.equal(up.status, 200, 'upload 200');
        assert.equal(readFileSync(join(dir, 'p.txt'), 'utf8'), 'secret', 'content matches');
        ok('pin gate accepts correct pin and completes transfer');
    }

    console.log(`\n${passed} checks passed`);
    process.exit(0);
}

main().catch(e => { console.error('TEST FAILED:', e); process.exit(1); });
