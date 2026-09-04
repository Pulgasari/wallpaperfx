package com.wallpaperfx.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.wallpaperfx.app.bridge.WallpaperFxPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(WallpaperFxPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
