// discovery reply test. starts the desktop discovery (bound udp 53317) and, from
// a probe socket, sends a unicast announce; expects (a) a 'peer' event for the
// probe and (b) a reply datagram carrying our info with announce:false. this
// exercises the receive+reply path without needing multicast routing (which the
// ci/sandbox network may not provide).
import dgram from 'node:dgram';
import { EventEmitter } from 'node:events';
import assert from 'node:assert';
import { startDiscovery } from '../src/discovery.js';

const PORT = 53317;

function main() {
    const events = new EventEmitter();
    const deviceInfo = () => ({ alias: 'test-desktop', fingerprint: 'desk1', port: PORT, protocol: 'http' });
    const disc = startDiscovery({ deviceInfo, port: PORT, events, log: () => {}, fingerprint: 'desk1' });

    let peerSeen = false;
    events.on('peer', info => { if (info.fingerprint === 'phone1') peerSeen = true; });

    const probe = dgram.createSocket('udp4');
    const timer = setTimeout(() => { console.error('TEST FAILED: no reply within 2s'); process.exit(1); }, 2000);

    probe.on('message', buf => {
        let info;
        try { info = JSON.parse(buf.toString('utf8')); } catch { return; }
        if (info.fingerprint !== 'desk1') return; // ignore our own probe echo if any
        assert.equal(info.announce, false, 'reply carries announce:false');
        assert.equal(info.alias, 'test-desktop', 'reply carries our alias');
        assert.ok(peerSeen, 'peer event emitted for the probe');
        clearTimeout(timer);
        console.log('  ok - discovery emits peer + replies with our info');
        console.log('\n1 checks passed');
        probe.close();
        disc.close();
        process.exit(0);
    });

    // give the discovery socket a moment to bind, then send a unicast announce
    probe.bind(0, '127.0.0.1', () => {
        const announce = Buffer.from(JSON.stringify({ alias: 'Phone', fingerprint: 'phone1', announce: true, port: PORT, protocol: 'http' }));
        setTimeout(() => probe.send(announce, PORT, '127.0.0.1'), 200);
    });
}

main();
