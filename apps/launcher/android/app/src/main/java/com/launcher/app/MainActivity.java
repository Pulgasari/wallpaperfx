package com.launcher.app;

import android.content.Intent;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.os.Bundle;

import androidx.activity.OnBackPressedCallback;

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
        // a home activity must never finish on back; the web layer decides what
        // back means (close sheet, close drawer) via the "launcherback" event.
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (getBridge() != null) getBridge().triggerWindowJSEvent("launcherback");
            }
        });
    }

    // home pressed while the launcher is already in front (singleTask): return
    // the web layer to the bare home screen.
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        if (getBridge() != null && intent != null && Intent.ACTION_MAIN.equals(intent.getAction())) {
            getBridge().triggerWindowJSEvent("launcherhome");
        }
    }
}
