# CLAUDE.md

Guidance for working in this repo.

## What this is

Android live wallpaper. Web UI (Capacitor, a rat app: sources in
`rat/dev/android/subotnik-wallpapers/`, built into `www/`, never edit `www/`) + native
wallpaper engine (Java + OpenGL ES 2.0 under `android/app/src/main/java/`).
A live wallpaper cannot be a WebView, so all rendering is native; the WebView
only writes config.

## Key invariant: the config bridge

`modules/wallpaper.js` `CONFIG` (in the rat sources) and `config/WpConfig.java` fields must stay in sync,
including json key names. The UI writes `filesDir/wallpaper_config.json` via
the `Wallpaper` plugin; `SceneRenderer` reads the same file on reload. If you
add a config field, touch all three: `WpConfig` (model + toJson/fromJson),
`CONFIG` (and a control in a page component), and the renderer that consumes it.

Images are `images`: an ordered array of `{path, enabled}` (mirrored by
`WpConfig.ImageItem`); the renderer cycles `enabledImagePaths()`. The ui shows
them as reorderable/toggleable thumbnail tiles.

Filters are a chain: `filters` is an ordered array of entries, each carrying its
own params (`WpConfig.FilterEntry` ⇄ `modules/wallpaper.js` `filterOf()` — keep the defaults
and json keys identical). They render as a multi-pass fbo pipeline: the source
(video/image) is drawn once into an fbo unfiltered, then each enabled filter is a
fullscreen pass ping-ponging between two fbos, the last pass to the screen. This
lives in `SceneRenderer.renderChain` and `preview.js` `render()` — both must
agree; the fbo content is upright so chain passes sample it 1:1 (identity, no
flip). `drawQuad`/`drawPass` take a filter entry (or null = source pass, no
filter).

## Rendering model

- `GLRenderThread` owns the EGL context and a demand-driven loop. `onDrawFrame`
  returns ms-until-next-frame: `0` = animate now, `>0` = redraw after delay,
  `Long.MAX_VALUE` = idle until `requestRender()`. Keep it battery-friendly:
  static images idle, video wakes on `onFrameAvailable`, transitions animate.
- Video = external OES texture; images = `GL_TEXTURE_2D`. Both share the vertex
  shader (cover/fit + pan) and the filter fragment code. The quad maps screen-top
  to texture `v=1`, so 2d image textures render upside down unless flipped: the
  wallpaper uses a flip-Y `uTexMatrix` (`imageMatrix` in `SceneRenderer`) and the
  preview sets `UNPACK_FLIP_Y_WEBGL=true`; keep those two in agreement. Video uses
  the `SurfaceTexture` transform matrix. Verified upright with a headless
  screenshot test; if you change the quad/texcoords, re-check both renderers.
- Preview `<img>` textures must NOT set `crossOrigin` — the capacitor file server
  is same-origin and sends no cors headers, so cors mode makes the load fail.
- All GL calls must run on the render thread (the one with the EGL context).

## Second invariant: the two filter shaders

The fragment filter source exists twice, once per renderer, and they must stay
identical in logic: `wallpaper/FilterGlsl.java` (the wallpaper) and
`modules/preview.js` `FRAGMENT_SRC` of the rat sources (the ui preview). The filter index mapping
(`0 none … 12 invert`) is defined in three places that must agree:
`SceneRenderer.filterIndex`, `FilterGlsl` header comment, and `preview.js`
`FILTER_INDEX`. Change a filter -> change all of them. Screen-space effects use
the `vScreenCoord` varying (0..1 across the screen); color effects sample with
`vTexCoord` (content uv). Animated filters (`filmgrain`/`glitch`/`vhs`) read the
`uTime` uniform; `SceneRenderer.isAnimated` forces the loop to return `0` (draw
continuously) while one is active and content is present, so keep that list in
sync with the animated indices too.

## Conventions

- Code comments: english, all lowercase, technical, no emojis.
- Prefer JavaScript. the web side is a rat app, its sources are in the rat repo.
- Do not hand-edit generated gradle files (`capacitor.build.gradle`, etc.).
- `www/` is built: `cd ../rat && node packages/cli/index.js build dev/android/subotnik-wallpapers --target android`.

## Build / verify

No Android SDK is assumed locally — the source of truth for "does it build" is
the `android build` GitHub Actions workflow. Locally: `npm install &&
npx cap sync android && (cd android && ./gradlew assembleDebug)`.
