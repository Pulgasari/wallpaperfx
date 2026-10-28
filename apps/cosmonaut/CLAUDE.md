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
  re-renders from it and holds no separate tab list (`$session` in `state.rat.js`).
  bookmarks, groups (keyed by native tab id), userscripts, engines and the look
  are kept in chrome `localStorage` (rat `stored`, keys `Cosmonaut:<name>`; the old
  single key `browser` is taken over once).
- **all webview calls on the ui thread**: `BrowserPlugin` wraps every method body
  in `activity.runOnUiThread(...)`.
- **three palette tokens**: `--color-bg` / `--color-fg` / `--color-ink`, set on
  `body` from the settings; other shades are `color-mix` of them. do not use
  `--bg` / `--fg` / `--ink` as theme variables: aufbau registers them as
  non-inheriting shorthands for an element's own background / color / accent.
- **html and body stay transparent** (the content webview shows through).

## Files

- `MainActivity.java` — reparents the bridge WebView into a root FrameLayout with
  a content container behind; `setChromeExpanded` swaps its height; routes back.
- `bridge/BrowserPlugin.java` — per-tab native WebViews, navigation, `state`
  events. url-vs-search normalization lives here.
- the chrome ui: sources in `rat/dev/android/cosmonaut/`, built into `www/` (never edit `www/`):
  - `app.rat.html` — the bar and the open panel. `state.rat.js` — the session (last
    native `state`), `$panel` (open/close call `setChromeExpanded`), everything kept.
  - `modules/browser.js` — the `Browser` plugin (or `mock.js` outside capacitor),
    `call()` for fire-and-forget plugin calls. `search.js`, `commands.js` (`tl: text`),
    `bookmarks-io.js` (json / netscape html), `press.js` (long press), `glyphs.js`.
  - `components/` — `Bar` (dock, pill, load progress, the strip height to native)
    and one component per panel.

## Build / verify

No local Android SDK; CI (`android build`) is the source of truth (the
chrome/content layering and native webviews can only really be exercised on a
device). The web layer: `cd ../rat && node packages/cli/index.js build
dev/android/cosmonaut --target android` (into `www/`, then `cap sync`). Then
`(cd android && ./gradlew assembleDebug)`.

The chrome ui can be laid out / screenshotted in a plain browser via the mock:
serve `www/` over http.

## Conventions

- Code comments: english, all lowercase, technical, no emojis.
- Prefer JavaScript. the web side is a rat app, its sources are in the rat repo.
- Do not hand-edit generated gradle files (`capacitor.build.gradle`, etc.).
