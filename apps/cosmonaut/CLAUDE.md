# CLAUDE.md — cosmonaut (browser)

Guidance for working in `apps/cosmonaut`.

## What this is

A minimalist android browser on the system WebView (Chromium). Read
`ARCHITECTURE.md` first — the two-layer split (transparent capacitor **chrome**
WebView on top, native **content** WebViews per tab behind) and the
collapse/expand **resize trick** (instead of touch pass-through) are the load-
bearing ideas. Break those and nothing works.

App id/name: `dev.cosmonaut.browser` / "Cosmonaut".

## Key invariants

- **chrome stays bottom-anchored**: the chrome WebView is sized to a bottom strip
  when collapsed and fullscreen when expanded. The css bar must be `bottom:0` and
  panels must be `position:fixed` overlays — never depend on document-flow height.
- **native owns tabs, chrome owns organization**: the plugin's `state` event
  (`tabs/activeId/expanded`) is the single source of truth for tabs; the chrome
  re-renders from it and holds no separate tab list. bookmarks + groups live in
  chrome `localStorage` (key `browser`), keyed by native tab id.
- **all webview calls on the ui thread**: `BrowserPlugin` wraps every method body
  in `activity.runOnUiThread(...)`.
- **two color tokens only** (`--bg`, `--fg`); other shades are `color-mix`.

## Files

- `MainActivity.java` — reparents the bridge WebView into a root FrameLayout with
  a content container behind; `setChromeExpanded` swaps its height; routes back.
- `bridge/BrowserPlugin.java` — per-tab native WebViews, navigation, `state`
  events. url-vs-search normalization lives here.
- `www/` — chrome ui (plain js, es modules, no bundler): `index.html`, `styles.css`,
  `js/`:
  - `main.js` — entry: wires the pill, native `state` events, boot.
  - `native.js` — the `Browser` plugin (or `mock.js` outside capacitor), the
    session state it pushes, `call()` for fire-and-forget plugin calls.
  - `store.js` — everything the chrome owns, persisted in `localStorage` (`browser`).
  - `panels.js` — the panel registry: `definePanel(name, el, { render, update, close })`,
    `openPanel` / `closePanel` expand and collapse the chrome webview.
  - `bar.js` — dock, pill, load progress, theme. `search.js` — url vs search, engines.
  - `panels/*.js` — one module per panel, each registers itself on import.
  - `dom.js` — `h()` element builder and small helpers. `icons.js` — svg icons.
  - `bookmarks-io.js` — json / netscape html formats, file save and pick.

## Build / verify

No local Android SDK; CI (`android build`) is the source of truth (the
chrome/content layering and native webviews can only really be exercised on a
device). Locally: `cd apps/cosmonaut && npm install && npx cap sync android &&
(cd android && ./gradlew assembleDebug)`. After changing `www/`, run
`npx cap copy android`. The chrome ui can be laid out / screenshotted in a plain
browser via the mock in `js/mock.js` (serve `www/` over http, es modules do
not load from `file://`).

## Conventions

- Code comments: english, all lowercase, technical, no emojis.
- Prefer JavaScript; the web side is intentionally bundler-free.
- Do not hand-edit generated gradle files (`capacitor.build.gradle`, etc.).
