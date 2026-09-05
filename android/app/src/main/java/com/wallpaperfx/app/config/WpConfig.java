package com.wallpaperfx.app.config;

import android.content.Context;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.RandomAccessFile;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

// shared configuration model. the capacitor plugin (activity process) writes this
// file and the wallpaper service reads it. plain json, no external deps.
public class WpConfig {

    public static final String FILE_NAME = "wallpaperfx_config.json";

    // mode: "video" | "images"
    public String mode = "video";

    // video
    public String videoPath = null;
    public String videoScale = "cover"; // cover | fit
    public float videoOffsetX = 0f;     // -1..1, pan within cropped area (cover only)
    public float videoOffsetY = 0f;
    public float videoSpeed = 1.0f;     // playback rate, 0.25..3

    // images: ordered list of items, each individually enable-able
    public List<ImageItem> images = new ArrayList<>();
    // loop | loop-random | single (legacy: normal -> loop, random -> loop-random)
    public String imageOrder = "loop";
    public int imageDurationMs = 8000;
    public int imageTransitionMs = 800;
    public String imageScale = "cover"; // cover | fit
    public float imageOffsetX = 0f;
    public float imageOffsetY = 0f;

    // mirror the source content on the x / y axis (applies to video and images)
    public boolean flipX = false;
    public boolean flipY = false;

    // ordered filter chain, applied top to bottom in separate gl passes
    public List<FilterEntry> filters = new ArrayList<>();

    // parallax: shift the wallpaper as the user swipes between home screens.
    // amount is the fraction of headroom to zoom in / pan across (cover mode only).
    public boolean parallaxEnabled = false;
    public float parallaxAmount = 0.15f;

    // motion: time-based background movement (cover mode only).
    // type: none | zoom | breathe | drift | sway | shake
    public String motionType = "none";
    public float motionAmount = 0.5f;
    public float motionSpeed = 0.5f;

    // one image in the slideshow, individually enable-able and reorderable.
    public static class ImageItem {
        public String path;
        public boolean enabled = true;

        public ImageItem(String path) {
            this.path = path;
        }
    }

    // paths of the enabled images, in order, for the renderer to cycle through.
    public List<String> enabledImagePaths() {
        List<String> out = new ArrayList<>();
        for (ImageItem it : images) {
            if (it.enabled && it.path != null && !it.path.isEmpty()) out.add(it.path);
        }
        return out;
    }

    // one filter in the chain. carries its own params so a type can appear
    // multiple times with different settings.
    // type: none | duotone | grayscale | sepia | gradientmap | posterize |
    //       pixelate | halftone | scanlines | crt | vignette | chromatic |
    //       invert | filmgrain | glitch | vhs | bloom | blur | fisheye |
    //       grain | noise | duotone2
    public static class FilterEntry {
        public String type = "none";
        public boolean enabled = true;
        public int[] colorA = {18, 20, 42};      // duotone/gradient dark, halftone ink
        public int[] colorB = {240, 186, 72};    // duotone/gradient light, halftone paper
        public int[] colorC = {120, 84, 168};    // gradientmap midtone, duotone2 second highlight
        public float scanCount = 320f;
        public float scanStrength = 0.35f;
        public float crtMask = 0.30f;
        public float amount = 1.0f;              // grayscale/sepia blend
        public float levels = 6f;                // posterize
        public float pixelSize = 12f;
        public float halftone = 90f;
        public float vignette = 0.6f;
        public float vignetteRadius = 0.6f;
        public int[] vignetteColor = {0, 0, 0};  // vignette tint (default black)
        public float chromatic = 0.006f;
        public float grain = 0.15f;
        public float glitch = 0.5f;
        public float vhs = 0.6f;
        public float bloom = 0.6f;               // bloom intensity
        public float bloomThreshold = 0.7f;
        public float blurRadius = 2.0f;          // blur tap spacing in px
        public float fisheye = 0.5f;             // -1..1 lens distortion
        public float noise = 0.15f;
        public float cycleSec = 6.0f;            // duotone2 color-cycle period

        public boolean isAnimated() {
            return "filmgrain".equals(type) || "glitch".equals(type)
                    || "vhs".equals(type) || "duotone2".equals(type);
        }

        JSONObject toJson() throws Exception {
            JSONObject o = new JSONObject();
            o.put("type", type);
            o.put("enabled", enabled);
            o.put("colorA", intArray(colorA));
            o.put("colorB", intArray(colorB));
            o.put("colorC", intArray(colorC));
            o.put("scanCount", scanCount);
            o.put("scanStrength", scanStrength);
            o.put("crtMask", crtMask);
            o.put("amount", amount);
            o.put("levels", levels);
            o.put("pixelSize", pixelSize);
            o.put("halftone", halftone);
            o.put("vignette", vignette);
            o.put("vignetteRadius", vignetteRadius);
            o.put("vignetteColor", intArray(vignetteColor));
            o.put("chromatic", chromatic);
            o.put("grain", grain);
            o.put("glitch", glitch);
            o.put("vhs", vhs);
            o.put("bloom", bloom);
            o.put("bloomThreshold", bloomThreshold);
            o.put("blurRadius", blurRadius);
            o.put("fisheye", fisheye);
            o.put("noise", noise);
            o.put("cycleSec", cycleSec);
            return o;
        }

        static FilterEntry fromJson(JSONObject o) {
            FilterEntry f = new FilterEntry();
            f.type = o.optString("type", f.type);
            f.enabled = o.optBoolean("enabled", true);
            f.colorA = readColor(o.optJSONArray("colorA"), f.colorA);
            f.colorB = readColor(o.optJSONArray("colorB"), f.colorB);
            f.colorC = readColor(o.optJSONArray("colorC"), f.colorC);
            f.scanCount = (float) o.optDouble("scanCount", f.scanCount);
            f.scanStrength = (float) o.optDouble("scanStrength", f.scanStrength);
            f.crtMask = (float) o.optDouble("crtMask", f.crtMask);
            f.amount = (float) o.optDouble("amount", f.amount);
            f.levels = (float) o.optDouble("levels", f.levels);
            f.pixelSize = (float) o.optDouble("pixelSize", f.pixelSize);
            f.halftone = (float) o.optDouble("halftone", f.halftone);
            f.vignette = (float) o.optDouble("vignette", f.vignette);
            f.vignetteRadius = (float) o.optDouble("vignetteRadius", f.vignetteRadius);
            f.vignetteColor = readColor(o.optJSONArray("vignetteColor"), f.vignetteColor);
            f.chromatic = (float) o.optDouble("chromatic", f.chromatic);
            f.grain = (float) o.optDouble("grain", f.grain);
            f.glitch = (float) o.optDouble("glitch", f.glitch);
            f.vhs = (float) o.optDouble("vhs", f.vhs);
            f.bloom = (float) o.optDouble("bloom", f.bloom);
            f.bloomThreshold = (float) o.optDouble("bloomThreshold", f.bloomThreshold);
            f.blurRadius = (float) o.optDouble("blurRadius", f.blurRadius);
            f.fisheye = (float) o.optDouble("fisheye", f.fisheye);
            f.noise = (float) o.optDouble("noise", f.noise);
            f.cycleSec = (float) o.optDouble("cycleSec", f.cycleSec);
            return f;
        }
    }

    public static File file(Context ctx) {
        return new File(ctx.getFilesDir(), FILE_NAME);
    }

    public static WpConfig load(Context ctx) {
        WpConfig cfg = new WpConfig();
        File f = file(ctx);
        if (!f.exists()) {
            return cfg;
        }
        try {
            RandomAccessFile raf = new RandomAccessFile(f, "r");
            byte[] buf = new byte[(int) raf.length()];
            raf.readFully(buf);
            raf.close();
            cfg.fromJson(new JSONObject(new String(buf, StandardCharsets.UTF_8)));
        } catch (Exception e) {
            // on any read/parse error fall back to defaults so the wallpaper still renders
        }
        return cfg;
    }

    public void save(Context ctx) throws Exception {
        byte[] out = toJson().toString().getBytes(StandardCharsets.UTF_8);
        FileOutputStream fos = new FileOutputStream(file(ctx));
        fos.write(out);
        fos.flush();
        fos.close();
    }

    public JSONObject toJson() throws Exception {
        JSONObject o = new JSONObject();
        o.put("mode", mode);

        o.put("videoPath", videoPath == null ? JSONObject.NULL : videoPath);
        o.put("videoScale", videoScale);
        o.put("videoOffsetX", videoOffsetX);
        o.put("videoOffsetY", videoOffsetY);
        o.put("videoSpeed", videoSpeed);

        JSONArray imgs = new JSONArray();
        for (ImageItem it : images) {
            JSONObject io = new JSONObject();
            io.put("path", it.path);
            io.put("enabled", it.enabled);
            imgs.put(io);
        }
        o.put("images", imgs);
        o.put("imageOrder", imageOrder);
        o.put("imageDurationMs", imageDurationMs);
        o.put("imageTransitionMs", imageTransitionMs);
        o.put("imageScale", imageScale);
        o.put("imageOffsetX", imageOffsetX);
        o.put("imageOffsetY", imageOffsetY);

        o.put("flipX", flipX);
        o.put("flipY", flipY);

        JSONArray fs = new JSONArray();
        for (FilterEntry f : filters) fs.put(f.toJson());
        o.put("filters", fs);

        o.put("parallaxEnabled", parallaxEnabled);
        o.put("parallaxAmount", parallaxAmount);
        o.put("motionType", motionType);
        o.put("motionAmount", motionAmount);
        o.put("motionSpeed", motionSpeed);
        return o;
    }

    public void fromJson(JSONObject o) {
        mode = o.optString("mode", mode);

        videoPath = o.isNull("videoPath") ? null : o.optString("videoPath", null);
        videoScale = o.optString("videoScale", videoScale);
        videoOffsetX = (float) o.optDouble("videoOffsetX", videoOffsetX);
        videoOffsetY = (float) o.optDouble("videoOffsetY", videoOffsetY);
        videoSpeed = (float) o.optDouble("videoSpeed", videoSpeed);

        JSONArray imgs = o.optJSONArray("images");
        if (imgs != null) {
            images = new ArrayList<>();
            for (int i = 0; i < imgs.length(); i++) {
                JSONObject io = imgs.optJSONObject(i);
                if (io == null) continue;
                String p = io.optString("path", null);
                if (p == null || p.isEmpty()) continue;
                ImageItem it = new ImageItem(p);
                it.enabled = io.optBoolean("enabled", true);
                images.add(it);
            }
        } else {
            // migrate the pre-tiles config (imagePaths: array of strings)
            JSONArray legacy = o.optJSONArray("imagePaths");
            if (legacy != null) {
                images = new ArrayList<>();
                for (int i = 0; i < legacy.length(); i++) {
                    String p = legacy.optString(i, null);
                    if (p != null && !p.isEmpty()) images.add(new ImageItem(p));
                }
            }
        }
        imageOrder = o.optString("imageOrder", imageOrder);
        imageDurationMs = o.optInt("imageDurationMs", imageDurationMs);
        imageTransitionMs = o.optInt("imageTransitionMs", imageTransitionMs);
        imageScale = o.optString("imageScale", imageScale);
        imageOffsetX = (float) o.optDouble("imageOffsetX", imageOffsetX);
        imageOffsetY = (float) o.optDouble("imageOffsetY", imageOffsetY);

        flipX = o.optBoolean("flipX", flipX);
        flipY = o.optBoolean("flipY", flipY);

        JSONArray fs = o.optJSONArray("filters");
        if (fs != null) {
            filters = new ArrayList<>();
            for (int i = 0; i < fs.length(); i++) {
                JSONObject fo = fs.optJSONObject(i);
                if (fo != null) filters.add(FilterEntry.fromJson(fo));
            }
        } else {
            migrateLegacyFilter(o);
        }

        parallaxEnabled = o.optBoolean("parallaxEnabled", parallaxEnabled);
        parallaxAmount = (float) o.optDouble("parallaxAmount", parallaxAmount);
        motionType = o.optString("motionType", motionType);
        motionAmount = (float) o.optDouble("motionAmount", motionAmount);
        motionSpeed = (float) o.optDouble("motionSpeed", motionSpeed);
    }

    // reads a pre-chain config (single filterType + flat params) into one entry
    private void migrateLegacyFilter(JSONObject o) {
        String type = o.optString("filterType", "none");
        if ("none".equals(type)) return;
        FilterEntry f = new FilterEntry();
        f.type = type;
        f.colorA = readColor(o.optJSONArray("duotoneShadow"), f.colorA);
        f.colorB = readColor(o.optJSONArray("duotoneHighlight"), f.colorB);
        f.colorC = readColor(o.optJSONArray("gradientMid"), f.colorC);
        f.scanCount = (float) o.optDouble("scanCount", f.scanCount);
        f.scanStrength = (float) o.optDouble("scanStrength", f.scanStrength);
        f.crtMask = (float) o.optDouble("crtMask", f.crtMask);
        f.amount = (float) o.optDouble("grayscale".equals(type) ? "grayAmount" : "sepiaAmount", f.amount);
        f.levels = (float) o.optDouble("posterizeLevels", f.levels);
        f.pixelSize = (float) o.optDouble("pixelSize", f.pixelSize);
        f.halftone = (float) o.optDouble("halftoneScale", f.halftone);
        f.vignette = (float) o.optDouble("vignetteStrength", f.vignette);
        f.vignetteRadius = (float) o.optDouble("vignetteRadius", f.vignetteRadius);
        f.chromatic = (float) o.optDouble("chromaticAmount", f.chromatic);
        f.grain = (float) o.optDouble("grainAmount", f.grain);
        f.glitch = (float) o.optDouble("glitchAmount", f.glitch);
        f.vhs = (float) o.optDouble("vhsAmount", f.vhs);
        filters.add(f);
    }

    private static JSONArray intArray(int[] v) {
        JSONArray a = new JSONArray();
        for (int x : v) a.put(x);
        return a;
    }

    private static int[] readColor(JSONArray a, int[] fallback) {
        if (a == null || a.length() < 3) return fallback;
        return new int[]{a.optInt(0, fallback[0]), a.optInt(1, fallback[1]), a.optInt(2, fallback[2])};
    }
}
