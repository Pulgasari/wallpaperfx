package com.wallpaperfx.app.bridge;

import android.app.Activity;
import android.app.WallpaperManager;
import android.content.ComponentName;
import android.content.ContentResolver;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.provider.OpenableColumns;
import android.util.Log;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.wallpaperfx.app.config.WpConfig;
import com.wallpaperfx.app.wallpaper.WallpaperFxService;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.List;

// bridges the web ui to the native wallpaper. picks media into app storage, reads
// and writes the shared config json, and launches the live-wallpaper picker.
@CapacitorPlugin(name = "WallpaperFx")
public class WallpaperFxPlugin extends Plugin {

    private static final String MEDIA_DIR = "media";

    @PluginMethod
    public void getConfig(PluginCall call) {
        WpConfig cfg = WpConfig.load(getContext());
        try {
            call.resolve(new JSObject(cfg.toJson().toString()));
        } catch (Exception e) {
            call.reject("failed to read config: " + e.getMessage());
        }
    }

    @PluginMethod
    public void setConfig(PluginCall call) {
        JSObject data = call.getObject("config");
        if (data == null) {
            call.reject("missing config object");
            return;
        }
        WpConfig cfg = new WpConfig();
        cfg.fromJson(data);
        try {
            cfg.save(getContext());
            call.resolve();
        } catch (Exception e) {
            call.reject("failed to save config: " + e.getMessage());
        }
    }

    @PluginMethod
    public void pickMedia(PluginCall call) {
        String type = call.getString("type", "video");
        boolean multiple = "image".equals(type);
        String mime = "image".equals(type) ? "image/*" : "video/*";

        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType(mime);
        intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, multiple);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

        startActivityForResult(call, intent, "pickMediaResult");
    }

    @ActivityCallback
    private void pickMediaResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null) {
            call.reject("cancelled");
            return;
        }

        Intent data = result.getData();
        List<Uri> uris = new ArrayList<>();
        if (data.getClipData() != null) {
            int n = data.getClipData().getItemCount();
            for (int i = 0; i < n; i++) {
                uris.add(data.getClipData().getItemAt(i).getUri());
            }
        } else if (data.getData() != null) {
            uris.add(data.getData());
        }

        JSArray paths = new JSArray();
        for (Uri uri : uris) {
            String path = copyToStorage(uri);
            if (path != null) paths.put(path);
        }

        if (paths.length() == 0) {
            call.reject("no files copied");
            return;
        }
        JSObject ret = new JSObject();
        ret.put("paths", paths);
        call.resolve(ret);
    }

    @PluginMethod
    public void applyWallpaper(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("no activity");
            return;
        }
        ComponentName component = new ComponentName(getContext(), WallpaperFxService.class);
        try {
            Intent intent = new Intent(WallpaperManager.ACTION_CHANGE_LIVE_WALLPAPER);
            intent.putExtra(WallpaperManager.EXTRA_LIVE_WALLPAPER_COMPONENT, component);
            activity.startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            // some launchers do not honor the direct component extra; fall back to the chooser
            try {
                Intent chooser = new Intent(WallpaperManager.ACTION_LIVE_WALLPAPER_CHOOSER);
                activity.startActivity(chooser);
                call.resolve();
            } catch (Exception e2) {
                call.reject("no live wallpaper picker available: " + e2.getMessage());
            }
        }
    }

    private String copyToStorage(Uri uri) {
        ContentResolver resolver = getContext().getContentResolver();
        File dir = new File(getContext().getFilesDir(), MEDIA_DIR);
        if (!dir.exists() && !dir.mkdirs()) {
            Log.e("WallpaperFX", "could not create media dir");
            return null;
        }
        String name = System.currentTimeMillis() + "_" + sanitize(displayName(resolver, uri));
        File out = new File(dir, name);
        try (InputStream in = resolver.openInputStream(uri);
             OutputStream os = new FileOutputStream(out)) {
            if (in == null) return null;
            byte[] buf = new byte[64 * 1024];
            int r;
            while ((r = in.read(buf)) != -1) {
                os.write(buf, 0, r);
            }
            os.flush();
            return out.getAbsolutePath();
        } catch (Exception e) {
            Log.e("WallpaperFX", "copy failed for " + uri, e);
            return null;
        }
    }

    private String displayName(ContentResolver resolver, Uri uri) {
        String name = null;
        try (Cursor c = resolver.query(uri, new String[]{OpenableColumns.DISPLAY_NAME}, null, null, null)) {
            if (c != null && c.moveToFirst()) {
                int idx = c.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                if (idx >= 0) name = c.getString(idx);
            }
        } catch (Exception ignored) {
        }
        if (name == null || name.isEmpty()) name = "media";
        return name;
    }

    private String sanitize(String name) {
        return name.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
