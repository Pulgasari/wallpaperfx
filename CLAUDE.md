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

App names/ids are provisional (`com.wallpaperfx.app`, `com.launcher.app`);
they get rebranded to `<brand> wallpapers` / `<brand> launcher` once a brand
is chosen.

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
- After changing an app's `www/`, run `npx cap copy android` in that app dir.

## Build / verify

No Android SDK is assumed locally — the source of truth for "does it build" is
the `android build` GitHub Actions workflow, which matrix-builds every app in
`apps/`. Locally, per app:
`cd apps/<app> && npm install && npx cap sync android && (cd android && ./gradlew assembleDebug)`.
