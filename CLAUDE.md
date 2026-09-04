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
  shader (cover/fit + pan) and the filter fragment code. Images use a flip-Y
  texture matrix; video uses the `SurfaceTexture` transform matrix.
- All GL calls must run on the render thread (the one with the EGL context).

## Conventions

- Code comments: english, all lowercase, technical, no emojis.
- Prefer JavaScript; the web side is intentionally bundler-free.
- Do not hand-edit generated gradle files (`capacitor.build.gradle`, etc.).
- After changing `www/`, run `npx cap copy android` (CI runs `cap sync`).

## Build / verify

No Android SDK is assumed locally — the source of truth for "does it build" is
the `android build` GitHub Actions workflow. Locally: `npm install &&
npx cap sync android && (cd android && ./gradlew assembleDebug)`.
