# FileSync

Dateien vom Handy an den Desktop im Heimnetz schicken — LocalSend-kompatibel.
Zwei Teile, gleicher JS-Stack wie der Rest:

- **Handy (Sender)** — Android-App (Capacitor + natives `FileSync`-Plugin). Datei(en)
  wählen, Ziel eingeben (oder QR/`filesync://`-Adresse der Desktop-App), senden.
- **Desktop (Empfänger)** — Node-Daemon für Linux mit kleiner localhost-Web-UI.
  Nimmt Dateien an und legt sie in einen Zielordner (Standard `~/FileSync`).

Arbeitsname/-ID vorläufig (`com.filesync.app`, "FileSync"), wird später zu
`<Brand> …`.

## Features

- **Pairing**: Adresse (`ip:port`) am Handy eingeben oder ein im WLAN entdecktes
  Gerät antippen; die Desktop-App zeigt Adresse **und** QR. Zuletzt genutzte
  Ziele werden gemerkt.
- **Senden** mit Fortschrittsanzeige, mehrere Dateien.
- **Auto-Discovery**: Geräte finden sich per UDP-Multicast (224.0.0.167) selbst
  im WLAN; die Liste zeigt sie zum Antippen.
- **PIN**: der Empfänger kann eine PIN verlangen; ohne/mit falscher PIN → der
  Sender fragt nach.
- **Auto-Sync**: ein gewählter Ordner wird im WLAN (optional nur bei einer
  bestimmten SSID) automatisch an das Ziel gesendet — als Android-
  Foreground-Service, sobald neue Dateien auftauchen.
- **Empfänger**: Zielordner + Gerätename + PIN + automatisch annehmen (an/aus),
  Empfangsverlauf, entdeckte Geräte.
- **Protokoll**: LocalSend v2 (Details in `PROTOCOL.md`), interoperabel mit
  bestehenden LocalSend-Apps.

Später: Gegenrichtung Desktop→Handy, rekursiver Ordner-Scan (Auto-Sync scannt v0
nur die oberste Ebene), QR-Scan am Handy.

## Desktop starten

```bash
cd apps/filesync/desktop
npm install
node src/index.js                 # https, speichert nach ~/FileSync
# optionen:
node src/index.js --dir ~/Inbox --alias "Wohnzimmer-PC"
node src/index.js --http          # klartext-http (debugging im vertrauten lan)
node src/index.js --help
```

Der Daemon druckt Adresse + QR und öffnet die Web-UI auf
`http://127.0.0.1:53318`. Als systemd-user-service oder Autostart einrichtbar.

Test: `npm test` (fährt echte prepare-upload/upload-Transfers gegen den Empfänger).

## Handy-App bauen

```bash
cd apps/filesync
npm install
npx cap sync android
cd android && ./gradlew assembleDebug
# apk: android/app/build/outputs/apk/debug/app-debug.apk
```

## Bedienung

1. Desktop-Daemon starten, Adresse/QR ablesen.
2. In der Handy-App die Adresse eintragen (oder `filesync://…` einfügen),
   Protokoll (https/http) passend wählen.
3. Dateien wählen → **Senden**. Sie landen im Zielordner des Desktops.

## Sicherheit (v0)

Für das vertraute Heimnetz gedacht. Der Desktop nutzt ein selbst-signiertes
Zertifikat. Wenn das Ziel über Discovery oder eine `filesync://`-Adresse gewählt
wurde, **pinnt** der Client das Zertifikat gegen den Fingerprint (sha256) —
MITM-Schutz. Nur bei manuell getippter IP ohne bekannten Fingerprint fällt er
auf trust-all zurück. Eine optionale **PIN** am Empfänger schützt zusätzlich vor
ungewolltem Senden; ohne PIN kann bei „automatisch annehmen" jeder im selben
Netz, der die Adresse kennt, senden.
