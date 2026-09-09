# Browser

Ein minimalistischer Android-Browser auf Basis der System-WebView (Chromium).
Gleicher Stack wie der Rest: die Bedien-Oberfläche ist Web (Capacitor, reines JS
unter `www/`), die eigentlichen Webseiten laufen in nativen Content-WebViews
dahinter. Details zur Architektur: `ARCHITECTURE.md`.

Arbeitsname/-ID vorläufig (`com.browser.app`, "Browser").

## Idee

Keine dauerhaft offene URL-Leiste, keine aufdringlichen Features. Die Steuerung
ist ein **Punkt/Pille unten in der Mitte**:

- **Tippen** auf die Pille → URL-Leiste / Websuche klappt von unten auf (Daumen-
  reichweite), mit Vorschlägen aus Lesezeichen und offenen Tabs.
- **Links/rechts** neben der Pille sitzen zwei **Trigger** (v0: Tabs-Übersicht
  und Lesezeichen) — später frei belegbar für eigene Trigger.
- Design **monochrom aus genau zwei Farb-Tokens** (`--bg`, `--fg`) — alles andere
  wird daraus abgeleitet, Retheming = zwei Werte ändern.

## v0 Features

- Ein Browser-Kern mit mehreren **Tabs** (native Content-WebViews).
- **Tabs-Übersicht** mit **Gruppen** (Gruppe anlegen, Tabs zuordnen).
- **Lesezeichen** (aktuelle Seite merken, öffnen, löschen).
- URL/Suche mit Vorschlägen; Zurück per Hardware-Button.

## Bedienung

- Pille tippen → URL/Suche. Enter öffnet Adresse oder sucht (DuckDuckGo).
- Linker Trigger → Tabs (wechseln, schließen, neuer Tab, Gruppen).
- Rechter Trigger → Lesezeichen.
- Zurück-Button: schließt ein offenes Panel, sonst zurück im Tab.

## Build

```bash
cd apps/browser
npm install
npx cap sync android
cd android && ./gradlew assembleDebug
# apk: android/app/build/outputs/apk/debug/app-debug.apk
```

## Später

Userscripts (Violentmonkey-Stil, Injection), automatische Tab-Gruppierung nach
Domain, einstellbare Pillen-Gesten (Langdruck / Halten-und-Hochziehen) und
eigene Trigger, Downloads, `window.open`/Neue-Fenster, externe Schemata
(mailto/intent), pro-Tab Vor/Zurück-UI.
