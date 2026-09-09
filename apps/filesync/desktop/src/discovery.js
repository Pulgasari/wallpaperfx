// udp multicast discovery (localsend v2). we announce ourselves so phones/other
// localsend devices on the lan can find us, and reply to their announcements.
// manual pairing (ip entry / qr) does not need this; it is a convenience and is
// best-effort: multicast can be blocked on some networks, so failures are logged
// and never fatal.
import dgram from 'node:dgram';
import { MULTICAST_GROUP, DEFAULT_PORT } from './protocol.js';

export function startDiscovery(ctx) {
    // ctx: { deviceInfo(), port, events, log, fingerprint }
    const sock = dgram.createSocket({ type: 'udp4', reuseAddr: true });
    let ready = false;

    const announce = () => {
        if (!ready) return;
        const msg = Buffer.from(JSON.stringify({ ...ctx.deviceInfo(), announce: true }));
        sock.send(msg, DEFAULT_PORT, MULTICAST_GROUP, err => {
            if (err) ctx.log(`announce failed: ${err.message}`);
        });
    };

    sock.on('message', (buf, rinfo) => {
        let info;
        try { info = JSON.parse(buf.toString('utf8')); } catch { return; }
        if (!info || !info.fingerprint || info.fingerprint === ctx.fingerprint) return;
        ctx.events.emit('peer', info);
        // reply to an announcement with our info (announce:false) so the peer learns us
        if (info.announce) {
            const reply = Buffer.from(JSON.stringify({ ...ctx.deviceInfo(), announce: false }));
            sock.send(reply, rinfo.port, rinfo.address, () => {});
        }
    });

    sock.on('error', err => ctx.log(`discovery socket error: ${err.message}`));

    sock.bind(DEFAULT_PORT, () => {
        try {
            sock.addMembership(MULTICAST_GROUP);
            sock.setMulticastTTL(1); // stay on the local subnet
            ready = true;
            announce();
            // a few repeats to survive initial packet loss, then a slow heartbeat
            setTimeout(announce, 1000);
            setTimeout(announce, 3000);
            const hb = setInterval(announce, 15_000);
            sock.on('close', () => clearInterval(hb));
        } catch (e) {
            ctx.log(`multicast join failed (manual pairing still works): ${e.message}`);
        }
    });

    return { announce, close: () => sock.close() };
}
