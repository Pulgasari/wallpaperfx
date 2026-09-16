# tools

repo-level build tools. not part of any app's `npm ci` / `cap sync` / gradle
build — those stay self-contained per app (see the root `CLAUDE.md`). these run
by hand and their output is committed.

## css: aufbau style sheets (`@aufbau/ass`)

apps author css in `apps/<app>/styles.aufbau.css` and ship the compiled
`apps/<app>/www/styles.css`. it is a strict css superset — plain css compiles
unchanged — that adds `@default` / `@prop` / `@value` / `@mixin` sugar. see the
package readme (aufbau repo, `ass/`) for the language.

- edit `apps/<app>/styles.aufbau.css`
- regenerate: `node tools/build-css.mjs` (all apps) or `node tools/build-css.mjs <app>`
- commit both the source and the regenerated `www/styles.css`
- `cap copy`/`cap sync` then copies `www/` into the apk as usual

the source sits at the app root on purpose — not in `www/` — so it never ships
in the apk; only the generated `www/styles.css` does. the `.aufbau.css`
extension keeps editor css highlighting while marking the file as needing a
compile.

### `ass/` is vendored

`tools/ass/` is a pinned, build-time-only copy of the `@aufbau/ass` compiler
core (`index`, `parse`, `transform`, `serialize`, `longhands`), zero-dependency
esm. it lives here so the css build works offline with no registry and no
sibling checkout. resync from the aufbau repo when the compiler changes:

```
cp ../aufbau/ass/{index.js,index.d.ts,parse.js,transform.js,serialize.js,longhands.js} tools/ass/
```

vendored from aufbau `ass/` @ commit `0b839a1`. replace with the published
`@aufbau/ass` (jsr/npm) once it is released.
