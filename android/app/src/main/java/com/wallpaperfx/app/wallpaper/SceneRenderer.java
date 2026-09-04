package com.wallpaperfx.app.wallpaper;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.SurfaceTexture;
import android.media.MediaPlayer;
import android.opengl.GLES11Ext;
import android.opengl.GLES20;
import android.opengl.GLUtils;
import android.opengl.Matrix;
import android.os.SystemClock;
import android.util.Log;
import android.view.Surface;

import com.wallpaperfx.app.config.WpConfig;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.FloatBuffer;
import java.util.Random;

// draws the wallpaper scene: either a looping video sampled as an external oes
// texture, or an image slideshow with cross-fade. both paths share the vertex
// shader (cover/fit scaling + pan) and the filter fragment code (duotone/scanlines).
class SceneRenderer implements GLRenderThread.Renderer {

    // fullscreen quad, triangle strip. texcoords use gl convention (0,0 = bottom-left);
    // images are flipped upright via a texture matrix, video via the surfacetexture matrix.
    private static final float[] POSITIONS = {-1f, -1f, 1f, -1f, -1f, 1f, 1f, 1f};
    private static final float[] TEXCOORDS = {0f, 0f, 1f, 0f, 0f, 1f, 1f, 1f};

    private static final String VERTEX_SRC =
            "uniform mat4 uTexMatrix;\n" +
            "uniform vec2 uUvScale;\n" +
            "uniform vec2 uUvOffset;\n" +
            "uniform vec2 uPosScale;\n" +
            "attribute vec2 aPosition;\n" +
            "attribute vec2 aTexCoord;\n" +
            "varying vec2 vTexCoord;\n" +
            "varying vec2 vScreenCoord;\n" +
            "void main() {\n" +
            "  vec2 uv = (aTexCoord - 0.5) * uUvScale + 0.5 + uUvOffset;\n" +
            "  vTexCoord = (uTexMatrix * vec4(uv, 0.0, 1.0)).xy;\n" +
            "  vScreenCoord = aTexCoord;\n" + // 0..1 across the screen (fullscreen quad)
            "  gl_Position = vec4(aPosition * uPosScale, 0.0, 1.0);\n" +
            "}\n";

    // shared fragment body: same for the 2d and oes programs, only the sampler
    // declaration in the prefix differs. filter index mapping is documented in
    // SceneRenderer.filterIndex and mirrored in www/preview.js.
    private static final String FRAG_BODY = FilterGlsl.SOURCE;

    private static final String FRAG_2D =
            "precision mediump float;\n" +
            "uniform sampler2D uTexture;\n" + FRAG_BODY;

    private static final String FRAG_OES =
            "#extension GL_OES_EGL_image_external : require\n" +
            "precision mediump float;\n" +
            "uniform samplerExternalOES uTexture;\n" + FRAG_BODY;

    private final Context context;
    private GLRenderThread thread;

    private FloatBuffer posBuffer;
    private FloatBuffer texBuffer;

    private Prog prog2d;
    private Prog progOes;

    private int screenW, screenH;
    private volatile boolean needsReload = true;

    // home-screen swipe position (0..1, 0.5 = centered), drives parallax
    private volatile float xOffset = 0.5f;

    private WpConfig cfg = new WpConfig();

    // video state
    private MediaPlayer mediaPlayer;
    private SurfaceTexture videoSurfaceTexture;
    private Surface videoSurface;
    private int oesTexId;
    private final float[] videoMatrix = new float[16];
    private final Object frameLock = new Object();
    private boolean frameAvailable;
    private volatile int videoW, videoH;
    private volatile boolean videoReady;

    // image slideshow state
    private final float[] identityMatrix = new float[16];
    private int texA, texAw, texAh;
    private int texB, texBw, texBh;
    private int imageIndex;
    private int nextIndex;
    private boolean transitioning;
    private long lastShownAt;
    private long transitionStart;
    private final Random random = new Random();

    SceneRenderer(Context context) {
        this.context = context.getApplicationContext();
        Matrix.setIdentityM(identityMatrix, 0);
    }

    void attachThread(GLRenderThread t) {
        this.thread = t;
    }

    // called from the wallpaper engine when visibility returns, so ui changes apply.
    void requestReload() {
        needsReload = true;
        if (thread != null) thread.requestRender();
    }

    // called from the engine on home-screen swipe; only redraw when parallax is on.
    void setXOffset(float x) {
        if (x == xOffset) return;
        xOffset = x;
        if (cfg.parallaxEnabled && thread != null) thread.requestRender();
    }

    @Override
    public void onSurfaceCreated() {
        posBuffer = toBuffer(POSITIONS);
        texBuffer = toBuffer(TEXCOORDS);
        prog2d = new Prog(VERTEX_SRC, FRAG_2D);
        progOes = new Prog(VERTEX_SRC, FRAG_OES);
        GLES20.glClearColor(0f, 0f, 0f, 1f);
        GLES20.glDisable(GLES20.GL_DEPTH_TEST);
    }

    @Override
    public void onSurfaceChanged(int width, int height) {
        screenW = width;
        screenH = height;
        // re-decode images at the new resolution
        needsReload = true;
    }

    @Override
    public long onDrawFrame() {
        if (needsReload && screenW > 0 && screenH > 0) {
            applyConfig();
            needsReload = false;
        }

        GLES20.glViewport(0, 0, screenW, screenH);
        GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT);

        if ("images".equals(cfg.mode)) {
            return drawImages();
        }
        return drawVideo();
    }

    @Override
    public void onSurfaceDestroyed() {
        releaseVideo();
        releaseImages();
        if (prog2d != null) prog2d.delete();
        if (progOes != null) progOes.delete();
    }

    // ---- video ----

    private long drawVideo() {
        if (!videoReady || oesTexId == 0) {
            return Long.MAX_VALUE; // nothing to draw yet; frame listener will wake us
        }
        synchronized (frameLock) {
            if (frameAvailable) {
                videoSurfaceTexture.updateTexImage();
                videoSurfaceTexture.getTransformMatrix(videoMatrix);
                frameAvailable = false;
            }
        }
        if (videoW > 0 && videoH > 0) {
            float[] s = computeScale(videoW, videoH, cfg.videoScale, cfg.videoOffsetX, cfg.videoOffsetY);
            drawQuad(progOes, GLES11Ext.GL_TEXTURE_EXTERNAL_OES, oesTexId, videoMatrix, s, 1f);
        }
        // demand-driven: redraw only when a new decoded frame arrives
        return Long.MAX_VALUE;
    }

    private void setupVideo() {
        if (cfg.videoPath == null) return;
        oesTexId = createOesTexture();
        videoSurfaceTexture = new SurfaceTexture(oesTexId);
        videoSurfaceTexture.setOnFrameAvailableListener(st -> {
            synchronized (frameLock) {
                frameAvailable = true;
            }
            if (thread != null) thread.requestRender();
        });
        videoSurface = new Surface(videoSurfaceTexture);
        try {
            mediaPlayer = new MediaPlayer();
            mediaPlayer.setSurface(videoSurface);
            mediaPlayer.setDataSource(cfg.videoPath);
            mediaPlayer.setLooping(true);
            mediaPlayer.setVolume(0f, 0f);
            mediaPlayer.setOnVideoSizeChangedListener((mp, w, h) -> {
                if (w > 0 && h > 0) {
                    videoW = w;
                    videoH = h;
                }
            });
            mediaPlayer.setOnPreparedListener(mp -> {
                if (mp.getVideoWidth() > 0) {
                    videoW = mp.getVideoWidth();
                    videoH = mp.getVideoHeight();
                }
                try {
                    mp.start();
                } catch (Exception ignored) {
                }
                videoReady = true;
            });
            mediaPlayer.prepareAsync();
        } catch (Exception e) {
            Log.e(GLUtil.TAG, "video setup failed for " + cfg.videoPath, e);
            releaseVideo();
        }
    }

    private void releaseVideo() {
        videoReady = false;
        if (mediaPlayer != null) {
            try {
                mediaPlayer.stop();
            } catch (Exception ignored) {
            }
            try {
                mediaPlayer.release();
            } catch (Exception ignored) {
            }
            mediaPlayer = null;
        }
        if (videoSurface != null) {
            videoSurface.release();
            videoSurface = null;
        }
        if (videoSurfaceTexture != null) {
            videoSurfaceTexture.release();
            videoSurfaceTexture = null;
        }
        if (oesTexId != 0) {
            GLES20.glDeleteTextures(1, new int[]{oesTexId}, 0);
            oesTexId = 0;
        }
        videoW = 0;
        videoH = 0;
    }

    // ---- images ----

    private long drawImages() {
        if (cfg.imagePaths.isEmpty() || texA == 0) {
            return Long.MAX_VALUE;
        }
        long now = SystemClock.uptimeMillis();
        int count = cfg.imagePaths.size();

        float[] sa = computeScale(texAw, texAh, cfg.imageScale, cfg.imageOffsetX, cfg.imageOffsetY);
        drawQuad(prog2d, GLES20.GL_TEXTURE_2D, texA, identityMatrix, sa, 1f);

        if (count > 1) {
            if (!transitioning && now - lastShownAt >= cfg.imageDurationMs) {
                nextIndex = pickNext(count);
                texB = loadTexture(cfg.imagePaths.get(nextIndex));
                if (texB != 0) {
                    texBw = lastLoadedW;
                    texBh = lastLoadedH;
                    transitioning = true;
                    transitionStart = now;
                } else {
                    // decode failed; skip ahead and reset the timer
                    imageIndex = nextIndex;
                    lastShownAt = now;
                }
            }

            if (transitioning) {
                float t = (now - transitionStart) / (float) Math.max(1, cfg.imageTransitionMs);
                if (t >= 1f) {
                    // promote b to a
                    deleteTexture(texA);
                    texA = texB;
                    texAw = texBw;
                    texAh = texBh;
                    texB = 0;
                    imageIndex = nextIndex;
                    transitioning = false;
                    lastShownAt = now;
                } else {
                    float[] sb = computeScale(texBw, texBh, cfg.imageScale, cfg.imageOffsetX, cfg.imageOffsetY);
                    GLES20.glEnable(GLES20.GL_BLEND);
                    GLES20.glBlendFunc(GLES20.GL_SRC_ALPHA, GLES20.GL_ONE_MINUS_SRC_ALPHA);
                    drawQuad(prog2d, GLES20.GL_TEXTURE_2D, texB, identityMatrix, sb, t);
                    GLES20.glDisable(GLES20.GL_BLEND);
                }
            }
        }

        if (transitioning) {
            return 0L; // animate the cross-fade
        }
        if (count > 1) {
            long remain = cfg.imageDurationMs - (now - lastShownAt);
            return Math.max(16L, remain);
        }
        return Long.MAX_VALUE; // single static image
    }

    private int pickNext(int count) {
        if ("random".equals(cfg.imageOrder)) {
            if (count <= 1) return 0;
            int n;
            do {
                n = random.nextInt(count);
            } while (n == imageIndex);
            return n;
        }
        return (imageIndex + 1) % count;
    }

    private void setupImages() {
        if (cfg.imagePaths.isEmpty()) return;
        imageIndex = 0;
        texA = loadTexture(cfg.imagePaths.get(0));
        texAw = lastLoadedW;
        texAh = lastLoadedH;
        transitioning = false;
        lastShownAt = SystemClock.uptimeMillis();
    }

    private void releaseImages() {
        deleteTexture(texA);
        deleteTexture(texB);
        texA = 0;
        texB = 0;
        transitioning = false;
    }

    // ---- config apply ----

    private void applyConfig() {
        releaseVideo();
        releaseImages();
        cfg = WpConfig.load(context);
        if ("images".equals(cfg.mode)) {
            setupImages();
        } else {
            setupVideo();
        }
    }

    // ---- gl helpers ----

    private int lastLoadedW, lastLoadedH;

    private int loadTexture(String path) {
        BitmapFactory.Options bounds = new BitmapFactory.Options();
        bounds.inJustDecodeBounds = true;
        BitmapFactory.decodeFile(path, bounds);
        if (bounds.outWidth <= 0 || bounds.outHeight <= 0) {
            Log.e(GLUtil.TAG, "image decode bounds failed: " + path);
            return 0;
        }
        BitmapFactory.Options opts = new BitmapFactory.Options();
        opts.inSampleSize = computeSampleSize(bounds.outWidth, bounds.outHeight);
        Bitmap bmp = BitmapFactory.decodeFile(path, opts);
        if (bmp == null) {
            Log.e(GLUtil.TAG, "image decode failed: " + path);
            return 0;
        }
        int[] ids = new int[1];
        GLES20.glGenTextures(1, ids, 0);
        int tex = ids[0];
        GLES20.glBindTexture(GLES20.GL_TEXTURE_2D, tex);
        GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_MIN_FILTER, GLES20.GL_LINEAR);
        GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_MAG_FILTER, GLES20.GL_LINEAR);
        GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_WRAP_S, GLES20.GL_CLAMP_TO_EDGE);
        GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_WRAP_T, GLES20.GL_CLAMP_TO_EDGE);
        GLUtils.texImage2D(GLES20.GL_TEXTURE_2D, 0, bmp, 0);
        lastLoadedW = bmp.getWidth();
        lastLoadedH = bmp.getHeight();
        bmp.recycle();
        return tex;
    }

    private int computeSampleSize(int w, int h) {
        int sample = 1;
        int maxW = Math.max(1, screenW);
        int maxH = Math.max(1, screenH);
        // downsample while either dimension still clearly exceeds the screen, so a
        // large photo does not decode into an oversized bitmap and risk an oom
        while (w / (sample * 2) >= maxW || h / (sample * 2) >= maxH) {
            sample *= 2;
        }
        return sample;
    }

    private void deleteTexture(int tex) {
        if (tex != 0) {
            GLES20.glDeleteTextures(1, new int[]{tex}, 0);
        }
    }

    private int createOesTexture() {
        int[] ids = new int[1];
        GLES20.glGenTextures(1, ids, 0);
        int tex = ids[0];
        GLES20.glBindTexture(GLES11Ext.GL_TEXTURE_EXTERNAL_OES, tex);
        GLES20.glTexParameteri(GLES11Ext.GL_TEXTURE_EXTERNAL_OES, GLES20.GL_TEXTURE_MIN_FILTER, GLES20.GL_LINEAR);
        GLES20.glTexParameteri(GLES11Ext.GL_TEXTURE_EXTERNAL_OES, GLES20.GL_TEXTURE_MAG_FILTER, GLES20.GL_LINEAR);
        GLES20.glTexParameteri(GLES11Ext.GL_TEXTURE_EXTERNAL_OES, GLES20.GL_TEXTURE_WRAP_S, GLES20.GL_CLAMP_TO_EDGE);
        GLES20.glTexParameteri(GLES11Ext.GL_TEXTURE_EXTERNAL_OES, GLES20.GL_TEXTURE_WRAP_T, GLES20.GL_CLAMP_TO_EDGE);
        return tex;
    }

    // returns {uvScaleX, uvScaleY, uvOffsetX, uvOffsetY, posScaleX, posScaleY}
    private float[] computeScale(int contentW, int contentH, String scaleMode, float offX, float offY) {
        float r = ((float) contentW / contentH) / ((float) screenW / screenH);
        float uvScaleX = 1f, uvScaleY = 1f, uvOffX = 0f, uvOffY = 0f, posScaleX = 1f, posScaleY = 1f;
        if ("fit".equals(scaleMode)) {
            posScaleX = Math.min(1f, r);
            posScaleY = Math.min(1f, 1f / r);
        } else { // cover
            uvScaleX = Math.min(1f, 1f / r);
            uvScaleY = Math.min(1f, r);
            if (cfg.parallaxEnabled) {
                // zoom in uniformly so there is headroom to pan into on swipe
                float room = clamp(cfg.parallaxAmount, 0f, 0.9f);
                uvScaleX *= (1f - room);
                uvScaleY *= (1f - room);
            }
            float maxPanX = (1f - uvScaleX) * 0.5f;
            float maxPanY = (1f - uvScaleY) * 0.5f;
            uvOffX = clamp(offX, -1f, 1f) * maxPanX;
            uvOffY = clamp(offY, -1f, 1f) * maxPanY;
            if (cfg.parallaxEnabled) {
                // pan horizontally with the swipe position across the added headroom
                float room = clamp(cfg.parallaxAmount, 0f, 0.9f);
                uvOffX += (xOffset - 0.5f) * room;
            }
        }
        return new float[]{uvScaleX, uvScaleY, uvOffX, uvOffY, posScaleX, posScaleY};
    }

    private static float clamp(float v, float lo, float hi) {
        return Math.max(lo, Math.min(hi, v));
    }

    private void drawQuad(Prog p, int target, int texId, float[] texMatrix, float[] s, float alpha) {
        if (p == null || p.id == 0) return;
        GLES20.glUseProgram(p.id);

        posBuffer.position(0);
        GLES20.glVertexAttribPointer(p.aPosition, 2, GLES20.GL_FLOAT, false, 0, posBuffer);
        GLES20.glEnableVertexAttribArray(p.aPosition);
        texBuffer.position(0);
        GLES20.glVertexAttribPointer(p.aTexCoord, 2, GLES20.GL_FLOAT, false, 0, texBuffer);
        GLES20.glEnableVertexAttribArray(p.aTexCoord);

        GLES20.glUniformMatrix4fv(p.uTexMatrix, 1, false, texMatrix, 0);
        GLES20.glUniform2f(p.uUvScale, s[0], s[1]);
        GLES20.glUniform2f(p.uUvOffset, s[2], s[3]);
        GLES20.glUniform2f(p.uPosScale, s[4], s[5]);
        GLES20.glUniform1f(p.uAlpha, alpha);

        int filter = filterIndex(cfg.filterType);
        GLES20.glUniform1i(p.uFilter, filter);
        color(p.uColorA, cfg.duotoneShadow);
        color(p.uColorB, cfg.duotoneHighlight);
        color(p.uColorC, cfg.gradientMid);
        GLES20.glUniform1f(p.uScanCount, cfg.scanCount);
        GLES20.glUniform1f(p.uScanStrength, cfg.scanStrength);
        GLES20.glUniform1f(p.uCrtMask, cfg.crtMask);
        GLES20.glUniform1f(p.uAmount, "grayscale".equals(cfg.filterType) ? cfg.grayAmount : cfg.sepiaAmount);
        GLES20.glUniform1f(p.uLevels, cfg.posterizeLevels);
        GLES20.glUniform1f(p.uPixelSize, cfg.pixelSize);
        GLES20.glUniform1f(p.uHalftone, cfg.halftoneScale);
        GLES20.glUniform1f(p.uVignette, cfg.vignetteStrength);
        GLES20.glUniform1f(p.uVignetteRadius, cfg.vignetteRadius);
        GLES20.glUniform1f(p.uChromatic, cfg.chromaticAmount);
        GLES20.glUniform2f(p.uResolution, screenW, screenH);

        GLES20.glActiveTexture(GLES20.GL_TEXTURE0);
        GLES20.glBindTexture(target, texId);
        GLES20.glUniform1i(p.uTexture, 0);

        GLES20.glDrawArrays(GLES20.GL_TRIANGLE_STRIP, 0, 4);

        GLES20.glDisableVertexAttribArray(p.aPosition);
        GLES20.glDisableVertexAttribArray(p.aTexCoord);
    }

    private static void color(int loc, int[] rgb) {
        GLES20.glUniform3f(loc, rgb[0] / 255f, rgb[1] / 255f, rgb[2] / 255f);
    }

    // string -> shader filter index; must match FilterGlsl and www/preview.js
    private static int filterIndex(String type) {
        switch (type) {
            case "duotone": return 1;
            case "scanlines": return 2;
            case "grayscale": return 3;
            case "sepia": return 4;
            case "gradientmap": return 5;
            case "posterize": return 6;
            case "pixelate": return 7;
            case "halftone": return 8;
            case "vignette": return 9;
            case "chromatic": return 10;
            case "crt": return 11;
            case "invert": return 12;
            default: return 0;
        }
    }

    private static FloatBuffer toBuffer(float[] data) {
        FloatBuffer fb = ByteBuffer.allocateDirect(data.length * 4)
                .order(ByteOrder.nativeOrder())
                .asFloatBuffer();
        fb.put(data).position(0);
        return fb;
    }

    // wraps a linked program and its attribute/uniform locations.
    private static final class Prog {
        final int id;
        final int aPosition, aTexCoord;
        final int uTexMatrix, uUvScale, uUvOffset, uPosScale;
        final int uFilter, uColorA, uColorB, uColorC, uScanCount, uScanStrength, uCrtMask;
        final int uAmount, uLevels, uPixelSize, uHalftone, uVignette, uVignetteRadius, uChromatic;
        final int uResolution, uAlpha, uTexture;

        Prog(String vs, String fs) {
            id = GLUtil.compileProgram(vs, fs);
            aPosition = GLES20.glGetAttribLocation(id, "aPosition");
            aTexCoord = GLES20.glGetAttribLocation(id, "aTexCoord");
            uTexMatrix = GLES20.glGetUniformLocation(id, "uTexMatrix");
            uUvScale = GLES20.glGetUniformLocation(id, "uUvScale");
            uUvOffset = GLES20.glGetUniformLocation(id, "uUvOffset");
            uPosScale = GLES20.glGetUniformLocation(id, "uPosScale");
            uFilter = GLES20.glGetUniformLocation(id, "uFilter");
            uColorA = GLES20.glGetUniformLocation(id, "uColorA");
            uColorB = GLES20.glGetUniformLocation(id, "uColorB");
            uColorC = GLES20.glGetUniformLocation(id, "uColorC");
            uScanCount = GLES20.glGetUniformLocation(id, "uScanCount");
            uScanStrength = GLES20.glGetUniformLocation(id, "uScanStrength");
            uCrtMask = GLES20.glGetUniformLocation(id, "uCrtMask");
            uAmount = GLES20.glGetUniformLocation(id, "uAmount");
            uLevels = GLES20.glGetUniformLocation(id, "uLevels");
            uPixelSize = GLES20.glGetUniformLocation(id, "uPixelSize");
            uHalftone = GLES20.glGetUniformLocation(id, "uHalftone");
            uVignette = GLES20.glGetUniformLocation(id, "uVignette");
            uVignetteRadius = GLES20.glGetUniformLocation(id, "uVignetteRadius");
            uChromatic = GLES20.glGetUniformLocation(id, "uChromatic");
            uResolution = GLES20.glGetUniformLocation(id, "uResolution");
            uAlpha = GLES20.glGetUniformLocation(id, "uAlpha");
            uTexture = GLES20.glGetUniformLocation(id, "uTexture");
        }

        void delete() {
            if (id != 0) GLES20.glDeleteProgram(id);
        }
    }
}
