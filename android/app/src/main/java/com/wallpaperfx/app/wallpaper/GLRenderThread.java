package com.wallpaperfx.app.wallpaper;

import android.os.SystemClock;
import android.util.Log;
import android.view.SurfaceHolder;

import javax.microedition.khronos.egl.EGL10;
import javax.microedition.khronos.egl.EGLConfig;
import javax.microedition.khronos.egl.EGLContext;
import javax.microedition.khronos.egl.EGLDisplay;
import javax.microedition.khronos.egl.EGLSurface;

// owns a dedicated egl context bound to the wallpaper surface and runs the render
// loop off the main thread. the loop is demand-driven: the renderer returns how
// long until the next frame is needed, so a static image sleeps instead of burning
// the battery, while video/transitions animate at vsync.
class GLRenderThread extends Thread {

    interface Renderer {
        void onSurfaceCreated();
        void onSurfaceChanged(int width, int height);
        // returns ms until the next frame is needed:
        //   0                -> animate: draw again immediately (vsync paced by swap)
        //   >0               -> redraw after this many ms
        //   Long.MAX_VALUE   -> idle until requestRender()
        long onDrawFrame();
        void onSurfaceDestroyed();
    }

    private static final int EGL_CONTEXT_CLIENT_VERSION = 0x3098;
    private static final int EGL_OPENGL_ES2_BIT = 0x0004;
    private static final int EGL_RENDERABLE_TYPE = 0x3040;

    private final SurfaceHolder holder;
    private final Renderer renderer;
    private final Object lock = new Object();

    private boolean running = true;
    private boolean paused = false;
    private boolean dirty = true;
    private boolean sizePending = false;
    private int width, height;

    private EGL10 egl;
    private EGLDisplay eglDisplay;
    private EGLContext eglContext;
    private EGLSurface eglSurface;
    private EGLConfig eglConfig;

    GLRenderThread(SurfaceHolder holder, Renderer renderer) {
        this.holder = holder;
        this.renderer = renderer;
        setName("wallpaperfx-gl");
    }

    void requestRender() {
        synchronized (lock) {
            dirty = true;
            lock.notifyAll();
        }
    }

    void setPaused(boolean value) {
        synchronized (lock) {
            paused = value;
            lock.notifyAll();
        }
    }

    void setSize(int w, int h) {
        synchronized (lock) {
            width = w;
            height = h;
            sizePending = true;
            dirty = true;
            lock.notifyAll();
        }
    }

    void release() {
        synchronized (lock) {
            running = false;
            lock.notifyAll();
        }
        try {
            join(2000);
        } catch (InterruptedException ignored) {
        }
    }

    @Override
    public void run() {
        try {
            initEgl();
        } catch (Exception e) {
            Log.e(GLUtil.TAG, "egl init failed", e);
            return;
        }

        renderer.onSurfaceCreated();

        while (true) {
            synchronized (lock) {
                while (running && paused) {
                    waitQuietly();
                }
                if (!running) break;
            }

            if (sizePending) {
                int w, h;
                synchronized (lock) {
                    w = width;
                    h = height;
                    sizePending = false;
                }
                renderer.onSurfaceChanged(w, h);
            }

            long next = renderer.onDrawFrame();
            if (!egl.eglSwapBuffers(eglDisplay, eglSurface)) {
                // context lost (e.g. surface gone); bail out cleanly
                int err = egl.eglGetError();
                if (err == EGL10.EGL_BAD_NATIVE_WINDOW || err == EGL11_CONTEXT_LOST) {
                    Log.w(GLUtil.TAG, "swap failed, stopping render thread: " + err);
                    break;
                }
            }

            if (next != 0L) {
                synchronized (lock) {
                    dirty = false;
                    long deadline = (next == Long.MAX_VALUE) ? 0L : SystemClock.uptimeMillis() + next;
                    while (running && !paused && !dirty && !sizePending) {
                        if (deadline == 0L) {
                            waitQuietly();
                        } else {
                            long remain = deadline - SystemClock.uptimeMillis();
                            if (remain <= 0L) break;
                            waitQuietly(remain);
                        }
                    }
                }
            }
        }

        renderer.onSurfaceDestroyed();
        destroyEgl();
    }

    private static final int EGL11_CONTEXT_LOST = 0x300E; // EGL_CONTEXT_LOST

    private void waitQuietly() {
        try {
            lock.wait();
        } catch (InterruptedException ignored) {
        }
    }

    private void waitQuietly(long ms) {
        try {
            lock.wait(ms);
        } catch (InterruptedException ignored) {
        }
    }

    private void initEgl() {
        egl = (EGL10) EGLContext.getEGL();
        eglDisplay = egl.eglGetDisplay(EGL10.EGL_DEFAULT_DISPLAY);
        int[] version = new int[2];
        egl.eglInitialize(eglDisplay, version);

        int[] configSpec = {
                EGL10.EGL_RED_SIZE, 8,
                EGL10.EGL_GREEN_SIZE, 8,
                EGL10.EGL_BLUE_SIZE, 8,
                EGL10.EGL_ALPHA_SIZE, 0,
                EGL10.EGL_DEPTH_SIZE, 0,
                EGL10.EGL_STENCIL_SIZE, 0,
                EGL_RENDERABLE_TYPE, EGL_OPENGL_ES2_BIT,
                EGL10.EGL_NONE
        };
        int[] num = new int[1];
        egl.eglChooseConfig(eglDisplay, configSpec, null, 0, num);
        EGLConfig[] configs = new EGLConfig[num[0]];
        egl.eglChooseConfig(eglDisplay, configSpec, configs, num[0], num);
        eglConfig = configs[0];

        int[] ctxAttribs = {EGL_CONTEXT_CLIENT_VERSION, 2, EGL10.EGL_NONE};
        eglContext = egl.eglCreateContext(eglDisplay, eglConfig, EGL10.EGL_NO_CONTEXT, ctxAttribs);
        eglSurface = egl.eglCreateWindowSurface(eglDisplay, eglConfig, holder, null);
        egl.eglMakeCurrent(eglDisplay, eglSurface, eglSurface, eglContext);
    }

    private void destroyEgl() {
        if (egl == null) return;
        try {
            egl.eglMakeCurrent(eglDisplay, EGL10.EGL_NO_SURFACE, EGL10.EGL_NO_SURFACE, EGL10.EGL_NO_CONTEXT);
            if (eglSurface != null) egl.eglDestroySurface(eglDisplay, eglSurface);
            if (eglContext != null) egl.eglDestroyContext(eglDisplay, eglContext);
            egl.eglTerminate(eglDisplay);
        } catch (Exception e) {
            Log.w(GLUtil.TAG, "egl teardown error", e);
        }
    }
}
