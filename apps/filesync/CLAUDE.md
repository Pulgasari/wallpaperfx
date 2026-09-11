# CLAUDE.md — filesync

Guidance for working in `apps/filesync`.

## What this is

A **pair** of programs, not one app, joined by a wire protocol:

- `android/` + `www/` — the **phone sender** (Capacitor + a native `FileSync`
  plugin). the web layer is UI only; the native plugin does SAF file picking and
  the actual http(s) upload.
- `desktop/` — the **linux receiver** (node daemon + a localhost web ui). accepts
  files onto disk and shows an address/qr to pair against.

Both speak a subset of **LocalSend v2**. The wire shapes live in `PROTOCOL.md`
and are the cross-component invariant: the android client and the desktop server
must both match it. Change the protocol → touch `FileSyncPlugin.java`,
`desktop/src/server.js`, and `PROTOCOL.md` together.

App id/name are provisional: `com.filesync.app` / "FileSync" (rebrand later).

## Layout note

The Capacitor phone app sits at the `apps/filesync` root (like the other apps:
`package.json`, `capacitor.config.json`, `www/`, `android/`) so the android CI
matrix builds it unchanged. `desktop/` is a **separate** node package with its
own `package.json` and its own CI job; it is not part of the capacitor/android
build.

## Android side

- `bridge/LocalSend.java` — the shared sender client (prepare-upload + streamed
  upload, `SendException` codes: 401 pin, 403 declined). tls: when a fingerprint
  is passed it **pins** the leaf cert (sha256 == fingerprint), else trust-all.
  used by both the plugin and the service; the http logic lives here only.
- `bridge/FileSyncPlugin.java`:
  - `pickFiles()` → SAF multi-select, returns `{uri,name,size,mime}` per file.
  - `send({host,port,protocol,pin,files})` → hands off to `LocalSend`, emitting
    `progress` events. runs off the main thread, bracketed by a `TransferService`
    foreground service (keep-alive). 401 → rejects with `PIN_REQUIRED`.
  - `getIdentity()` → `{alias, fingerprint}` (fingerprint persisted in prefs).
  - `startDiscovery()/stopDiscovery()` → emit `device` events (see `Discovery.java`).
  - `pickFolder()/startAutoSync()/stopAutoSync()/syncNow()/getAutoSyncState()` →
    drive `SyncService` (config in the shared `filesync` prefs).
- `bridge/Discovery.java` — udp multicast (MulticastLock + MulticastSocket on
  224.0.0.167:53317), learns peer ip from the datagram source.
- `bridge/SyncService.java` — foreground service (type `dataSync`): on wi-fi
  (optionally gated to a trusted ssid) scans the chosen tree uri for files newer
  than `lastSync` and uploads them via `LocalSend`. top level only (no recursion, v0).
- `bridge/TransferService.java` — foreground service (type `dataSync`) that runs
  for the duration of a manual `send()`. it does no work itself; it only raises the
  process to foreground priority so android does not kill the app mid-transfer if
  backgrounded. `FileSyncPlugin.send()` starts it before the upload thread and stops
  it in the thread's `finally`.
- `www/` — sender ui (plain js), split into collapsible **sections** (LocalSend,
  Verlauf, WebDAV, Cloud; not tabs). the sent-history lives chrome-side only
  (`state.history` in the `filesync` localStorage key: per-entry + clear-all
  delete, and an enable/disable toggle) — the native `send()` keeps no record.
  WebDAV/Cloud are placeholder sections (planned, not wired).
- https to the desktop's self-signed cert is pinned by fingerprint when known
  (discovery / `filesync://` uri), else trust-all; see `PROTOCOL.md`.
- `res/xml/network_security_config.xml` permits cleartext (http) so lan transfer
  works; TLS trust is handled in code, not by the system config.

## Desktop side

- `src/index.js` cli wires: `server.js` (localsend receiver), `discovery.js`
  (multicast, best-effort), `webui.js` (127.0.0.1 control panel), `device.js`
  (config + self-signed cert under `~/.config/filesync`).
- the web ui binds to localhost only; the localsend server binds to `0.0.0.0`.
- persistent pairing: `config.trustedDevices` (a list of `{fingerprint,alias,at}`)
  is a receiver-local trust list. `server.js decide()` accepts a trusted sender
  without a prompt even when `autoAccept` is off; the web ui adds/removes entries
  via `/ui/respond {trust:true}` and `/ui/untrust`.
- run `npm test` in `desktop/` — it drives prepare-upload/upload against the real
  receiver (happy path, bad token, filename traversal, accept/decline).

## Build / verify

- phone app: `cd apps/filesync && npm install && npx cap sync android && (cd android && ./gradlew assembleDebug)`.
- desktop: `cd apps/filesync/desktop && npm install && npm test && node src/index.js --help`.

## Conventions

- Code comments: english, all lowercase, technical, no emojis.
- Prefer JavaScript; the web/desktop sides are intentionally bundler-free.
- Do not hand-edit generated gradle files (`capacitor.build.gradle`, etc.).
