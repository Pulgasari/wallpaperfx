# CLAUDE.md

Guidance for working in this repo.

## What this is

Android live wallpaper. Web UI (Capacitor, plain JS under `www/`) + native
wallpaper engine (Java + OpenGL ES 2.0 under `android/app/src/main/java/`).
A live wallpaper cannot be a WebView, so all rendering is native; the WebView
only writes config.

## Key invariant: the config bridge

`www/app.js` `state` object and `config/WpConfig.java` fields must stay in sync,
including json key names. The UI writes `filesDir/wallpaperfx_config.json` via
the `WallpaperFx` plugin; `SceneRenderer` reads the same file on reload. If you
add a config field, touch all three: `WpConfig` (model + toJson/fromJson),
`app.js` (`state` + a control), and the renderer that consumes it.

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
`www/preview.js` `FRAGMENT_SRC` (the ui preview). The filter index mapping
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
- Prefer JavaScript; the web side is intentionally bundler-free.
- Do not hand-edit generated gradle files (`capacitor.build.gradle`, etc.).
- After changing `www/`, run `npx cap copy android` (CI runs `cap sync`).

## Build / verify

No Android SDK is assumed locally — the source of truth for "does it build" is
the `android build` GitHub Actions workflow. Locally: `npm install &&
npx cap sync android && (cd android && ./gradlew assembleDebug)`.
