# TODO

- [x] die apps haben/zeigen aktuell nur das default capacitor icon. die sollten alle n eigenes icon bekommen. für den anfang würde jeweils einfach n dicker anfangsbuchstabe reichen also: B, L, WP

---

# Cosmonaut (Browser)

- [x] add button to dock: dev-tools
- [x] add button to dock: userscripts (violentmonkey o.ä.)
- [x] add button to dock: search in page
- [x] add button to dock: settings
- [x] `@aufbau/css/aufbau.css` als grundlage einbinden

## bugs
- [x] das blur-overlay verdeckt die zusätzlichen icons wenn man in url-leiste was eingibt

## features

### feature: context-menu
- [x] grundsätzlich den mechanismus bauen

### feature: gestures (via `@aufbau/gestures`)
- [x] reload = webview nach unten ziehen
- [x] hard reload = webview nach unten ziehen und halten

## part: bookmarks
- [x] folders
- [x] tags
- [x] export/import as/from html
- [x] export/import as/from json
- [x] erst so mechanismus für url-leiste das man quasi `<string>:` tippt um irgendne sonderfunktion zu aktivieren ...
- [x] ... dann erste sonderfunktion: eingabe von `tl:` aktiviert translate-modus und wenn man dann `tl: katze` eingibt nutzt das entweder irgendne api (google translate? yandex? deepl?) oder leitet wenigstens zu ner url von denen für übersetzung

## parts

### part: dashboard
quasi die startseite oder bei leerer tab.
- [x] rendert zunächst erstmal die bookmarks als grid

### part: dock
- [x] das `padding` vom ist zu groß. wenn die `aufbau.css` eingebunden ist hier `padding: --space(small);` nutzen

### settings-options
  - [x] colors: bg / fg / accent
  - [x] position dock: top : bottom
  - [x] position lade-anzeiger: top | bottom
  - [x] reihenfolge der dock-elemente
  - [x] toggle on/off der einzelnen dock-elemente
  - [x] size der dock-elemente
  - [x] gap zwischenden dock-elementen
  - [x] overlay mit blur-effekt on/off

### part: url-leiste
- [x] `context-menu` einbauen:
  - [x] add to bookmarks
  - [x] reload / hard reload
  - [x] close

### part: userscripts
- [x] weiteres eingabefeld für css
- [ ] `<write-code>` aus `@aufbau/elements` nutzen

---

# Subotnik (Launcher)

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

---

# Subotnik Wallpapers

---

# tooling

- [x] `@pulgasari/is` published: https://jsr.io/@pulgasari/is
- [x] `@pulgasari/logger` published: https://jsr.io/@pulgasari/logger
- [X] `@pulgasari/str` published: https://jsr.io/@pulgasari/str
