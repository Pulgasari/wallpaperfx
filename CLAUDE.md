# CLAUDE.md

Guidance for working in this repo.

## What this is

A monorepo of independent Android apps, each its own Capacitor + native
project under `apps/`:

- `apps/cosmonaut/` — Cosmonaut, a minimalist browser on the system WebView
  (`dev.cosmonaut.browser`). A transparent Capacitor **chrome** WebView
  (pill/url/tabs, `www/`) sits over native **content** WebViews (one per tab);
  collapse/expand resizes the chrome instead of touch pass-through. The layering
  is the invariant in `apps/cosmonaut/ARCHITECTURE.md`. Its own notes live in
  `apps/cosmonaut/CLAUDE.md`.
- `apps/subotnik/` — Subotnik, a home-screen launcher (`dev.subotnik.launcher`).
  Web UI (Capacitor, plain JS) + a native `Launcher` plugin bridging
  `PackageManager` (list/launch apps). A launcher UI is allowed to be a WebView,
  so the whole home screen is the web layer; the native side is just the
  app-list/launch bridge. Its own notes live in `apps/subotnik/CLAUDE.md`.
- `apps/subotnik-wallpapers/` — Subotnik Wallpapers, the live wallpaper
  (`dev.subotnik.wallpapers`). Web config UI (Capacitor, plain JS) + native
  OpenGL wallpaper engine, bridged by the `Wallpaper` plugin. Its own invariants
  live in `apps/subotnik-wallpapers/CLAUDE.md` — read that before touching it.

`shared/importmap.json` is the offline import map for the shared frontend
packages (`@domina/prototype`, `@aufbau/{elements,gui,svg,webfonts,filters,gestures,patterns}`
and their transitive deps); see `shared/README.md`. no app is wired to it yet.

## Layout invariant: apps are self-contained, not a workspace

Each app has its own `package.json`, `package-lock.json`, `node_modules/`,
`capacitor.config.json`, `www/`, and `android/`. There is intentionally **no**
root `package.json`/workspace: Capacitor's generated
`android/capacitor.settings.gradle` references `../node_modules/@capacitor/...`
relative to the app's `android/` dir, so npm hoisting would break the gradle
build. Run `npm ci` / `npx cap sync android` / gradle from inside the app dir.

## Conventions

- Code comments: english, all lowercase, technical, no emojis.
- Prefer JavaScript; the web side is intentionally bundler-free.
- Do not hand-edit generated gradle files (`capacitor.build.gradle`, etc.).
- `www/styles.css` is plain, hand-edited css. there is no css build step.
- After changing an app's `www/`, run `npx cap copy android` in that app dir.

## Build / verify

No Android SDK is assumed locally — the source of truth for "does it build" is
the `android build` GitHub Actions workflow, which matrix-builds every android
app in `apps/`. Locally, per app:
`cd apps/<app> && npm install && npx cap sync android && (cd android && ./gradlew assembleDebug)`.
