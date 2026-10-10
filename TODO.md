# TODO

- [x] die apps haben/zeigen aktuell nur das default capacitor icon. die sollten alle n eigenes icon bekommen. für den anfang würde jeweils einfach n dicker anfangsbuchstabe reichen also: B, L, WP

## Cosmonaut (Browser)

- [x] add button to dock: dev-tools
- [x] add button to dock: userscripts (violentmonkey o.ä.)
- [x] add button to dock: search in page
- [x] add button to dock: settings

### bookmarks
- [ ] folders
- [ ] tags
- [ ] export/import as/from html (zumindest bild ich mir ein dass das typischer mechanismus ist?)
- [ ] export/import as/from json
- [ ] erst so mechanismus für url-leiste das man quasi `<string>:` tippt um irgendne sonderfunktion zu aktivieren ...
- [ ] ... dann erste sonderfunktion: eingabe von `tl:` aktiviert translate-modus und wenn man dann `tl: katze` eingibt nutzt das entweder irgendne api (google translate? yandex? deepl?) oder leitet wenigstens zu ner url von denen für übersetzung

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

## Subotnik (Launcher)

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

## Subotnik Wallpapers

---

# tooling

- [x] `@pulgasari/is` published: https://jsr.io/@pulgasari/is
- [x] `@pulgasari/logger` published: https://jsr.io/@pulgasari/logger
- [X] `@pulgasari/str` published: https://jsr.io/@pulgasari/str
