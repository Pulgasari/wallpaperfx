# Monorepo: Cosmonaut + Subotnik + Subotnik Wallpapers

Mehrere eigenständige Android-Apps in einem Repo, alle mit demselben Stack
(Capacitor / Web-UI + nativer Teil). Jede App liegt in ihrem eigenen Ordner
unter `apps/` und wird unabhängig gebaut.

Die Web-UI ist eine [rat](https://github.com/Pulgasari/rat)-App: ihre Quellen
liegen in `rat/dev/android/<app>/`, `rat build` schreibt das Ergebnis nach
`apps/<app>/www/` (committet) und führt `cap sync android` aus. Hier liegen das
native Projekt (Java, Manifest, Gradle) und die gebaute `www/`.

```
apps/
  cosmonaut/            minimalistischer browser (system-webview), pille-ui,
                        tabs/gruppen/lesezeichen, 2-token-theme
                        dev.cosmonaut.browser  -> apps/cosmonaut/README.md
  subotnik/             home-screen launcher (app-raster, svg-icons, ordner)
                        dev.subotnik.launcher  -> apps/subotnik/README.md
  subotnik-wallpapers/  live-wallpaper (video/bild + gl-filter), native gl-engine
                        dev.subotnik.wallpapers -> apps/subotnik-wallpapers/README.md
.github/workflows/android.yml   baut die android-apps (matrix), lädt je ein debug-apk
```

## Warum getrennte Ordner statt npm-workspace

Capacitor erzeugt in `android/capacitor.settings.gradle` Pfade wie
`../node_modules/@capacitor/android`, relativ zum `android/`-Ordner der App.
Ein Root-Workspace würde `node_modules` hochziehen (hoisting) und diese Pfade
brechen. Deshalb ist jede App self-contained: eigenes `package.json`,
`node_modules`, `capacitor.config.json`, `www/`, `android/`.

## Web-UI

`www/` ist Build-Ausgabe, nicht von Hand bearbeiten. Quellen und CSS
(`app.css`) liegen in `rat/dev/android/<app>/`, gebaut aus dem rat-Checkout
neben diesem Repo:

```bash
cd ../rat
node packages/cli/index.js build dev/android/<app> --target android   # -> ../wallpaperfx/apps/<app>/www + cap sync
```

Im Browser (ohne Capacitor) läuft jede UI mit einem Mock des nativen Plugins:
`apps/<app>/www` über http ausliefern.

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
