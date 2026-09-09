# Monorepo: Wallpapers + Launcher

Zwei eigenständige Android-Apps in einem Repo, beide mit demselben Stack
(Capacitor / Web-UI in reinem JS + nativer Android-Teil). Jede App liegt in
ihrem eigenen Ordner unter `apps/` und wird unabhängig gebaut.

```
apps/
  wallpapers/   live-wallpaper (video/bild + gl-filter), native gl-engine
                -> details: apps/wallpapers/README.md
  launcher/     home-screen launcher (app-raster, svg-icons, ordner)
                -> details: apps/launcher/README.md
.github/workflows/android.yml   baut beide apps (matrix), lädt je ein debug-apk
```

Die App-Namen/IDs sind vorläufig (`com.wallpaperfx.app`, `com.launcher.app`)
und werden zu `<Brand> Wallpapers` / `<Brand> Launcher`, sobald ein Brand
feststeht.

## Warum getrennte Ordner statt npm-workspace

Capacitor erzeugt in `android/capacitor.settings.gradle` Pfade wie
`../node_modules/@capacitor/android`, relativ zum `android/`-Ordner der App.
Ein Root-Workspace würde `node_modules` hochziehen (hoisting) und diese Pfade
brechen. Deshalb ist jede App self-contained: eigenes `package.json`,
`node_modules`, `capacitor.config.json`, `www/`, `android/`.

## Build (pro App)

Voraussetzung: Node 20+, JDK 21, Android SDK (Platform 35, Build-Tools 35).

```bash
cd apps/<app>            # wallpapers oder launcher
npm install
npx cap sync android
cd android && ./gradlew assembleDebug
# apk: apps/<app>/android/app/build/outputs/apk/debug/app-debug.apk
```

Oder ohne lokales Setup: Push auf GitHub, das jeweilige APK-Artefakt aus dem
`android build`-Workflow herunterladen.
