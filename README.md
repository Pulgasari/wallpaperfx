# Monorepo: Cosmonaut + Subotnik + Subotnik Wallpapers

Mehrere eigenständige Android-Apps in einem Repo, alle mit demselben Stack
(Capacitor / Web-UI in reinem JS + nativer Teil). Jede App liegt in ihrem
eigenen Ordner unter `apps/` und wird unabhängig gebaut.

```
apps/
  cosmonaut/            minimalistischer browser (system-webview), pille-ui,
                        tabs/gruppen/lesezeichen, 2-token-theme
                        dev.cosmonaut.browser  -> apps/cosmonaut/README.md
  subotnik/             home-screen launcher (app-raster, svg-icons, ordner)
                        dev.subotnik.launcher  -> apps/subotnik/README.md
  subotnik-wallpapers/  live-wallpaper (video/bild + gl-filter), native gl-engine
                        dev.subotnik.wallpapers -> apps/subotnik-wallpapers/README.md
shared/                 import map für die geteilten frontend-pakete (offline)
.github/workflows/android.yml   baut die android-apps (matrix), lädt je ein debug-apk
```

## Warum getrennte Ordner statt npm-workspace

Capacitor erzeugt in `android/capacitor.settings.gradle` Pfade wie
`../node_modules/@capacitor/android`, relativ zum `android/`-Ordner der App.
Ein Root-Workspace würde `node_modules` hochziehen (hoisting) und diese Pfade
brechen. Deshalb ist jede App self-contained: eigenes `package.json`,
`node_modules`, `capacitor.config.json`, `www/`, `android/`.

## CSS

`www/styles.css` ist die Quelle und wird direkt bearbeitet (kein Build-Schritt).

## Build (pro App)

Voraussetzung (Android): Node 20+, JDK 21, Android SDK (Platform 35, Build-Tools 35).

```bash
cd apps/<app>            # cosmonaut | subotnik | subotnik-wallpapers
npm install
npx cap sync android
cd android && ./gradlew assembleDebug
# apk: apps/<app>/android/app/build/outputs/apk/debug/app-debug.apk
```

Oder ohne lokales Setup: Push auf GitHub, das jeweilige APK-Artefakt aus dem
`android build`-Workflow herunterladen.
