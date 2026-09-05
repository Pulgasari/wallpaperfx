# todo

- [x] anmerkung/hinweis: `iconify` für icons nutzen (es sei denn wir bekämen alle nötigen icons via unicode-symbole hin)
      -> vorerst unicode-symbole (▶ ⏸ ✕ + ✓); reicht aktuell, iconify erst falls beim ui-umbau mehr icons gebraucht werden

## app-settings

- [x] add: regler für scaling der generellen größe (beeinflusst quasi alles?) -> "Größe" (css zoom auf sheet-body)
- [x] add: evtl. regler für fontsize (is aber quasi auch iconsize) -> durch den generellen größen-regler abgedeckt (skaliert schrift + icons mit)
- [x] add: evtl. regeler für scaling von spacings (padding/gaps) -> "Abstände" (--space-scale)

## filters

- [x] filters alphabetisch sortieren
- [x] add filter: `bloom`
- [x] add filter: `blur` (real)
- [x] add filter: `fisheye`
- [x] add filter: `grain` (statisch, monochrom)
- [x] add filter: `noise` (statisch, rgb)
- [x] add filter: `duotone-2` -> "Duotone Cycle": highlight-farbe wechselt über die zeit zwischen zwei farben (dauer einstellbar)
- [x] enhance filter `vignette`: farbe einstellbar (default: black)

## preview

- [x] die preview sollte pausierbar sein
- [x] falls möglich: qualität der preview einstellbar (dpr-cap: niedrig/mittel/hoch)

## wallpapers

- [x] wallpaper sollte auf x- und y-achse gespiegelt werden können
- [x] falls möglich: letzte stelle merken
      -> sichtbarkeits-wechsel (app auf/zu) startet das video nicht mehr neu und der letzte frame bleibt stehen (reload nur noch bei echter config-änderung, per mtime-gate).
      -> über vollständigen teardown hinweg (screen off/on, wallpaper-wechsel) wird index + position gemerkt (shared prefs) und per seek fortgesetzt.
      -> hinweis: den exakten letzten frame über einen kompletten teardown einzufrieren (statt seek) ist nicht umgesetzt - das würde ein persistieren des gl-frames erfordern.

### image-mode

- [x] modi: loop | loop-random | single/random (single = ein zufälliges bild, statisch)

### video-mode

- [x] man sollte auch mehrere videos wählen können
- [x] modi: loop | loop-random | single/random (single = ein zufälliges video, geloopt)

---

# ui-umbau

status: eigener nächster meilenstein. der font-punkt ist erledigt; der restliche
ground-up-umbau (neue leisten, tab-panels mit swipe, quellen-grid) strukturiert
index.html/styles.css/app.js komplett um und wird als fokussierter schritt separat
gemacht, damit er nicht mit den obigen feature-änderungen kollidiert.

- [x] font: "Manrope" (selbst gehostet, latin-subset variable font)
- [ ] leiste oben, linke seite: appname + settings-icon zum togglen der app-settings
- [ ] leiste oben, rechte seite: buttons für: (saved) configs/presets, sources, wallpapers, save
- [ ] leiste unten 1: config, filters, motion, parallaxe (klickt man auf eins davon öffnet sich darüber dessen panel/tab, auf den selben button nochma klicken = geht wieder zu, während panel offen is, kann man dort nach links/rechts swipen um zwischen den tabs zu wechseln. und handle um das panel in der höhe einzustellen)
- [ ] leiste unten 2: '+'-icon/quadrat (kann man neue quellen hinzufügen, einzeiliges grid mit squares der sources, horizontal scrollbar, mit mechanismus um das panel fullscreen zu machen, dann isses mehrzeilig usw (mir fällt grade ein: evtl sollte der erste square actually aus 4 icons bestehen: add, clear, fullscreen, save)
