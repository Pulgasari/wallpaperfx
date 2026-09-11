package com.launcher.app.bridge;

import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

// bridges the android packagemanager to the web ui: enumerate launchable apps
// and start them by package name. the whole home-screen is the webview; this
// plugin is the only native surface the launcher needs.
@CapacitorPlugin(name = "Launcher")
public class LauncherPlugin extends Plugin {

    // return every activity that answers action.MAIN + category.LAUNCHER,
    // minus this launcher itself, as {packageName, label} sorted by label.
    // the manifest <queries> block makes these visible on api 30+.
    @PluginMethod
    public void getApps(PluginCall call) {
        PackageManager pm = getContext().getPackageManager();
        Intent main = new Intent(Intent.ACTION_MAIN, null);
        main.addCategory(Intent.CATEGORY_LAUNCHER);
        List<ResolveInfo> infos = pm.queryIntentActivities(main, 0);

        String self = getContext().getPackageName();
        List<JSObject> apps = new ArrayList<>();
        for (ResolveInfo ri : infos) {
            String pkg = ri.activityInfo.packageName;
            if (pkg.equals(self)) continue; // never list ourselves
            CharSequence label = ri.loadLabel(pm);
            JSObject o = new JSObject();
            o.put("packageName", pkg);
            o.put("label", label == null ? pkg : label.toString());
            apps.add(o);
        }
        // stable, case-insensitive label order so the grid does not reshuffle
        // between reads (queryIntentActivities order is not guaranteed).
        Collections.sort(apps, (a, b) ->
            a.getString("label", "").compareToIgnoreCase(b.getString("label", "")));

        JSArray arr = new JSArray();
        for (JSObject o : apps) arr.put(o);
        JSObject ret = new JSObject();
        ret.put("apps", arr);
        call.resolve(ret);
    }

    // start an app by its package name via its declared launch intent.
    @PluginMethod
    public void launchApp(PluginCall call) {
        String pkg = call.getString("packageName");
        if (pkg == null || pkg.isEmpty()) {
            call.reject("packageName is required");
            return;
        }
        PackageManager pm = getContext().getPackageManager();
        Intent launch = pm.getLaunchIntentForPackage(pkg);
        if (launch == null) {
            call.reject("no launch intent for " + pkg);
            return;
        }
        launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(launch);
        call.resolve();
    }

    // toggle FLAG_SHOW_WALLPAPER so a translucent page background lets the system
    // wallpaper show behind the launcher (the window + webview are transparent, set
    // in MainActivity). used when the ui's background opacity is < 1.
    @PluginMethod
    public void setShowWallpaper(PluginCall call) {
        final boolean show = call.getBoolean("show", false);
        getActivity().runOnUiThread(() -> {
            android.view.Window w = getActivity().getWindow();
            if (show) w.addFlags(android.view.WindowManager.LayoutParams.FLAG_SHOW_WALLPAPER);
            else w.clearFlags(android.view.WindowManager.LayoutParams.FLAG_SHOW_WALLPAPER);
        });
        call.resolve();
    }
}
