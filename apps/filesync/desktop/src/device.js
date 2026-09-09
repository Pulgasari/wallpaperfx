// device identity + persisted config. the fingerprint is a stable random id for
// this install (localsend uses it to identify/dedupe a device); the self-signed
// cert is generated once and reused so https peers see a stable identity.
import { homedir, hostname } from 'node:os';
import { join } from 'node:path';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import selfsigned from 'selfsigned';

function configDir() {
    // honor XDG; fall back to ~/.config/filesync
    const base = process.env.XDG_CONFIG_HOME || join(homedir(), '.config');
    return join(base, 'filesync');
}

function defaultTargetDir() {
    return join(homedir(), 'FileSync');
}

export function loadConfig() {
    const dir = configDir();
    mkdirSync(dir, { recursive: true });
    const path = join(dir, 'config.json');
    let cfg = {};
    if (existsSync(path)) {
        try { cfg = JSON.parse(readFileSync(path, 'utf8')); } catch { cfg = {}; }
    }
    // fill defaults without clobbering existing values
    cfg.alias = cfg.alias || `${hostname()} (desktop)`;
    cfg.fingerprint = cfg.fingerprint || randomBytes(20).toString('hex');
    cfg.targetDir = cfg.targetDir || defaultTargetDir();
    cfg.autoAccept = cfg.autoAccept !== undefined ? cfg.autoAccept : true;
    cfg.pin = cfg.pin !== undefined ? String(cfg.pin) : ''; // empty = no pin required
    cfg._dir = dir;
    cfg._path = path;
    saveConfig(cfg);
    return cfg;
}

export function saveConfig(cfg) {
    // never persist the internal underscore-prefixed helpers
    const { _dir, _path, ...rest } = cfg;
    writeFileSync(_path, JSON.stringify(rest, null, 2));
}

// generate (once) and load a self-signed cert for https, cached in the config dir.
export function getOrCreateCert(cfg) {
    const keyPath = join(cfg._dir, 'key.pem');
    const certPath = join(cfg._dir, 'cert.pem');
    if (existsSync(keyPath) && existsSync(certPath)) {
        return { key: readFileSync(keyPath, 'utf8'), cert: readFileSync(certPath, 'utf8') };
    }
    const attrs = [{ name: 'commonName', value: 'filesync' }];
    const pems = selfsigned.generate(attrs, { days: 3650, keySize: 2048, algorithm: 'sha256' });
    writeFileSync(keyPath, pems.private);
    writeFileSync(certPath, pems.cert);
    return { key: pems.private, cert: pems.cert };
}
