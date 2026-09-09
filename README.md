# Monorepo: Wallpapers + Launcher + FileSync + Browser

Mehrere eigenständige Apps in einem Repo, alle mit demselben Stack (Capacitor /
Web-UI in reinem JS + nativer Teil). Jede App liegt in ihrem eigenen Ordner
unter `apps/` und wird unabhängig gebaut.

```
apps/
  wallpapers/   live-wallpaper (video/bild + gl-filter), native gl-engine
                -> details: apps/wallpapers/README.md
  launcher/     home-screen launcher (app-raster, svg-icons, ordner)
                -> details: apps/launcher/README.md
  filesync/     dateien handy -> desktop im lan (localsend-kompatibel)
                android-sender + node-desktop-empfaenger
                -> details: apps/filesync/README.md
  browser/      minimalistischer browser (system-webview), pille-ui,
                tabs/gruppen/lesezeichen, 2-token-theme
                -> details: apps/browser/README.md
.github/workflows/android.yml   baut die android-apps (matrix), lädt je ein debug-apk
.github/workflows/desktop.yml   testet den filesync-desktop-daemon (node)
```

Die App-Namen/IDs sind vorläufig (`com.wallpaperfx.app`, `com.launcher.app`,
`com.filesync.app`, `com.browser.app`) und werden zu `<Brand> …`, sobald ein
Brand feststeht.

## Warum getrennte Ordner statt npm-workspace

Capacitor erzeugt in `android/capacitor.settings.gradle` Pfade wie
`../node_modules/@capacitor/android`, relativ zum `android/`-Ordner der App.
Ein Root-Workspace würde `node_modules` hochziehen (hoisting) und diese Pfade
brechen. Deshalb ist jede App self-contained: eigenes `package.json`,
`node_modules`, `capacitor.config.json`, `www/`, `android/`.

`apps/filesync` ist eine Ausnahme in der Form (aber nicht in der Regel): die
Capacitor-Sender-App liegt im Ordner-Root wie die anderen, plus ein separates
`desktop/`-Node-Paket (eigenes `package.json`, eigener CI-Job) für den
Linux-Empfänger.

## Build (pro App)

Voraussetzung (Android): Node 20+, JDK 21, Android SDK (Platform 35, Build-Tools 35).

```bash
cd apps/<app>            # wallpapers | launcher | filesync
npm install
npx cap sync android
cd android && ./gradlew assembleDebug
# apk: apps/<app>/android/app/build/outputs/apk/debug/app-debug.apk
```

FileSync-Desktop (Node, kein Android):

```bash
cd apps/filesync/desktop && npm install && npm test && node src/index.js --help
```

Oder ohne lokales Setup: Push auf GitHub, das jeweilige APK-Artefakt aus dem
`android build`-Workflow herunterladen.
