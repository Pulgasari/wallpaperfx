# shared/importmap.json

canonical import map for the frontend packages we want to use across the
android apps, offline. this is the **frame only**: it declares the bare
specifiers and the local path convention. no package files are vendored yet,
and no app is wired to it yet.

## what it maps

| specifier | package | graph |
|---|---|---|
| `@aufbau/filters` | aufbau live filters (canvas/webgl) | self-contained, no external deps |
| `@aufbau/gestures` | pointer gestures (core) | self-contained; the `/preact` adapter needs preact and is out of scope |
| `@aufbau/patterns` | svg pattern generators | self-contained, no external deps |
| `@domina/methods` | dom mutation helpers | pulls `@pulgasari/is` and `@pulgasari/str` transitively |

`@pulgasari/is` and `@pulgasari/str` are in the map because `@domina/methods`
imports them (see `domina/packages/methods/deno.json` -> `imports`). without
them mapped, `@domina/methods` will not resolve offline. their files land when
the `@pulgasari/*` utils get vendored (separate step).

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
- **extensions are literal.** `@domina/methods/addClass` (no extension) will
  404; write `@domina/methods/addClass.js`. the bare `@domina/methods` entry
  (its `index.js` re-exports everything) avoids the issue.

when the packages are on jsr and an app uses a bundler, the bundler reads
`exports` and all of the above goes away. until then, this map is the offline
contract.
