#!/usr/bin/env node
// filesync desktop daemon: a localsend v2 receiver for the lan plus a localhost
// web ui. phones send files here; by default they land in ~/FileSync.
import { EventEmitter } from 'node:events';
import { networkInterfaces } from 'node:os';
import QRCode from 'qrcode';
import { PROTOCOL_VERSION, DEFAULT_PORT, DEVICE_TYPE, DEVICE_MODEL } from './protocol.js';
import { loadConfig, getOrCreateCert } from './device.js';
import { createReceiver } from './server.js';
import { startDiscovery } from './discovery.js';
import { startWebUi, pairingUri } from './webui.js';

function parseArgs(argv) {
    const a = { port: DEFAULT_PORT, uiPort: 53318, tls: true, ui: true, discovery: true };
    for (let i = 0; i < argv.length; i++) {
        const v = argv[i];
        if (v === '--dir') a.dir = argv[++i];
        else if (v === '--port') a.port = Number(argv[++i]);
        else if (v === '--ui-port') a.uiPort = Number(argv[++i]);
        else if (v === '--alias') a.alias = argv[++i];
        else if (v === '--http') a.tls = false;
        else if (v === '--no-ui') a.ui = false;
        else if (v === '--no-discovery') a.discovery = false;
        else if (v === '-h' || v === '--help') a.help = true;
    }
    return a;
}

function lanIp() {
    for (const list of Object.values(networkInterfaces())) {
        for (const ni of list || []) {
            if (ni.family === 'IPv4' && !ni.internal) return ni.address;
        }
    }
    return '127.0.0.1';
}

const HELP = `filesync desktop - localsend-compatible receiver

usage: filesync-desktop [options]
  --dir <path>       where received files are saved (default ~/FileSync)
  --port <n>         lan tcp/udp port (default ${DEFAULT_PORT})
  --ui-port <n>      localhost web ui port (default 53318)
  --alias <name>     device name shown to senders
  --http             serve plain http instead of https (debugging on trusted lan)
  --no-ui            do not start the local web ui
  --no-discovery     do not announce/listen via multicast
  -h, --help         this help
`;

async function main() {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) { process.stdout.write(HELP); return; }

    const config = loadConfig();
    if (args.dir) config.targetDir = args.dir;
    if (args.alias) config.alias = args.alias;

    const events = new EventEmitter();
    const log = msg => console.log(`[filesync] ${msg}`);
    const protocol = args.tls ? 'https' : 'http';

    const deviceInfo = () => ({
        alias: config.alias,
        version: PROTOCOL_VERSION,
        deviceModel: DEVICE_MODEL,
        deviceType: DEVICE_TYPE,
        fingerprint: config.fingerprint,
        port: args.port,
        protocol,
        download: false,
    });
    const address = () => ({ ip: lanIp(), port: args.port, protocol });

    const tls = args.tls ? getOrCreateCert(config) : null;
    const receiver = createReceiver({ config, deviceInfo, events, log, tls });

    receiver.server.on('error', err => {
        log(`server error: ${err.message}`);
        if (err.code === 'EADDRINUSE') { log(`port ${args.port} is busy; another receiver running?`); process.exit(1); }
    });
    receiver.server.listen(args.port, '0.0.0.0', () => log(`receiver on ${protocol}://${address().ip}:${args.port}`));

    if (args.discovery) startDiscovery({ deviceInfo, port: args.port, events, log, fingerprint: config.fingerprint });
    if (args.ui) startWebUi({ config, address, deviceInfo, events, receiver, log, uiPort: args.uiPort });

    const ctx = { config, address };
    const uri = pairingUri(ctx);
    log(`saving files to ${config.targetDir}`);
    log(`pair by scanning this qr (or enter ${address().ip}:${args.port} on the phone):`);
    console.log(await QRCode.toString(uri, { type: 'terminal', small: true }));
    if (args.ui) log(`open http://127.0.0.1:${args.uiPort} to manage`);
}

main().catch(e => { console.error(e); process.exit(1); });
