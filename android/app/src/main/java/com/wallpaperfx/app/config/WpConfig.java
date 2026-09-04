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

    // images
    public List<String> imagePaths = new ArrayList<>();
    public String imageOrder = "normal"; // normal | random
    public int imageDurationMs = 8000;
    public int imageTransitionMs = 800;
    public String imageScale = "cover"; // cover | fit
    public float imageOffsetX = 0f;
    public float imageOffsetY = 0f;

    // filter: none | duotone | grayscale | sepia | gradientmap | posterize |
    //         pixelate | halftone | scanlines | crt | vignette | chromatic | invert
    public String filterType = "none";

    // shared color endpoints for duotone / gradientmap / halftone (rgb 0..255)
    public int[] duotoneShadow = {18, 20, 42};      // dark tones / halftone ink
    public int[] duotoneHighlight = {240, 186, 72};  // bright tones / halftone paper
    public int[] gradientMid = {120, 84, 168};       // gradientmap midtone

    // scanlines / crt
    public float scanCount = 320f;    // number of scanlines across the height
    public float scanStrength = 0.35f; // 0..1 darkening amount
    public float crtMask = 0.30f;     // 0..1 rgb aperture-mask strength

    // per-filter params
    public float grayAmount = 1.0f;      // grayscale blend 0..1
    public float sepiaAmount = 1.0f;     // sepia blend 0..1
    public float posterizeLevels = 6f;   // color steps per channel (2..16)
    public float pixelSize = 12f;        // pixelate block size in px
    public float halftoneScale = 90f;    // halftone dots across the height
    public float vignetteStrength = 0.6f; // 0..1 edge darkening
    public float vignetteRadius = 0.6f;   // 0..1 where the falloff starts
    public float chromaticAmount = 0.006f; // rgb split in uv units

    // animated filters (drive continuous rendering while active), 0..1 intensity
    public float grainAmount = 0.15f;
    public float glitchAmount = 0.5f;
    public float vhsAmount = 0.6f;

    // parallax: shift the wallpaper as the user swipes between home screens.
    // amount is the fraction of headroom to zoom in / pan across (cover mode only).
    public boolean parallaxEnabled = false;
    public float parallaxAmount = 0.15f;

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
        for (String p : imagePaths) imgs.put(p);
        o.put("imagePaths", imgs);
        o.put("imageOrder", imageOrder);
        o.put("imageDurationMs", imageDurationMs);
        o.put("imageTransitionMs", imageTransitionMs);
        o.put("imageScale", imageScale);
        o.put("imageOffsetX", imageOffsetX);
        o.put("imageOffsetY", imageOffsetY);

        o.put("filterType", filterType);
        o.put("duotoneShadow", intArray(duotoneShadow));
        o.put("duotoneHighlight", intArray(duotoneHighlight));
        o.put("gradientMid", intArray(gradientMid));
        o.put("scanCount", scanCount);
        o.put("scanStrength", scanStrength);
        o.put("crtMask", crtMask);
        o.put("grayAmount", grayAmount);
        o.put("sepiaAmount", sepiaAmount);
        o.put("posterizeLevels", posterizeLevels);
        o.put("pixelSize", pixelSize);
        o.put("halftoneScale", halftoneScale);
        o.put("vignetteStrength", vignetteStrength);
        o.put("vignetteRadius", vignetteRadius);
        o.put("chromaticAmount", chromaticAmount);
        o.put("grainAmount", grainAmount);
        o.put("glitchAmount", glitchAmount);
        o.put("vhsAmount", vhsAmount);

        o.put("parallaxEnabled", parallaxEnabled);
        o.put("parallaxAmount", parallaxAmount);
        return o;
    }

    public void fromJson(JSONObject o) {
        mode = o.optString("mode", mode);

        videoPath = o.isNull("videoPath") ? null : o.optString("videoPath", null);
        videoScale = o.optString("videoScale", videoScale);
        videoOffsetX = (float) o.optDouble("videoOffsetX", videoOffsetX);
        videoOffsetY = (float) o.optDouble("videoOffsetY", videoOffsetY);
        videoSpeed = (float) o.optDouble("videoSpeed", videoSpeed);

        JSONArray imgs = o.optJSONArray("imagePaths");
        if (imgs != null) {
            imagePaths = new ArrayList<>();
            for (int i = 0; i < imgs.length(); i++) {
                String p = imgs.optString(i, null);
                if (p != null && !p.isEmpty()) imagePaths.add(p);
            }
        }
        imageOrder = o.optString("imageOrder", imageOrder);
        imageDurationMs = o.optInt("imageDurationMs", imageDurationMs);
        imageTransitionMs = o.optInt("imageTransitionMs", imageTransitionMs);
        imageScale = o.optString("imageScale", imageScale);
        imageOffsetX = (float) o.optDouble("imageOffsetX", imageOffsetX);
        imageOffsetY = (float) o.optDouble("imageOffsetY", imageOffsetY);

        filterType = o.optString("filterType", filterType);
        duotoneShadow = readColor(o.optJSONArray("duotoneShadow"), duotoneShadow);
        duotoneHighlight = readColor(o.optJSONArray("duotoneHighlight"), duotoneHighlight);
        gradientMid = readColor(o.optJSONArray("gradientMid"), gradientMid);
        scanCount = (float) o.optDouble("scanCount", scanCount);
        scanStrength = (float) o.optDouble("scanStrength", scanStrength);
        crtMask = (float) o.optDouble("crtMask", crtMask);
        grayAmount = (float) o.optDouble("grayAmount", grayAmount);
        sepiaAmount = (float) o.optDouble("sepiaAmount", sepiaAmount);
        posterizeLevels = (float) o.optDouble("posterizeLevels", posterizeLevels);
        pixelSize = (float) o.optDouble("pixelSize", pixelSize);
        halftoneScale = (float) o.optDouble("halftoneScale", halftoneScale);
        vignetteStrength = (float) o.optDouble("vignetteStrength", vignetteStrength);
        vignetteRadius = (float) o.optDouble("vignetteRadius", vignetteRadius);
        chromaticAmount = (float) o.optDouble("chromaticAmount", chromaticAmount);
        grainAmount = (float) o.optDouble("grainAmount", grainAmount);
        glitchAmount = (float) o.optDouble("glitchAmount", glitchAmount);
        vhsAmount = (float) o.optDouble("vhsAmount", vhsAmount);

        parallaxEnabled = o.optBoolean("parallaxEnabled", parallaxEnabled);
        parallaxAmount = (float) o.optDouble("parallaxAmount", parallaxAmount);
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
