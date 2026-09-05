# todo

- [ ] anmerkung/hinweis: `iconify` für icons nutzen (es sei denn wir bekämen alle nötigen icons via unicode-symbole hin)

## app-settings

- [ ] add: regler für scaling der generellen größe (beeinflusst quasi alles?)
- [ ] add: evtl. regler für fontsize (is aber quasi auch iconsize)
- [ ] add: evtl. regeler für scaling von spacings (padding/gaps)

## filters

- [ ] filters alphabetisch sortieren
- [ ] add filter: `bloom`
- [ ] add filter: `blur` (real)
- [ ] add filter: `fisheye`
- [ ] add filter: `grain`
- [ ] add filter: `noise`
- [ ] add filter: `duotone-2`: (weiss nich wie mans nennen soll. aber man könnte bei der fg auch mehrere farben angeben + zeitdauer, dann wechselt die farbe dazwischen allmählich hin und her)
- [ ] enhance filter `vignette`: farbe einstellbar (default: black)

## preview

- [ ] die preview sollte pausierbar sein
- [ ] falls möglich: qualität der preview einstellbar

## wallpapers

- [ ] wallpaper sollte auf x- und y-achse gespiegelt werden können
- [ ] falls möglich: letzte stelle merken. aktuell startet z.b. ein video immer neu wenn das wallpaper erneut zu sehen ist. wäre nice, wenn sich die stelle gemerkt wird, wenn er aufhört zu renden. und noch besser wärs, wenn quasi der letzte frame gespeichert werden würde, sodass es nicht von blackscreen aus neu/weiter zeichnet.

### image-mode

- [ ] modi: loop | loop-random | single/random

### video-mode

- [ ] man sollte auch mehrere videos wählen können
- [ ] modi: loop | loop-random | single/random

---

# ui-umbau

- [ ] leiste oben, linke seite: appname + settings-icon zum togglen der app-settings
- [ ] leiste oben, rechte seite: buttons für: (saved) configs/presets, sources, wallpapers, save
- [ ] leiste unten 1: config, filters, motion, parallaxe (klickt man auf eins davon öffnet sich darüber dessen panel/tab, auf den selben button nochma klicken = geht wieder zu, während panel offen is, kann man dort nach links/rechts swipen um zwischen den tabs zu wechseln. und handle um das panel in der höhe einzustellen)
- [ ] leiste unten 2: '+'-icon/quadrat (kann man neue quellen hinzufügen, einzeiliges grid mit squares der sources, horizontal scrollbar, mit mechanismus um das panel fullscreen zu machen, dann isses mehrzeilig usw (mir fällt grade ein: evtl sollte der erste square actually aus 4 icons bestehen: add, clear, fullscreen, save)
