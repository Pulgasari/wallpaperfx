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
- recompile — either once (`node tools/build-css.mjs [app]`) or leave a watcher
  running so every save rebuilds automatically: `node tools/build-css.mjs --watch`
- commit both the source and the regenerated `www/styles.css`
- `cap copy`/`cap sync` then copies `www/` into the apk as usual

the watcher watches each app dir (not the file) so editor atomic saves keep
firing, and debounces the event burst. nothing is shipped and there is no
runtime cost — the compile happens at edit time, not on the device.

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
