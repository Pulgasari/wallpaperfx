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
  upload, trust-all tls, `SendException` codes: 401 pin, 403 declined). used by
  both the plugin and the service; the http logic lives here only.
- `bridge/FileSyncPlugin.java`:
  - `pickFiles()` → SAF multi-select, returns `{uri,name,size,mime}` per file.
  - `send({host,port,protocol,pin,files})` → hands off to `LocalSend`, emitting
    `progress` events. runs off the main thread. 401 → rejects with `PIN_REQUIRED`.
  - `getIdentity()` → `{alias, fingerprint}` (fingerprint persisted in prefs).
  - `startDiscovery()/stopDiscovery()` → emit `device` events (see `Discovery.java`).
  - `pickFolder()/startAutoSync()/stopAutoSync()/syncNow()/getAutoSyncState()` →
    drive `SyncService` (config in the shared `filesync` prefs).
- `bridge/Discovery.java` — udp multicast (MulticastLock + MulticastSocket on
  224.0.0.167:53317), learns peer ip from the datagram source.
- `bridge/SyncService.java` — foreground service (type `dataSync`): on wi-fi
  (optionally gated to a trusted ssid) scans the chosen tree uri for files newer
  than `lastSync` and uploads them via `LocalSend`. top level only (no recursion, v0).
- https to the desktop's self-signed cert is trusted-all on the lan (v0); see the
  security note in `PROTOCOL.md`.
- `res/xml/network_security_config.xml` permits cleartext (http) so lan transfer
  works; TLS trust is handled in code, not by the system config.

## Desktop side

- `src/index.js` cli wires: `server.js` (localsend receiver), `discovery.js`
  (multicast, best-effort), `webui.js` (127.0.0.1 control panel), `device.js`
  (config + self-signed cert under `~/.config/filesync`).
- the web ui binds to localhost only; the localsend server binds to `0.0.0.0`.
- run `npm test` in `desktop/` — it drives prepare-upload/upload against the real
  receiver (happy path, bad token, filename traversal, accept/decline).

## Build / verify

- phone app: `cd apps/filesync && npm install && npx cap sync android && (cd android && ./gradlew assembleDebug)`.
- desktop: `cd apps/filesync/desktop && npm install && npm test && node src/index.js --help`.

## Conventions

- Code comments: english, all lowercase, technical, no emojis.
- Prefer JavaScript; the web/desktop sides are intentionally bundler-free.
- Do not hand-edit generated gradle files (`capacitor.build.gradle`, etc.).
