# TODO

- [x] die apps haben/zeigen aktuell nur das default capacitor icon. die sollten alle n eigenes icon bekommen. für den anfang würde jeweils einfach n dicker anfangsbuchstabe reichen also: B, FS, L, WP

## Browser

- [x] add button to dock: dev-tools
- [x] add button to dock: userscripts (violentmonkey o.ä.)
- [x] add button to dock: search in page
- [x] add button to dock: settings

settings-options:
  - [x] colors: bg / fg / accent
  - [x] position dock: top : bottom
  - [x] position lade-anzeiger: top | bottom
  - [x] reihenfolge der dock-elemente
  - [x] toggle on/off der einzelnen dock-elemente
  - [x] size der dock-elemente
  - [x] gap zwischenden dock-elementen

## Filesync

Ich habe FileSync soeben getestet und konnte erfolgreich Dateien vom Smartphone an Desktop-PC schicken. Ich musste jedoch immer neu "bestätigen", als das scheint noch kein "dauerhaftes Pairing" (ich weiss den genauen/korrektenBegriff nicht).

- [ ] "dauerhaftes Pairing" ermöglichen
- [ ] fix: wenn der dateiname recht lang ist sprengt er das komplette layout -> muss umgebrochen werden (nicht gekürzt!!)
- [ ] generell fände ich ne Art History nice, wo ich sehen kann, was gesendet wurde und obs erfolgreich war usw.
  - [ ] Einträge einzeln löschbar
  - [ ] alles löschbar
  - [ ] History selbst aktivierbar/deaktivierbar
- [ ] und ich glaube wir müssen auch noch machen, dass die app im hintergrund nich gekillt wird, wenn iwas läuft?
- [ ] ich würde mal anfangen dass noch in abschnitte zu unterteilen (später vielleicht tabs aber das brauchs erstmal noch garnich). und die bisherigen panel bilden quasi den abschnitt "LocalSend".
- [ ] neuer abschnitt: WebDAV
- [ ] neuer abschnitt: Cloud (Haben die bekannten Cloud-Provider evtl. schon fertige APIs parat? Ich denke z.b. an nextcloud, mega, dropbox, google drive usw. ). also mir gehts dabeivorallem drum dass ich zb meinen ebook-folder auf smartphone mit folder bei cloud-provider automatisch syncen kann, im beide richtungen oder 2-wege/dings)

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

# Sonstiges

Nur ein paar konzeptuelle Fragen: also nicht bauen, sondern mir benatworten bzw mich aufklären:

- [ ] Wie läuft das eigtl. aktuell und generell mit der Mehrsprachigkeit? Ist das alles hartkodiert Deutsch oder gibts schon irgendwelche Sprachvariablen? Oder/und wie läuft das generell bei Android-Apps?
- [ ] Selbiges Frag ich mich zb auch bzgl. Themes, Icons, Fonts usw.
