# CLAUDE.md — launcher

Guidance for working in `apps/launcher`.

## What this is

An Android home-screen launcher. Unlike the wallpaper app, a launcher UI **is
allowed to be a WebView**, so the whole home screen is the Capacitor web layer
(`www/`, plain JS, no bundler). The native side is a single Capacitor plugin
that bridges `PackageManager`; there is no custom rendering engine.

- UI = `www/` (`index.html`, `app.js`, `styles.css`). Renders the app grid,
  folders, settings; persists preferences in `localStorage` under key
  `launcher`.
- Native = `android/app/src/main/java/com/launcher/app/`:
  - `MainActivity` registers the `Launcher` plugin.
  - `bridge/LauncherPlugin.java` — `getApps()` returns `{apps:[{packageName,
    label}]}` (action.MAIN + category.LAUNCHER, minus ourselves, label-sorted);
    `launchApp({packageName})` starts an app via its launch intent.

App id/name are provisional: `com.launcher.app` / "Launcher" (rebrand later).

## Manifest invariants

- `MainActivity` carries the `category.HOME` + `category.DEFAULT` intent filter
  — that is what makes it selectable as the system launcher.
- The top-level `<queries>` block (scoped to the launcher intent) is required
  for `getApps`/`launchApp` to see other apps on Android 11+ (api 30+). Do not
  swap it for `QUERY_ALL_PACKAGES` (play-policy restricted).

## Icons

Icons are local monochrome line svgs defined in `app.js` `ICONS` (viewBox
`0 0 24 24`, drawn from basic shapes, `fill=none` + `currentColor` stroke), not
the real app icons and not fetched from any network (offline launcher). A single
global color (`state.iconColor`, applied via the `--icon-color` css var) tints
them all; per-app icon overrides are a future step. `guessIcon()` maps an app to
a glyph by keyword (`ICON_RULES`, first match wins) with an `app` fallback.

## Config / state

`state` = `{ cols, iconColor, folders:[{id,name,apps:[packageName]}] }` in
`localStorage`. Apps are queried live each launch; only preferences and folder
membership (by package name) are stored, so uninstalled packages just drop out
of the grid. There is no native config file (the wallpaper app's json bridge has
no analog here).

## Build / verify

Same as the repo: no local Android SDK assumed; CI (`android build`) is the
source of truth. Locally:
`cd apps/launcher && npm install && npx cap sync android && (cd android && ./gradlew assembleDebug)`.
After changing `www/`, run `npx cap copy android`.

## Conventions

- Code comments: english, all lowercase, technical, no emojis.
- Prefer JavaScript; the web side is intentionally bundler-free.
- Do not hand-edit generated gradle files (`capacitor.build.gradle`, etc.).
