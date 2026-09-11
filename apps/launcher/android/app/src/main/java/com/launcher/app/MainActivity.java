package com.launcher.app;

import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.launcher.app.bridge.LauncherPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(LauncherPlugin.class);
        super.onCreate(savedInstanceState);
        // transparent webview + window so a translucent page background can let the
        // system wallpaper show through (toggled via LauncherPlugin.setShowWallpaper).
        getBridge().getWebView().setBackgroundColor(Color.TRANSPARENT);
        getWindow().setBackgroundDrawable(new ColorDrawable(Color.TRANSPARENT));
    }
}
