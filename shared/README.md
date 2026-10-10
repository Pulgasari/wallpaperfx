# shared/importmap.json

canonical import map for the frontend packages we use across the android apps,
offline. it declares the bare specifiers and the local path convention. the
package files are not vendored into the apps yet, and no app is wired to it yet
(that is the job of `@aufbau/bundler`, see the concept in `aufbau/bundler/concept.md`).

## what it maps

the packages the apps use, and everything they pull in transitively. the graph
was walked over the sources (static and literal dynamic imports) and the map was
checked in chromium: every entry and every `@aufbau/elements/webcomponents/*`
module imports from a local `vendor/` copy with no network.

| specifier | role | pulls in |
|---|---|---|
| `@domina/prototype` | the domina dom verbs on the dom prototypes, for app code | nothing |
| `@aufbau/elements` | the custom elements (`aufbau-*`, `app-*`, `pop-*`, `svg-icon`, ...) | `@aufbau/element`, `@aufbau/import`, `@domina/methods`, `@domina/observer`, `@pulgasari/{is,str,timing,shift,coerce,logger,obj}`, `@bunker/storage` |
| `@aufbau/gui` | spec-driven controls rendered as `aufbau-*` elements | `@domina/methods`, peer `@aufbau/elements` |
| `@aufbau/svg` | `<svg-icon>`, `<svg-flag>`, `<svg-logo>` + the default aliases (formerly `@aufbau/icons`) | `@aufbau/elements` |
| `@aufbau/webfonts` | the handpicked font catalogue, loaded via `FontFace` | `@pulgasari/is` |
| `@aufbau/filters` | live filters (canvas/webgl) | nothing |
| `@aufbau/gestures` | pointer gestures (core) | nothing; the `/preact` adapter is out of scope |
| `@aufbau/patterns` | svg pattern generators | nothing |

`@aufbau/bundler` is a build-time node tool, not a runtime module: it is the
thing that stages these packages into an app's `www/`, so it has no entry here.

`@domina/prototype` is for app code (`import '@domina/prototype'` once, for its
side effect). the libraries keep using `@domina/methods` internally, which is
why `methods` is in the map too: a package must not import `prototype`, it
changes the dom of the whole realm.

## known blockers in the packages

two specifiers in the sources do not resolve through any import map. the chromium
check passes only with both fixed in the source (they are fixes in aufbau, not
entries to add here):

- `@aufbau/element` (`lib/schema.js`, `lib/config.js`) imports
  `@pulgasari/canonicalmap`. that package does not exist; `CanonicalMap` lives in
  `@pulgasari/obj/CanonicalMap.js`.
- `@aufbau/import` imports `https://code.pulgasari.dev/bunker/db/index.js` and
  `.../bunker/policy/index.js` as urls, although its package.json declares
  `@bunker/db` and `@bunker/policy`. offline this fails, and with it every module
  that imports `@aufbau/import`: `aufbau-input` (`webcomponents/input/*`),
  `data-list`, `data-table`, `data-tree`, `data-filter`, `media-json`,
  `output-md`, `write-md`, `pop-prompt`, `input-address`.

## runtime network, beyond module resolution

- `<svg-icon>` fetches full iconify ids (`lucide:save`) from `api.iconify.design`.
  offline needs the svgs staged locally (the bundler's `icons` step).
- `@aufbau/webfonts` loads font files from `baseUrl`, by default
  `code.pulgasari.dev`. offline needs `configure({ baseUrl })` pointing at a local
  copy of only the fonts in use (the bundler's `webfonts` step); all of them are ~23 mb.
- `write-code` loads `hljs` dynamically, a third-party module the map does not
  cover (the bundler's `vendor` step).

## path convention

values are relative to the document that inlines the map, i.e. an app's `www/`
root. vendored files live under:

```
apps/<app>/www/vendor/<scope>/<package>/   e.g. www/vendor/@aufbau/filters/index.js
```

the `@bunker/*` packages import their siblings by relative path
(`../core/index.js`), so `@bunker/core` and `@bunker/utils` have to sit next to
them under `vendor/@bunker/`; they are mapped too.

everything is app-local: no `code.pulgasari.dev`, no `esm.sh`, no network at
runtime. that is the whole point (offline in the apk).

## how it gets used

browsers do not support external import maps (`<script type="importmap" src>`),
so this json is the source of truth and gets **inlined** into each app's
`index.html`, before the first module script:

```html
<script type="importmap">
  /* contents of shared/importmap.json */
</script>
<script type="module" src="app.js"></script>
```

## caveats of raw import maps

a raw import map does prefix substitution only. it does **not** read a
package's `package.json`/`deno.json` `exports`. consequences:

- **import the bare specifier** where a package has one, e.g.
  `import { applyFilter } from '@aufbau/filters'`.
- **subpaths are file paths.** the trailing-slash entry only substitutes the
  prefix: `@aufbau/elements/webcomponents/svg-icon.js` works because the file
  is there. `@aufbau/filters/blur.js` does not: the package maps `./*` to
  `./lib/*.js` via `exports`, the real file is `lib/blur.js`. same for
  `@aufbau/gestures/preact` (real file `adapters/preact.js`).
- **extensions are literal.** `@domina/methods/addClass` 404s, write
  `@domina/methods/addClass.js`.
