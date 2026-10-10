# shared/importmap.json

canonical import map for the frontend packages we want to use across the
android apps, offline. this is the **frame only**: it declares the bare
specifiers and the local path convention. no package files are vendored yet,
and no app is wired to it yet.

## what it maps

| specifier | package | graph |
|---|---|---|
| `@domina/prototype` | the domina dom verbs on the dom prototypes | self-contained, side-effect import |
| `@aufbau/filters` | aufbau live filters (canvas/webgl) | self-contained, no external deps |
| `@aufbau/gestures` | pointer gestures (core) | self-contained; the `/preact` adapter needs preact and is out of scope |
| `@aufbau/patterns` | svg pattern generators | self-contained, no external deps |
| `@aufbau/webfonts` | the handpicked font catalogue, loaded via `FontFace` | pulls `@pulgasari/is`; font files from `baseUrl` (see below) |

`@pulgasari/is` is in the map because `@aufbau/webfonts` imports it. without it
mapped, `@aufbau/webfonts` will not resolve offline.

### `@domina/prototype`

replaces `@domina/methods` for the apps. it installs the verbs on the dom
prototypes once, so an app imports it for its side effect and never by name:

```js
import '@domina/prototype';

document.getElement('#apply').onEvent('click', apply);
```

it changes the dom of the whole realm, which is fine for an app that owns its
webview. a package must not import it (see its readme).

### `@aufbau/webfonts`

the catalogue (`data.js`) ships with the package, the font files do not resolve
offline by default: `baseUrl` points to `code.pulgasari.dev`. an app points it
to its own copy before the first `apply`/`load`, and only the fonts it uses get
vendored (the full set is ~23 mb):

```js
import { configure, apply } from '@aufbau/webfonts';

configure({ baseUrl: './vendor/@aufbau/webfonts' });   // -> vendor/@aufbau/webfonts/files/<font>.ttf
await apply('manrope');
```

### not mapped (yet)

- `@aufbau/elements`, `@aufbau/gui`, `@aufbau/svg` (formerly `@aufbau/icons`):
  their graph pulls `@aufbau/element`, `@aufbau/import`, `@domina/methods`,
  `@domina/observer`, `@pulgasari/{is,str,timing,shift}`, and `<svg-icon>`
  resolves iconify ids over the network. not offline-capable as a raw map.
- `@aufbau/bundler`: a build-time node tool, not a runtime module.

## path convention

values are relative to the document that inlines the map, i.e. an app's `www/`
root. once vendoring happens, files live under:

```
apps/<app>/www/vendor/<scope>/<package>/   e.g. www/vendor/@aufbau/filters/index.js
```

everything is app-local: no `code.pulgasari.dev`, no `esm.sh`, no network at
runtime. that is the whole point (offline in the apk).

## how it gets used later (not done yet)

browsers do not support external import maps (`<script type="importmap" src>`),
so this json is the source of truth and gets **inlined** into each app's
`index.html`, before the first module script:

```html
<script type="importmap">
  /* contents of shared/importmap.json, with paths already relative to www/ */
</script>
<script type="module" src="app.js"></script>
```

## caveats of raw import maps (read before consuming)

a raw import map does prefix substitution only. it does **not** read a
package's `package.json`/`deno.json` `exports`. consequences:

- **import the bare specifier**, e.g. `import { applyFilter } from '@aufbau/filters'`.
  the package `index.js` surfaces the api. this always works.
- **subpaths need care.** the trailing-slash entry (`"@aufbau/filters/"`) only
  substitutes the prefix, so `@aufbau/filters/blur.js` -> `vendor/@aufbau/filters/blur.js`.
  but the package maps `./*` to `./lib/*.js` via `exports`, so the real file is
  `lib/blur.js`. same for `@aufbau/gestures/preact` (real file `adapters/preact.js`).
  these mismatches do not resolve through the map; add an explicit per-subpath
  entry when a subpath is actually needed, or import from the bare specifier.
- **extensions are literal.** a subpath without `.js` will 404. `@domina/prototype`
  and `@aufbau/webfonts` have no subpath entries on purpose: the bare specifier
  is their whole api (`@aufbau/webfonts/google` gets an entry once it is needed).

when an app uses a bundler, the bundler reads `exports` and all of the above
goes away. until then, this map is the offline contract.
