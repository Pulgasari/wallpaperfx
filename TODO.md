# TODO

- [x] die apps haben/zeigen aktuell nur das default capacitor icon. die sollten alle n eigenes icon bekommen. für den anfang würde jeweils einfach n dicker anfangsbuchstabe reichen also: B, FS, L, WP

## Browser

- [x] add button to dock: dev-tools
- [x] add button to dock: userscripts (violentmonkey o.ä.)
- [x] add button to dock: search in page
- [x] add button to dock: settings

### bookmarks
- [ ] folders
- [ ] tags
- [ ] export/import as/from html (zumindest bild ich mir ein dass das typischer mechanismus ist?)
- [ ] export/import as/from json

### context-menu
- [ ] grundsätzlich den mechanismus bauen
- [ ] bei der url-leise testweise einbauen
  - [ ] add to bookmarks
  - [ ] reload / hard reload
  - [ ] close

### dashboard
quasi die startseite oder bei leerer tab.

- [ ] rendert zunächst erstmal die bookmarks als grid

### dock:
- [ ] der dock darf doch nicht aus freischwebenden buttons bestehen, der den webview überlagert, weil das für ux-probleme sorgt. daher sollte er eine geschlossene leisten werden. default unter dem webview positioniert, in den settings aber als oben drüber einstellbar

### gestures
(auf basis von `@aufbau/gestures` ?)

- [ ] reload = webview nach unten ziehen
- [ ] hard reload = webview nach unten ziehen und halten

### settings-options:
  - [x] colors: bg / fg / accent
  - [x] position dock: top : bottom
  - [x] position lade-anzeiger: top | bottom
  - [x] reihenfolge der dock-elemente
  - [x] toggle on/off der einzelnen dock-elemente
  - [x] size der dock-elemente
  - [x] gap zwischenden dock-elementen

## Filesync

Ich habe FileSync soeben getestet und konnte erfolgreich Dateien vom Smartphone an Desktop-PC schicken. Ich musste jedoch immer neu "bestätigen", als das scheint noch kein "dauerhaftes Pairing" (ich weiss den genauen/korrektenBegriff nicht).

### localSend
- [ ] kompatibel mit regulärer localSend-desktop-app
- [ ] settings-option: wie viele files gleichzeitig "hochgeladen" werden

- [x] "dauerhaftes Pairing" ermöglichen (desktop: vertraute geräte -> ohne nachfrage annehmen)
- [x] fix: wenn der dateiname recht lang ist sprengt er das komplette layout -> muss umgebrochen werden (nicht gekürzt!!)
- [x] generell fände ich ne Art History nice, wo ich sehen kann, was gesendet wurde und obs erfolgreich war usw.
  - [x] Einträge einzeln löschbar
  - [x] alles löschbar
  - [x] History selbst aktivierbar/deaktivierbar
- [x] und ich glaube wir müssen auch noch machen, dass die app im hintergrund nich gekillt wird, wenn iwas läuft? (foreground-service während dem senden)
- [x] ich würde mal anfangen dass noch in abschnitte zu unterteilen (später vielleicht tabs aber das brauchs erstmal noch garnich). und die bisherigen panel bilden quasi den abschnitt "LocalSend".
- [ ] neuer abschnitt: WebDAV (platzhalter-abschnitt angelegt; umsetzung offen -> siehe vorschlag im chat)
- [ ] neuer abschnitt: Cloud (platzhalter-abschnitt angelegt; braucht anbieter-auswahl + oauth -> siehe vorschlag im chat) (Haben die bekannten Cloud-Provider evtl. schon fertige APIs parat? Ich denke z.b. an nextcloud, mega, dropbox, google drive usw. ). also mir gehts dabeivorallem drum dass ich zb meinen ebook-folder auf smartphone mit folder bei cloud-provider automatisch syncen kann, im beide richtungen oder 2-wege/dings)

da ich mich hier thematisch nicht so megagut auskenne, kannst du mir auch gerne mal noch features und teiö-aspekte vorschlagen, die sinnvoll/nützlich/üblich sind, ich aber noch gar nich aufm schirm habe. ich bilde mir auch ein im verlauf erwähntest du auch mal irgendwie QR-Codes und fingerprint.


## Launcher

- [x] fix: das is alles zu sensibel. selbst wenn man nur scrollt und irgendwas berührt, wirddas sofort gestartet/getriggert
- [x] fix: wenn das settings-panel angezeigt wird, sollt kein blur-effekt das app-grid überlagern, weil man so ja nix chillig einstellen kann
- [x] raster-größe sollte bis 10 gehen
- [x] add option for grid: gap-size
- [x] add option for grid-cell: padding-size
- [x] add option for grid-cell: shape (circle, square, squircle)
- [x] add option for grid-cell: border-size, border-color
- [x] add option for grid-cell: background color + transparenz
- [x] add toggle: show appname
- [x] add toggle: uppercase appname
- [x] add toggle: cut appname (or multiline)
- [x] feld für custom-css
- [x] gesamthintergrund einstellbar: farbe, transparenz (sodass zb der wallpapers-bg durchscheinen könnte oder whatever) oder kann man nich sogar den bg live abgreifen direkt?

## Wallpapers

---

# tooling

- [x] `@pulgasari/is` published: https://jsr.io/@pulgasari/is
- [x] `@pulgasari/logger` published: https://jsr.io/@pulgasari/logger
- [X] `@pulgasari/str` published: https://jsr.io/@pulgasari/str
