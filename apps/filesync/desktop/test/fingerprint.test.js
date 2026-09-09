// pinning test: the fingerprint the desktop announces must equal the sha256 of
// the tls cert a client actually receives on the wire. this is exactly what the
// android side pins against (sha256 of chain[0].getEncoded()), so a match here
// means the pin will verify instead of falsely rejecting.
import tls from 'node:tls';
import { createHash } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert';
import { getOrCreateCert, certFingerprint } from '../src/device.js';
import { createReceiver } from '../src/server.js';

const dir = mkdtempSync(join(tmpdir(), 'fsx-fp-'));
const cfg = { _dir: dir, targetDir: dir, autoAccept: true, pin: '' };
const cert = getOrCreateCert(cfg);
const expected = certFingerprint(cert.cert);

const receiver = createReceiver({
    config: cfg,
    deviceInfo: () => ({ alias: 'd', fingerprint: expected, port: 0, protocol: 'https' }),
    events: new EventEmitter(), log: () => {}, tls: cert,
});

const fail = e => { console.error('TEST FAILED:', e); process.exit(1); };

receiver.server.listen(0, '127.0.0.1', () => {
    const port = receiver.server.address().port;
    const socket = tls.connect({ host: '127.0.0.1', port, rejectUnauthorized: false, servername: 'filesync' }, () => {
        try {
            const peer = socket.getPeerCertificate(true);
            const got = createHash('sha256').update(peer.raw).digest('hex'); // peer.raw = DER
            assert.equal(got, expected, 'client cert sha256 matches announced fingerprint');
            assert.match(expected, /^[0-9a-f]{64}$/, 'fingerprint is lowercase sha256 hex');
            console.log('  ok - tls cert fingerprint matches the announced/pinned value');
            console.log('\n1 checks passed');
            socket.end();
            receiver.server.close();
            process.exit(0);
        } catch (e) { fail(e); }
    });
    socket.on('error', fail);
});
