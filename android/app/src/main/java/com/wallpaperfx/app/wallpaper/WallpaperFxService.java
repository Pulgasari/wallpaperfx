package com.wallpaperfx.app.wallpaper;

import android.service.wallpaper.WallpaperService;
import android.view.SurfaceHolder;

// the live wallpaper entry point. each engine instance owns one gl render thread
// and one scene renderer bound to the engine's surface.
public class WallpaperFxService extends WallpaperService {

    @Override
    public Engine onCreateEngine() {
        return new FxEngine();
    }

    private class FxEngine extends Engine {

        private GLRenderThread thread;
        private SceneRenderer renderer;

        @Override
        public void onCreate(SurfaceHolder surfaceHolder) {
            super.onCreate(surfaceHolder);
            setTouchEventsEnabled(false);
        }

        @Override
        public void onSurfaceCreated(SurfaceHolder holder) {
            super.onSurfaceCreated(holder);
            renderer = new SceneRenderer(WallpaperFxService.this);
            thread = new GLRenderThread(holder, renderer);
            renderer.attachThread(thread);
            thread.start();
        }

        @Override
        public void onSurfaceChanged(SurfaceHolder holder, int format, int width, int height) {
            super.onSurfaceChanged(holder, format, width, height);
            if (thread != null) thread.setSize(width, height);
        }

        @Override
        public void onOffsetsChanged(float xOffset, float yOffset, float xOffsetStep,
                                     float yOffsetStep, int xPixelOffset, int yPixelOffset) {
            super.onOffsetsChanged(xOffset, yOffset, xOffsetStep, yOffsetStep, xPixelOffset, yPixelOffset);
            if (renderer != null) renderer.setXOffset(xOffset);
        }

        @Override
        public void onVisibilityChanged(boolean visible) {
            super.onVisibilityChanged(visible);
            if (thread == null) return;
            if (visible) {
                // reload config so changes made in the ui take effect
                renderer.requestReload();
                thread.setPaused(false);
            } else {
                thread.setPaused(true);
            }
        }

        @Override
        public void onSurfaceDestroyed(SurfaceHolder holder) {
            if (thread != null) {
                thread.release();
                thread = null;
            }
            super.onSurfaceDestroyed(holder);
        }

        @Override
        public void onDestroy() {
            if (thread != null) {
                thread.release();
                thread = null;
            }
            super.onDestroy();
        }
    }
}
