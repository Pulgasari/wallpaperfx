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

status: umgesetzt. neue shell aus top-bar, unterer tab-leiste mit swipe-baren
höhenverstellbaren panels und einer sources-leiste. icons als monochrome inline-svg
(feather-style, currentColor, kein iconify/emoji nötig). in hell + dunkel per
headless-chromium geprüft.

- [x] font: "Manrope" (selbst gehostet, latin-subset variable font)
- [x] leiste oben, linke seite: appname + settings-icon zum togglen der app-settings
- [x] leiste oben, rechte seite: buttons für: presets, sources, wallpaper (apply), save
- [x] leiste unten 1: config, filters, motion, parallaxe
      -> tap öffnet das panel darüber, erneuter tap auf denselben button schließt es;
         bei offenem panel links/rechts swipen wechselt die tabs; handle oben stellt die höhe ein.
- [x] leiste unten 2: '+'/quadrat zum quellen-hinzufügen, einzeiliges horizontal-scrollbares
      grid der source-squares, fullscreen-mechanismus (dann mehrzeilig).
      -> das erste quadrat besteht aus 4 icons: add, clear, fullscreen, save.
