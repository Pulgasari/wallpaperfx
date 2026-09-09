# FileSync wire protocol

FileSync speaks a subset of the **LocalSend v2** protocol, so the pieces here
interoperate with existing LocalSend apps (our android sender ↔ a LocalSend
desktop, or a LocalSend phone ↔ our desktop receiver). This file is the
**cross-component invariant**: the android client
(`android/.../bridge/FileSyncPlugin.java`) and the desktop receiver
(`desktop/src/server.js`) must both match what is written here. Change the wire
shape → change both, and this doc.

## Roles (v0)

- **phone = sender** (android app). picks files, uploads them.
- **desktop = receiver** (node daemon). accepts and writes files to a target dir.

Auto-sync and the reverse direction are later phases.

## Transport

- one tcp server per device on port **53317** (configurable), `https` (self-signed)
  or `http`. the desktop defaults to https; the android client trusts the
  self-signed cert on the lan (v0 trust-all, pinned-by-fingerprint model later).
- api base path: `/api/localsend/v2`.
- discovery is udp multicast on `224.0.0.167:53317` (announce datagrams). v0 uses
  manual pairing (ip / `filesync://` uri), so discovery is optional.

## Device info dto

Sent in `info` fields and returned by `/info`:

```json
{
  "alias": "Pixel 7",
  "version": "2.1",
  "deviceModel": "Pixel 7",
  "deviceType": "mobile",        // mobile | desktop
  "fingerprint": "<stable per-install id>",
  "port": 53317,
  "protocol": "https",           // https | http
  "download": false
}
```

On multicast datagrams only, an extra `"announce": true|false` is added.

## Upload flow

### 0. pin (optional)

when the receiver has a pin configured, the sender must pass it as a query
param on prepare-upload: `POST .../prepare-upload?pin=<pin>`. a missing/wrong pin
is answered `401`, and the sender prompts the user and retries.

### 1. `POST /api/localsend/v2/prepare-upload`

request:
```json
{
  "info": { ...sender device info... },
  "files": {
    "<fileId>": { "id": "<fileId>", "fileName": "photo.jpg", "size": 12345, "fileType": "image/jpeg" }
  }
}
```

response `200`:
```json
{ "sessionId": "<id>", "files": { "<fileId>": "<token>" } }
```

- `403` (or `204`) → the receiver declined (e.g. auto-accept off + user rejected).
- other non-200 → error.

### 2. `POST /api/localsend/v2/upload?sessionId=<id>&fileId=<fileId>&token=<token>`

body = the raw file bytes (not multipart). response `200` on success; `403`
for an unknown session / wrong token; `409` if that file was already received.

### 3. `POST /api/localsend/v2/cancel?sessionId=<id>` (optional)

aborts the session; the receiver removes any partial files.

## Other endpoints the receiver answers

- `GET  /api/localsend/v2/info` → this device's info dto.
- `POST /api/localsend/v2/register` → body = peer info; records the peer and
  returns our info (http discovery fallback).

## Receiver rules

- filenames are reduced to a safe basename inside the target dir; collisions get
  a ` (n)` suffix. traversal (`../`) can never escape the target dir.
- auto-accept on (default) → `prepare-upload` returns tokens immediately.
  auto-accept off → the request is held until the local web ui accepts/declines
  (60s timeout → decline).

## Known v0 deviations from full LocalSend

- fingerprint is a stable random per-install id, not the tls cert hash.
- no `prepare-download`/`download` (reverse direction), no file previews/thumbnails.
- the pin is passed once per prepare-upload (no separate session-pin handshake).
