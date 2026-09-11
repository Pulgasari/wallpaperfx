# Launcher

Ein Android-Home-Screen-Launcher. Gleicher Stack wie die Wallpaper-App:
Web-UI (Capacitor, reines JS unter `www/`) plus ein kleiner nativer Teil. Da
eine Launcher-UI eine WebView sein **darf**, ist der komplette Home-Screen die
Web-Schicht; nativ ist nur die Brücke zum `PackageManager`.

Arbeitsname/-ID sind vorläufig (`com.launcher.app`, "Launcher") und werden zu
`<Brand> Launcher`, sobald ein Brand feststeht.

## Features (v0)

- **App-Raster** — alle startbaren Apps als Kacheln, Tippen startet die App.
- **SVG-Icons + Farbe** — monochrome Linien-Icons (lokal, offline), global über
  eine Farbe einstellbar. Ein Keyword-Mapping rät pro App ein passendes Icon,
  Fallback ist ein generisches App-Glyph. (Pro-App-Icon-Auswahl folgt später.)
- **Rastergröße** — Spaltenzahl 3–6 einstellbar.
- **Ordner** — Apps in Ordner einsortieren (langer Druck auf eine App →
  "In Ordner verschieben"), Ordner in den Einstellungen anlegen/umbenennen/
  löschen.

Einstellungen und Ordner-Zuordnung liegen im `localStorage`. Die App-Liste wird
bei jedem Start frisch vom Gerät geholt.

## Bedienung

- **Tippen** auf eine App-Kachel: App starten.
- **Langer Druck** (oder Rechtsklick im Browser) auf eine App: Aktionen (Öffnen,
  in Ordner verschieben, aus Ordner entfernen).
- **Ordner-Kachel** tippen: Ordner öffnen; langer Druck: umbenennen/löschen.
- **Zahnrad unten rechts**: Rastergröße, Icon-Farbe, Ordnerverwaltung.

## Nativer Teil

- `MainActivity` registriert das `Launcher`-Plugin; das Intent-Filter mit
  `category.HOME` + `category.DEFAULT` macht die App als System-Launcher
  auswählbar.
- `bridge/LauncherPlugin.java`:
  - `getApps()` → `{ apps: [{ packageName, label }] }`
  - `launchApp({ packageName })`
- Der `<queries>`-Block im Manifest ist auf Android 11+ nötig, damit andere
  Apps überhaupt sichtbar sind.

## Als Standard-Launcher setzen

APK installieren, dann Home-Taste drücken und diese App als Standard wählen
(oder Einstellungen → Standard-Apps → Start-App).

## Build

```bash
cd apps/launcher
npm install
npx cap sync android
cd android && ./gradlew assembleDebug
# apk: android/app/build/outputs/apk/debug/app-debug.apk
```

## Stand / nächste Schritte

- v0: App-Raster, Start, SVG-Icons + globale Farbe, Rastergröße, Ordner.
- Ideen: Drag & Drop zum Umsortieren/Einordnen, Pro-App-Icon-Auswahl
  (Iconify-Set), transparenter Hintergrund (System-Wallpaper sichtbar),
  App-Suche, versteckte Apps, Icon-Größe/Label-Toggle.
