# CLAUDE.md

Guidance for working in this repo.

## What this is

A monorepo of two independent Android apps, each its own Capacitor + native
project under `apps/`:

- `apps/wallpapers/` — the live wallpaper (formerly the repo root). Web config
  UI (Capacitor, plain JS) + native OpenGL wallpaper engine. Its own invariants
  live in `apps/wallpapers/CLAUDE.md` — read that before touching it.
- `apps/launcher/` — a home-screen launcher. Web UI (Capacitor, plain JS) +
  a native `Launcher` plugin bridging `PackageManager` (list/launch apps). A
  launcher UI is allowed to be a WebView, so unlike the wallpaper the whole
  home screen is the web layer; the native side is just the app-list/launch
  bridge. Its own notes live in `apps/launcher/CLAUDE.md`.
- `apps/filesync/` — a lan file sender: an android app (Capacitor + native
  `FileSync` plugin) sends files to a node **desktop** receiver
  (`apps/filesync/desktop/`) over a LocalSend-v2 subset. This is a two-endpoint
  pair, not a single app; the wire protocol is the invariant in
  `apps/filesync/PROTOCOL.md`. Its own notes live in `apps/filesync/CLAUDE.md`.
- `apps/browser/` — a minimalist browser on the system WebView. A transparent
  Capacitor **chrome** WebView (pill/url/tabs, `www/`) sits over native
  **content** WebViews (one per tab); collapse/expand resizes the chrome instead
  of touch pass-through. The layering is the invariant in
  `apps/browser/ARCHITECTURE.md`. Its own notes live in `apps/browser/CLAUDE.md`.

App names/ids are provisional (`com.wallpaperfx.app`, `com.launcher.app`,
`com.filesync.app`, `com.browser.app`); they get rebranded to `<brand> …` once a
brand is chosen.

## Layout invariant: apps are self-contained, not a workspace

Each app has its own `package.json`, `package-lock.json`, `node_modules/`,
`capacitor.config.json`, `www/`, and `android/`. There is intentionally **no**
root `package.json`/workspace: Capacitor's generated
`android/capacitor.settings.gradle` references `../node_modules/@capacitor/...`
relative to the app's `android/` dir, so npm hoisting would break the gradle
build. Run `npm ci` / `npx cap sync android` / gradle from inside the app dir.

`apps/filesync` additionally carries a `desktop/` node package (the receiver).
It is its own self-contained package with its own `package.json`/lock and a
separate CI job; it is not a capacitor/android build.

## Conventions

- Code comments: english, all lowercase, technical, no emojis.
- Prefer JavaScript; the web side is intentionally bundler-free.
- Do not hand-edit generated gradle files (`capacitor.build.gradle`, etc.).
- After changing an app's `www/`, run `npx cap copy android` in that app dir.
- `www/styles.css` is generated. edit `apps/<app>/styles.aufbau.css` (aufbau
  style sheets, a css superset); `node tools/build-css.mjs` regenerates it, or
  keep `node tools/build-css.mjs --watch` running to recompile on every save.
  commit both. the source sits at the app root so it never ships in the apk.
  see `tools/README.md`.

## Build / verify

No Android SDK is assumed locally — the source of truth for "does it build" is
the `android build` GitHub Actions workflow, which matrix-builds every android
app in `apps/`. Locally, per app:
`cd apps/<app> && npm install && npx cap sync android && (cd android && ./gradlew assembleDebug)`.
The filesync desktop daemon is built/tested by the separate `desktop` workflow
(node); locally `cd apps/filesync/desktop && npm install && npm test`.
