# WallpaperFX

Ein Live-Wallpaper für Android: Video oder Bild(er) als Hintergrund, mit
GL-Filtern (Duotone, Scanlines). Die Konfigurations-UI ist Web (Capacitor),
die Wallpaper-Engine selbst ist nativ (OpenGL ES 2.0).

## Warum dieser Aufbau

Ein Android-Live-Wallpaper **muss** nativ sein: es läuft als `WallpaperService`
(kein Activity/WebView), bekommt eine `Surface` und rendert selbst. Eine WebView
kann kein Live-Wallpaper sein. Deshalb der Split:

- **UI = Capacitor / Web (JS)** — Auswahl von Medien, Offsets, Dauer, Modi,
  Filter. Kein Bundler, reines HTML/CSS/JS unter `www/`.
- **Engine = nativ (Java + GLSL)** — `WallpaperService` mit eigenem EGL-Kontext
  und Render-Thread. Video via `MediaPlayer` → `SurfaceTexture` → externe
  OES-Textur; Bilder als GL-Texturen mit Cross-Fade; Filter als Fragment-Shader.
- **Brücke** — ein eigenes Capacitor-Plugin (`WallpaperFx`) schreibt die Config
  als JSON, die Engine liest dieselbe Datei.

## Features

1. **Video** — geloopt, `cover` (ausfüllen + beschneiden) oder `fit`
   (einpassen), plus x/y-Offset zum Verschieben des Ausschnitts (nur `cover`),
   einstellbare Abspielgeschwindigkeit (0.25x–3x).
2. **Bilder** — ein oder mehrere, geloopt, Modi `normal` / `random`, einstellbare
   Anzeigedauer und Überblendzeit, gleiche Skalierungs-/Offset-Optionen.
3. **Filter** — verkettbar: eine geordnete liste von filtern, jeder mit eigenen
   parametern, aktivierbar/umsortierbar/entfernbar. gerendert als multi-pass
   fbo-pipeline (quelle -> fbo, dann pro filter ein fullscreen-pass, ping-pong,
   letzter pass auf den screen). 15 effekt-typen (video und bilder gleichermaßen):
   - farbe: `duotone`, `gradientmap` (tritone), `grayscale`, `sepia`,
     `posterize`, `invert`
   - retro/screen-space: `pixelate`, `halftone`, `scanlines`, `crt`,
     `vignette`, `chromatic`
   - animiert (brauchen `uTime`, rendern kontinuierlich solange sichtbar):
     `filmgrain`, `glitch`, `vhs`
   Die UI zeigt nur die Parameter des aktiven Filters. Die Filter-Shader liegen
   doppelt (nativ in `FilterGlsl.java`, preview in `www/preview.js`) und müssen
   logisch identisch bleiben.
4. **Parallax** — optionale Verschiebung beim Homescreen-Wischen
   (`onOffsetsChanged`), mit einstellbarer Stärke (cover-modus).
   **Bewegung (motions)** — zeitbasiert: `zoom`, `breathe`, `drift`, `sway`,
   `shake`; als zoom/pan in den uv-transform gefaltet, cover-modus, rendert
   kontinuierlich solange aktiv. **App-Settings** — theme (system/dunkel/hell),
   akzentfarbe, abgerundet; farben werden aus bg/fg/accent abgeleitet
   (nur ui, in localStorage, nicht teil der wallpaper-config).
5. **Live-Preview** — WebGL-Canvas in der UI, spiegelt dieselben Shader
   (Skalierung, Offset, Filter) live auf dem gewählten Medium.
6. **CI** — GitHub Actions baut bei jedem Push ein Debug-APK
   (`.github/workflows/android.yml`, Artefakt `wallpaperfx-debug-apk`).

## Projektstruktur

```
www/                              web-ui (html/css/js), kein bundler
  index.html app.js styles.css
android/app/src/main/
  java/com/wallpaperfx/app/
    MainActivity.java             registriert das WallpaperFx-plugin
    bridge/WallpaperFxPlugin.java media-picker, config i/o, wallpaper anwenden
    config/WpConfig.java          config-modell + json load/save (shared file)
    wallpaper/
      WallpaperFxService.java     WallpaperService + engine
      GLRenderThread.java         egl-kontext + demand-driven render-loop
      SceneRenderer.java          video/bild-rendering, scaling, filter
      GLUtil.java                 shader compile/link helpers
  AndroidManifest.xml             service + features
  res/xml/wallpaper.xml           live-wallpaper metadaten
capacitor.config.json             appId com.wallpaperfx.app
.github/workflows/android.yml     debug-apk build
```

## Config-Fluss

Die UI speichert die Einstellungen über das Plugin nach
`filesDir/wallpaperfx_config.json`. Gewählte Medien werden nach
`filesDir/media/` kopiert (SAF `ACTION_OPEN_DOCUMENT`, kein Storage-Permission
nötig). Die Engine lädt diese Config neu, sobald das Wallpaper sichtbar wird
(`onVisibilityChanged`).

## Build

Voraussetzung: Node 20+, JDK 21, Android SDK (Platform 35, Build-Tools 35).

```bash
npm install
npx cap sync android
cd android && ./gradlew assembleDebug
# apk: android/app/build/outputs/apk/debug/app-debug.apk
```

Oder ohne lokales Setup: Push auf GitHub, das APK-Artefakt aus dem
`android build`-Workflow herunterladen.

## Installieren & aktivieren

1. `app-debug.apk` aufs Gerät (unbekannte Quellen erlauben).
2. App öffnen, Video oder Bilder wählen, Filter/Offsets einstellen.
3. **Als Wallpaper setzen** → die System-Auswahl öffnet sich → bestätigen.

## appId ändern

Standard ist `com.wallpaperfx.app`. Zum Umbenennen `appId` in
`capacitor.config.json` setzen, dann `npx cap sync android`, und die
`applicationId`/`namespace` in `android/app/build.gradle` sowie die Java-Paket-
pfade anpassen (bzw. das Android-Projekt mit neuer appId neu generieren).

## Stand / nächste Schritte

- v0.1: Video- und Bild-Wallpaper, Cover/Fit + Offset, Duotone/Scanlines, CI.
- v0.2: WebGL-Live-Preview und Parallax beim Homescreen-Wischen.
- v0.3: 12 Filter (color + retro/screen-space), preview zeigt sie live.
- Ideen: opt-in animierte Filter (film grain, glitch), bloom/blur (multi-pass),
  Slideshow-Vorschau mit Cross-Fade, Signierung für Release-APKs.
